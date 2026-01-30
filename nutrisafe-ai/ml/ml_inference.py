# file name: ml_inference.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
import json
from typing import List, Dict, Optional
import os
from pathlib import Path

app = FastAPI(title="Food Safety ML Engine")

class ProductRequest(BaseModel):
    name: str
    ingredients: str
    nutriments: Dict
    categories: Optional[str] = ""
    brand: Optional[str] = ""

class AnalysisRequest(BaseModel):
    product: ProductRequest
    userConditions: List[str]

class DiseaseIngredientAnalyzer:
    def __init__(self):
        # Load ML models
        self.models = self.load_models()
        self.dataset = self.load_datasets()
        
    def load_models(self):
        """Load trained ML models"""
        model_dir = Path("models")
        
        return {
            "risk_model": joblib.load(model_dir / "risk_model.pkl"),
            "classifier": joblib.load(model_dir / "classifier.pkl"),
            "scaler": joblib.load(model_dir / "scaler.pkl"),
            "recommender": joblib.load(model_dir / "recommender.pkl"),
            "product_vectors": np.load(model_dir / "product_vectors.npy"),
            "product_names": pd.read_csv(model_dir / "product_names.csv")["product_name"].tolist()
        }
    
    def load_datasets(self):
        """Load disease and ingredient datasets"""
        with open("datasets/disease_data.json", "r") as f:
            disease_data = json.load(f)
        
        with open("datasets/ingredient_mapping.json", "r") as f:
            ingredient_mapping = json.load(f)
        
        return {
            "disease_data": disease_data,
            "ingredient_mapping": ingredient_mapping
        }
    
    def normalize_ingredient_name(self, ingredient: str) -> str:
        """Normalize ingredient name across languages"""
        ingredient_lower = ingredient.lower().strip()
        
        # Check multi-language mapping
        for eng_name, translations in self.dataset["ingredient_mapping"].items():
            if (ingredient_lower == eng_name or 
                ingredient_lower in translations or
                any(trans in ingredient_lower for trans in translations)):
                return eng_name
        
        # Return original if no match
        return ingredient_lower
    
    def analyze_ingredients(self, ingredients_text: str, user_conditions: List[str]) -> List[Dict]:
        """Analyze each ingredient for disease risks"""
        if not ingredients_text or ingredients_text.lower() in ["", "ingredients not specified"]:
            return []
        
        # Parse ingredients
        ingredients = []
        for ing in ingredients_text.split(','):
            ing = ing.strip()
            if len(ing) > 2:
                ingredients.append(ing)
        
        # Analyze each ingredient
        ingredient_analysis = []
        
        for ingredient in ingredients:
            normalized = self.normalize_ingredient_name(ingredient)
            ingredient_risks = []
            
            for condition in user_conditions:
                condition_lower = condition.lower().replace(" ", "_")
                
                if condition_lower in self.dataset["disease_data"]:
                    disease_info = self.dataset["disease_data"][condition_lower]
                    
                    # Check if ingredient is a trigger
                    risk_level = "safe"
                    for severity, triggers in disease_info["triggers"].items():
                        if any(trigger in normalized for trigger in triggers):
                            risk_level = severity
                            break
                    
                    # Calculate risk score
                    severity_scores = {"critical": 90, "high": 80, "medium": 60, "low": 40, "safe": 10}
                    risk_score = severity_scores.get(risk_level, 10)
                    
                    ingredient_risks.append({
                        "disease": condition,
                        "risk_level": risk_level,
                        "risk_score": risk_score
                    })
            
            # Find highest risk for this ingredient
            if ingredient_risks:
                max_risk = max(ingredient_risks, key=lambda x: x["risk_score"])
                overall_risk = max_risk["risk_level"]
                overall_score = max_risk["risk_score"]
            else:
                overall_risk = "safe"
                overall_score = 10
            
            ingredient_analysis.append({
                "name": ingredient,
                "normalized_name": normalized,
                "risk": overall_risk,
                "risk_score": overall_score,
                "disease_risks": ingredient_risks
            })
        
        return ingredient_analysis
    
    def predict_risk_score(self, product: ProductRequest, user_conditions: List[str]) -> Dict:
        """Predict risk score using ML model - MATCHES TRAINING (12 features)"""
        # For multiple conditions, we need to predict for each and take max
        nutr = product.nutriments
        
        all_predictions = []
        
        for condition in user_conditions:
            condition_lower = condition.lower().replace(" ", "_")
            
            # Disease encoding (must match training)
            disease_encoded = hash(condition_lower) % 100
            
            # Severity flags based on disease (from dataset)
            severity_critical = 0
            severity_high = 0
            severity_medium = 0
            
            if condition_lower in self.dataset["disease_data"]:
                disease_info = self.dataset["disease_data"][condition_lower]
                severity_weight = disease_info.get("severity_weight", 1.0)
                
                if severity_weight >= 1.5:
                    severity_high = 1
                elif severity_weight >= 1.2:
                    severity_medium = 1
            
            # EXACTLY 12 features as trained
            features = np.array([[
                nutr.get("sugars_100g", 0),            # 1
                nutr.get("carbohydrates_100g", 0),     # 2
                nutr.get("salt_100g", 0),              # 3
                nutr.get("fat_100g", 0),               # 4
                nutr.get("saturated_fat_100g", 0),     # 5
                nutr.get("fiber_100g", 0),             # 6
                nutr.get("proteins_100g", 0),          # 7
                nutr.get("energy_kcal_100g", 0),       # 8
                disease_encoded,                       # 9 - disease encoding
                severity_critical,                     # 10 - critical flag
                severity_high,                         # 11 - high flag
                severity_medium                        # 12 - medium flag
            ]])
            
            # Handle NaN values
            features = np.nan_to_num(features)
            
            # Scale features
            features_scaled = self.models["scaler"].transform(features)
            
            # Predict
            pred = self.models["risk_model"].predict(features_scaled)[0]
            all_predictions.append(pred)
        
        # Use worst-case (max) prediction
        ml_risk_score = float(np.max(all_predictions)) if all_predictions else 50.0
        
        # Classify
        is_risky = ml_risk_score > 50
        
        return {
            "ml_score": ml_risk_score,
            "final_score": ml_risk_score,  # For now
            "is_risky": is_risky
        }
    
    def get_healthy_alternatives(self, product: ProductRequest, user_conditions: List[str], n_recommendations: int = 5) -> List[Dict]:
        """Get healthy alternatives using ML recommendation engine"""
        # Prepare product features for similarity search
        nutr = product.nutriments
        
        query_features = np.array([[
            nutr.get("sugars_100g", 0),
            nutr.get("salt_100g", 0),
            nutr.get("saturated_fat_100g", 0),
            nutr.get("fiber_100g", 0),
            nutr.get("proteins_100g", 0),
            nutr.get("energy_kcal_100g", 0),
            70  # Default health score for query
        ]])
        
        # Find similar but healthier products
        distances, indices = self.models["recommender"].kneighbors(
            query_features, 
            n_neighbors=20
        )
        
        alternatives = []
        seen_names = set()
        
        for idx in indices[0]:
            if len(alternatives) >= n_recommendations:
                break
            
            product_name = self.models["product_names"][idx]
            
            # Skip if we've seen this product
            if product_name in seen_names:
                continue
            
            # Get product features
            product_vector = self.models["product_vectors"][idx]
            
            # Calculate health improvement score
            improvement_score = self._calculate_improvement_score(
                query_features[0], product_vector
            )
            
            # Only recommend healthier alternatives
            if improvement_score > 0:
                alternatives.append({
                    "name": product_name,
                    "improvement_score": float(improvement_score),
                    "features": {
                        "sugars": float(product_vector[0]),
                        "salt": float(product_vector[1]),
                        "saturated_fat": float(product_vector[2]),
                        "fiber": float(product_vector[3]),
                        "protein": float(product_vector[4]),
                        "calories": float(product_vector[5])
                    },
                    "reason": self._generate_reason(product_vector, user_conditions)
                })
                seen_names.add(product_name)
        
        # Sort by improvement score
        alternatives.sort(key=lambda x: x["improvement_score"], reverse=True)
        
        return alternatives[:n_recommendations]
    
    def _calculate_improvement_score(self, original: np.ndarray, alternative: np.ndarray) -> float:
        """Calculate how much healthier the alternative is"""
        improvements = []
        
        # Sugar improvement (lower is better)
        if original[0] > 0:
            sugar_improvement = (original[0] - alternative[0]) / original[0] * 100
            improvements.append(max(0, sugar_improvement))
        
        # Salt improvement (lower is better)
        if original[1] > 0:
            salt_improvement = (original[1] - alternative[1]) / original[1] * 100
            improvements.append(max(0, salt_improvement))
        
        # Saturated fat improvement (lower is better)
        if original[2] > 0:
            fat_improvement = (original[2] - alternative[2]) / original[2] * 100
            improvements.append(max(0, fat_improvement))
        
        # Fiber improvement (higher is better)
        fiber_improvement = (alternative[3] - original[3]) * 10
        improvements.append(max(0, fiber_improvement))
        
        # Protein improvement (higher is better)
        protein_improvement = (alternative[4] - original[4]) * 5
        improvements.append(max(0, protein_improvement))
        
        # Calorie improvement (lower is better)
        if original[5] > 0:
            calorie_improvement = (original[5] - alternative[5]) / original[5] * 50
            improvements.append(max(0, calorie_improvement))
        
        return np.mean(improvements) if improvements else 0
    
    def _generate_reason(self, product_features: np.ndarray, user_conditions: List[str]) -> str:
        """Generate reason why this is a good alternative"""
        reasons = []
        
        conditions_lower = [c.lower() for c in user_conditions]
        
        if any("diabetes" in c for c in conditions_lower) and product_features[0] < 5:
            reasons.append("Low sugar for diabetes")
        
        if any("hypertension" in c or "blood pressure" in c for c in conditions_lower) and product_features[1] < 1:
            reasons.append("Low sodium for blood pressure")
        
        if any("heart" in c or "cholesterol" in c for c in conditions_lower) and product_features[2] < 3:
            reasons.append("Low saturated fat for heart health")
        
        if product_features[3] > 5:
            reasons.append("High fiber")
        
        if product_features[4] > 10:
            reasons.append("Good protein")
        
        if product_features[5] < 200:
            reasons.append("Low calorie")
        
        return "; ".join(reasons) if reasons else "Healthier alternative"

# Initialize analyzer
analyzer = DiseaseIngredientAnalyzer()

@app.post("/analyze")
async def analyze_product(request: AnalysisRequest):
    """Analyze product for health risks"""
    try:
        # Step 1: Predict risk score using ML
        risk_prediction = analyzer.predict_risk_score(request.product, request.userConditions)
        
        # Step 2: Analyze ingredients
        ingredient_analysis = analyzer.analyze_ingredients(
            request.product.ingredients, 
            request.userConditions
        )
        
        # Step 3: Get healthy alternatives
        alternatives = analyzer.get_healthy_alternatives(
            request.product, 
            request.userConditions,
            n_recommendations=3
        )
        
        # Step 4: Determine risk level
        final_score = risk_prediction["final_score"]
        if final_score > 80:
            risk_level = "high"
        elif final_score > 50:
            risk_level = "medium"
        else:
            risk_level = "safe"
        
        # Step 5: Prepare response
        return {
    "risk_score": int(final_score),
    "risk_level": risk_level,
    "ingredient_analysis": [
        {
            "name": ing["name"],
            "risk": ing["risk"],
            "risk_score": ing["risk_score"]
        }
        for ing in ingredient_analysis
    ],
    "alternatives": [
        {
            "name": alt["name"],
            "reason": alt.get("reason", "Healthier alternative"),
            "match_score": alt.get("improvement_score", 75)
        }
        for alt in alternatives
    ]
}
        
    except Exception as e:
        import traceback
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "models_loaded": True,
        "diseases_loaded": len(analyzer.dataset["disease_data"]),
        "alternatives_count": len(analyzer.models["product_names"])
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)