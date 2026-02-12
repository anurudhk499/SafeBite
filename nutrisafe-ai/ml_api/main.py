from fastapi import FastAPI
import joblib
import numpy as np
import pandas as pd
import os
 
app = FastAPI(title="NutriSafe AI – ML Engine")

DISEASE_WEIGHTS = {
    # Metabolic
    "diabetes": 1.5,
    "pcos": 1.2,
    "obesity": 1.2,
    "gout": 1.1,

    # Cardiovascular
    "heart_disease": 1.6,
    "cholesterol": 1.4,
    "hypertension": 1.3,

    # Renal
    "kidney": 1.4,

    # Digestive
    "ibs": 0.8,
    "acid_reflux": 0.9,

    # Intolerances
    "gluten": 1.0,
    "lactose": 1.0
}
# ---------------- LOAD MODELS ----------------
import os
from pathlib import Path

# Get the directory where main.py is located
BASE_DIR = Path(__file__).parent.absolute()
MODEL_DIR = BASE_DIR / "models"

print(f"Looking for models in: {MODEL_DIR}")

# Check if models exist
if not MODEL_DIR.exists():
    raise FileNotFoundError(f"Models directory not found at: {MODEL_DIR}")

# Load models with explicit paths
risk_model = joblib.load(MODEL_DIR / "risk_model.pkl")
scaler = joblib.load(MODEL_DIR / "scaler.pkl")
knn = joblib.load(MODEL_DIR / "recommender.pkl")
product_vectors = np.load(MODEL_DIR / "product_vectors.npy")
product_data = pd.read_csv(MODEL_DIR / "product_names.csv")

print("✓ All models loaded successfully!")
# ---------------- LOAD MODELS ----------------
product_names = product_data["product_name"].tolist()
product_categories = product_data["category"].tolist()

DISEASES = [
    "diabetes", "obesity", "pcos", "gout",
    "hypertension", "heart_disease", "cholesterol",
    "kidney", "ibs", "acid_reflux", "gluten", "lactose"
]

# ---------------- HELPERS ----------------
def risk_level(score: float):
    if score > 80:
        return "high"
    elif score > 40:
        return "medium"
    return "low"

def detect_product_category(product_name: str) -> str:
    """Detect category from product name"""
    name = product_name.lower()
    
    if any(word in name for word in ["soda", "cola", "juice", "drink", "water", "tea", "coffee"]):
        return "Beverages"
    elif any(word in name for word in ["chips", "crisp", "cracker", "popcorn", "snack"]):
        return "Snacks"
    elif any(word in name for word in ["chocolate", "candy", "cookie", "cake", "sweet"]):
        return "Sweets"
    elif any(word in name for word in ["bread", "pasta", "oats", "cereal", "rice", "grain"]):
        return "Grains"
    elif any(word in name for word in ["yogurt", "milk", "cheese", "dairy", "cream"]):
        return "Dairy"
    elif any(word in name for word in ["burger", "meat", "chicken", "fish", "protein"]):
        return "Protein"
    elif any(word in name for word in ["sauce", "dressing", "oil", "mayo", "condiment"]):
        return "Condiments"
    return "General"

# ---------------- API ----------------
@app.post("/analyze")
def analyze(payload: dict):
    product = payload.get("product", {})
    ingredients_text = (
        product.get("ingredients") or 
        product.get("ingredients_text") or ""
    )
    ingredients_text = ingredients_text.lower()

    # ---------------- INGREDIENT RISK TAGGING ----------------
    ingredient_risk = []

    for ing in ingredients_text.split(","):
        ing = ing.strip()
        if not ing or len(ing) < 3:
            continue

        risk = "low"

        if any(k in ing for k in ["sugar", "syrup", "glucose", "fructose"]):
            risk = "high"
        elif any(k in ing for k in ["salt", "sodium", "fat", "oil"]):
            risk = "medium"

        ingredient_risk.append({
            "name": ing,
            "risk": risk
        })

    user_conditions = [c.lower() for c in payload.get("userConditions", [])]

    nutr = product.get("nutriments", {})

    X = np.array([[
        nutr.get("sugars_100g", 0),
        nutr.get("carbohydrates_100g", 0),
        nutr.get("salt_100g", 0),
        nutr.get("fat_100g", 0),
        nutr.get("saturated-fat_100g", 0),
        nutr.get("fiber_100g", 0),
        nutr.get("proteins_100g", 0),
        nutr.get("energy-kcal_100g", 0),
        3
    ]])

    X = np.nan_to_num(X)
    X_scaled = scaler.transform(X)

    # ---------------- ML RISK PREDICTION ----------------
    disease_scores = risk_model.predict(X_scaled)[0]
    disease_risk = dict(zip(DISEASES, disease_scores))

    # ---------------- WEIGHTED RISK AGGREGATION ----------------
    weighted_sum = 0.0
    weight_total = 0.0

    for disease, score in disease_risk.items():
        for cond in user_conditions:
            if disease.replace("_", " ") in cond.lower():
                weight = DISEASE_WEIGHTS.get(disease, 1.0)
                weighted_sum += score * weight
                weight_total += weight

    # If user selected diseases, use weighted score
    if weight_total > 0:
        final_risk = weighted_sum / weight_total
    else:
        # Fallback: overall population risk
        final_risk = np.mean(list(disease_risk.values()))

    # ---------------- ML RECOMMENDATION WITH CATEGORY MATCHING ----------------
    distances, indices = knn.kneighbors(X[:, :7], n_neighbors=20)
    
    # Detect original product category
    original_product_name = product.get("name", "") or product.get("product_name", "")
    original_category = detect_product_category(original_product_name)
    
    alternatives = []
    original_energy = nutr.get("energy-kcal_100g", 0)
    
    # First pass: Collect all candidates
    candidates = []
    for idx in indices[0]:
        if idx < len(product_names):
            name = product_names[idx]
            category = product_categories[idx] if idx < len(product_categories) else "General"
            
            # Skip very short / noisy names
            if len(name) < 6:
                continue
            
            # Energy-based sanity filter
            candidate_energy = product_vectors[idx][5]  # energy_kcal
            if candidate_energy > original_energy * 1.5:  # Allow some variation
                continue
            
            # Calculate match score (distance to similarity)
            distance = distances[0][list(indices[0]).index(idx)]
            similarity_score = (1 - distance) * 100
            
            # Boost score for same category
            if category == original_category:
                similarity_score += 15
            
            candidates.append({
                "name": name,
                "category": category,
                "score": min(95, similarity_score),
                "same_category": category == original_category,
                "energy": candidate_energy
            })
    
    # Sort by: same category first, then score
    candidates.sort(key=lambda x: (-x["same_category"], -x["score"]))
    
    # Take top 5 unique products
    seen_names = set()
    for candidate in candidates:
        if len(alternatives) >= 5:
            break
        if candidate["name"] not in seen_names:
            seen_names.add(candidate["name"])
            alternatives.append({
                "name": candidate["name"],
                "category": candidate["category"],
                "match_score": candidate["score"]
            })

    return {
        "risk_score": int(final_risk),
        "risk_level": risk_level(final_risk),
        "ingredient_analysis": ingredient_risk,
        "disease_breakdown": disease_risk,
        "alternatives": alternatives
    }


@app.get("/")
def health():

    return {"status": "ML API running"}

