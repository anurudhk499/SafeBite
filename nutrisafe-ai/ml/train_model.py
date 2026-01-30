import pandas as pd
import numpy as np
import json
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.neighbors import NearestNeighbors
import joblib
import os
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class FoodSafetyModel:
    def __init__(self):
        self.dataset = self.load_datasets()
        self.scaler = StandardScaler()
        self.risk_model = None
        self.recommender = None
        self.ingredient_encoder = LabelEncoder()
        self.disease_encoder = LabelEncoder()
    
    def load_datasets(self):
        """Load all datasets"""
        base_path = Path("datasets")
        
        # Load disease data
        with open(base_path / "disease_data.json", "r") as f:
            disease_data = json.load(f)
        
        # Load ingredient mapping
        with open(base_path / "ingredient_mapping.json", "r") as f:
            ingredient_mapping = json.load(f)
        
        # Load OpenFoodFacts data if available
        try:
            off_data = pd.read_csv(base_path / "openfoodfacts_sample.csv")
        except:
            print("OpenFoodFacts data not found, using synthetic data")
            off_data = None
        
        return {
            "disease_data": disease_data,
            "ingredient_mapping": ingredient_mapping,
            "off_data": off_data
        }
    
    def prepare_training_data(self):
        """Prepare comprehensive training data"""
        # Load generated training data
        training_data = pd.read_csv("datasets/training_data.csv")
        
        # Add OpenFoodFacts data if available
        if self.dataset["off_data"] is not None:
            off_data = self.dataset["off_data"]
            # Enrich with disease-specific labels
            off_data = self._label_off_data(off_data)
            training_data = pd.concat([training_data, off_data], ignore_index=True)
        
        # Feature engineering
        X = self._extract_features(training_data)
        y = training_data[["risk_score", "is_risky"]].values
        
        return X, y
    
    def _extract_features(self, data: pd.DataFrame) -> np.ndarray:
        """Extract features from data - FIXED INDENTATION"""
        features = []
        
        for _, row in data.iterrows():
            # Convert nutrients dict to features
            if isinstance(row["nutrients"], str):
                nutrients = eval(row["nutrients"])
            else:
                nutrients = row["nutrients"]
            
            # Disease encoding
            disease_encoded = hash(row["disease"]) % 100
            
            # 12 features exactly
            ingredient_features = [
                nutrients.get("sugars_100g", 0),           # 1
                nutrients.get("carbohydrates_100g", 0),    # 2
                nutrients.get("salt_100g", 0),             # 3
                nutrients.get("fat_100g", 0),              # 4
                nutrients.get("saturated_fat_100g", 0),    # 5
                nutrients.get("fiber_100g", 0),            # 6
                nutrients.get("proteins_100g", 0),         # 7
                nutrients.get("energy_kcal_100g", 0),      # 8
                disease_encoded,                           # 9
                1 if row["severity"] == "critical" else 0, # 10
                1 if row["severity"] == "high" else 0,     # 11
                1 if row["severity"] == "medium" else 0    # 12
            ]
            
            features.append(ingredient_features)
        
        return np.array(features)
    
    def _label_off_data(self, off_data: pd.DataFrame) -> pd.DataFrame:
        """Label OpenFoodFacts data with disease risks"""
        labeled_data = []
        
        for _, row in off_data.iterrows():
            ingredients = str(row.get("ingredients_text", "")).lower()
            
            # Check each disease
            for disease, info in self.dataset["disease_data"].items():
                risk_detected = False
                severity = "safe"
                
                # Check triggers
                for severity_level, triggers in info["triggers"].items():
                    for trigger in triggers:
                        if trigger in ingredients:
                            risk_detected = True
                            severity = severity_level
                            break
                    if risk_detected:
                        break
                
                # Calculate risk score
                risk_score = self._calculate_risk_score(row, disease, severity)
                
                labeled_data.append({
                    "disease": disease,
                    "ingredient": ingredients[:100],  # First 100 chars
                    "nutrients": {
                        "sugars_100g": row.get("sugars_100g", 0),
                        "carbohydrates_100g": row.get("carbohydrates_100g", 0),
                        "salt_100g": row.get("salt_100g", 0),
                        "fat_100g": row.get("fat_100g", 0),
                        "saturated_fat_100g": row.get("saturated-fat_100g", 0),
                        "fiber_100g": row.get("fiber_100g", 0),
                        "proteins_100g": row.get("proteins_100g", 0),
                        "energy_kcal_100g": row.get("energy-kcal_100g", 0)
                    },
                    "is_risky": 1 if risk_detected else 0,
                    "risk_score": risk_score,
                    "severity": severity
                })
        
        return pd.DataFrame(labeled_data)
    
    def _calculate_risk_score(self, product: pd.Series, disease: str, severity: str) -> float:
        """Calculate risk score based on nutrients and disease"""
        base_scores = {
            "critical": 90,
            "high": 80,
            "medium": 60,
            "low": 40,
            "safe": 10
        }
        
        score = base_scores.get(severity, 10)
        
        # Adjust based on nutrient values
        disease_info = self.dataset["disease_data"].get(disease, {})
        
        if "thresholds" in disease_info:
            thresholds = disease_info["thresholds"]
            
            if "sugar_g_per_100g" in thresholds and "sugars_100g" in product:
                if product["sugars_100g"] > thresholds["sugar_g_per_100g"]:
                    score += 20
            
            if "salt_g_per_100g" in thresholds and "salt_100g" in product:
                if product["salt_100g"] > thresholds["salt_g_per_100g"]:
                    score += 15
            
            if "saturated_fat_g" in thresholds and "saturated-fat_100g" in product:
                if product["saturated-fat_100g"] > thresholds["saturated_fat_g"]:
                    score += 15
        
        return min(100, score)
    
    def train_risk_model(self):
        """Train the risk prediction model"""
        print("Preparing training data...")
        X, y = self.prepare_training_data()
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print(f"Training data shape: {X_train.shape}")
        print(f"Test data shape: {X_test.shape}")
        
        # Train model for risk score prediction (regression)
        print("Training risk prediction model...")
        self.risk_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        
        # Train for risk scores
        self.risk_model.fit(X_train_scaled, y_train[:, 0])
        
        # Evaluate
        train_score = self.risk_model.score(X_train_scaled, y_train[:, 0])
        test_score = self.risk_model.score(X_test_scaled, y_test[:, 0])
        
        print(f"Training R² score: {train_score:.3f}")
        print(f"Test R² score: {test_score:.3f}")
        
        # Train classifier for risky/not risky
        self.classifier = RandomForestClassifier(n_estimators=50, random_state=42)
        self.classifier.fit(X_train_scaled, y_train[:, 1])
        
        clf_score = self.classifier.score(X_test_scaled, y_test[:, 1])
        print(f"Classifier accuracy: {clf_score:.3f}")
        
        return train_score, test_score
    
    def build_recommendation_engine(self):
        """Build recommendation engine for healthy alternatives"""
        print("Building recommendation engine...")
        
        # Load product data for recommendations
        try:
            products = pd.read_csv("datasets/healthy_products.csv")
        except:
            print("Healthy products dataset not found, creating synthetic...")
            products = self._create_healthy_products()
        
        # Extract product features
        product_features = []
        product_names = []
        product_categories = []
        product_subcategories = []
        
        for _, row in products.iterrows():
            features = [
                row.get("sugars_100g", 0),
                row.get("salt_100g", 0),
                row.get("saturated_fat_100g", 0),
                row.get("fiber_100g", 0),
                row.get("proteins_100g", 0),
                row.get("energy_kcal_100g", 0),
                row.get("health_score", 70)
            ]
            product_features.append(features)
            product_names.append(row["product_name"])
            product_categories.append(row.get("category", "General"))
            product_subcategories.append(row.get("subcategory", ""))
        
        product_features = np.array(product_features)
        
        # Store in instance variables
        self.product_vectors = product_features
        self.product_names = product_names
        self.product_categories = product_categories
        self.product_subcategories = product_subcategories
        
        # Train nearest neighbors model
        self.recommender = NearestNeighbors(n_neighbors=10, metric='euclidean')
        self.recommender.fit(product_features)
        
        print(f"Recommendation engine trained with {len(products)} products")
        
        return product_features.shape
    
    def _create_healthy_products(self):
        """Create synthetic healthy products dataset"""
        healthy_products = []
        
        categories = [
            "Snacks", "Beverages", "Dairy", "Grains", 
            "Proteins", "Fruits", "Vegetables", "Condiments"
        ]
        
        for i in range(100):
            category = np.random.choice(categories)
            
            # Healthier nutrient profiles
            nutrients = {
                "sugars_100g": np.random.uniform(0, 10),
                "salt_100g": np.random.uniform(0, 1),
                "saturated_fat_100g": np.random.uniform(0, 3),
                "fiber_100g": np.random.uniform(2, 10),
                "proteins_100g": np.random.uniform(5, 20),
                "energy_kcal_100g": np.random.uniform(50, 300),
                "health_score": np.random.uniform(60, 95)
            }
            
            product_name = f"Healthy {category} Option {i+1}"
            
            healthy_products.append({
                "product_name": product_name,
                "category": category,
                "subcategory": "",
                **nutrients
            })
        
        df = pd.DataFrame(healthy_products)
        df.to_csv("datasets/healthy_products.csv", index=False)
        
        return df
    
    def save_models(self):
        """Save all trained models"""
        model_dir = Path("models")
        model_dir.mkdir(exist_ok=True)
        
        # Save models
        joblib.dump(self.risk_model, model_dir / "risk_model.pkl")
        joblib.dump(self.classifier, model_dir / "classifier.pkl")
        joblib.dump(self.scaler, model_dir / "scaler.pkl")
        joblib.dump(self.recommender, model_dir / "recommender.pkl")
        
        # Save product data for recommendations
        np.save(model_dir / "product_vectors.npy", self.product_vectors)
        
        # Ensure categories exist and match length
        if not hasattr(self, 'product_categories') or len(self.product_categories) != len(self.product_names):
            self.product_categories = ["General"] * len(self.product_names)
            self.product_subcategories = [""] * len(self.product_names)
        
        # Save WITH categories
        product_df = pd.DataFrame({
            "product_name": self.product_names,
            "category": self.product_categories,
            "subcategory": self.product_subcategories
        })
        product_df.to_csv(model_dir / "product_names.csv", index=False)
        
        # Save dataset info
        with open(model_dir / "dataset_info.json", "w") as f:
            json.dump({
                "disease_count": len(self.dataset["disease_data"]),
                "ingredient_mapping_count": len(self.dataset["ingredient_mapping"]),
                "training_samples": len(self.product_names)
            }, f, indent=2)
        
        print("Models saved successfully!")
    
    def train_full_pipeline(self):
        """Train complete ML pipeline"""
        print("=" * 50)
        print("FOOD SAFETY ML PIPELINE TRAINING")
        print("=" * 50)
        
        # Step 1: Train risk model
        self.train_risk_model()
        
        # Step 2: Build recommendation engine
        self.build_recommendation_engine()
        
        # Step 3: Save everything
        self.save_models()
        
        print("\n" + "=" * 50)
        print("TRAINING COMPLETE!")
        print("=" * 50)

if __name__ == "__main__":
    import sys
    sys.path.append('.')
    from datasets.disease_ingredients import DiseaseIngredientDataset
    
    print("Creating datasets...")
    dataset_creator = DiseaseIngredientDataset()
    dataset_creator.save_datasets()
    
    # Train models
    model = FoodSafetyModel()
    model.train_full_pipeline()