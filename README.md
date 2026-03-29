# 🧠 SafeBite  – Intelligent Food Safety Analyzer
### “Barcode-Driven Ingredient Risk Analysis for Disease Mitigation & Healthier Alternative Recommendation Using AI”

SafeBite is an AI-powered food analysis system that helps users make **health-aware dietary decisions** by analyzing packaged food products based on their **ingredients, nutritional values, and personal medical conditions**.

The system combines **Machine Learning + Real-Time APIs + Barcode Scanning** to deliver **personalized risk predictions and healthier alternatives**.

---

# 📌 Problem Statement

Many people suffering from health conditions such as:

* Diabetes
* Hypertension
* Cholesterol
* Heart Disease
* Lactose Intolerance

face difficulty in identifying whether a packaged food product is **safe or harmful**.

### ❌ Challenges:

* Ingredients are complex and hard to understand
* Hidden sugars, salts, and fats
* No personalized dietary guidance
* Lack of intelligent food recommendation systems

---

# 💡 Solution

SafeBite AI solves this problem by:

✔ Scanning food products using barcode
✔ Extracting ingredient & nutritional data
✔ Applying machine learning for risk prediction
✔ Providing personalized health insights
✔ Recommending healthier alternatives

---

# 🏗️ System Architecture

```
User (Frontend - React)
        ↓
Node.js Backend (API Layer)
        ↓
FastAPI ML Service (Prediction Engine)
        ↓
Machine Learning Model
        ↓
Response (Risk + Alternatives)
```

---

# 🔄 Workflow

1. User scans product barcode
2. Product data is fetched (ingredients + nutriments)
3. Data is sent to backend
4. Backend calls ML API
5. ML model analyzes data
6. Risk score & level are generated
7. Results displayed in UI

---

# 🧠 Machine Learning Pipeline

### 1️⃣ Data Collection

* Dataset: OpenFoodFacts
* Contains:

  * Ingredients
  * Nutritional values
  * Product details

---

### 2️⃣ Data Preprocessing

* Removed missing values
* Cleaned ingredient text
* Selected key features:

  * Sugar
  * Fat
  * Salt
  * Carbohydrates

---

### 3️⃣ Feature Engineering

* Created meaningful features:

  * High sugar → Diabetes risk
  * High salt → Hypertension
  * High fat → Heart disease

---

### 4️⃣ Model Training

We used:

👉 **Random Forest Regressor**

### Why?

* Works well with structured data
* Handles non-linear relationships
* High accuracy and stability

---

### 5️⃣ Model Saving

* Saved using joblib:

```
model.pkl
scaler.pkl
```

---

### 6️⃣ Prediction Pipeline (Runtime)

1. Extract nutritional values
2. Convert to feature vector
3. Apply scaling
4. Pass to model
5. Generate disease-wise risk scores

---

# 📊 Risk Calculation

Final risk is calculated based on:

* Model predictions
* Selected user conditions

---

### 🔢 Risk Levels

| Score Range | Level       |
| ----------- | ----------- |
| 0 – 40      | 🟢 Safe     |
| 40 – 80     | 🟡 Moderate |
| 80+         | 🔴 Avoid    |

---

# 🧪 Example

👉 If a diabetic user scans a sugary drink:

* High sugar detected ❗
* Risk Score → High
* Risk Level → 🔴 Avoid
* Alternatives → Low sugar options suggested

---

# 🔍 Ingredient Analysis

Each ingredient is analyzed and classified as:

* Safe
* Moderate
* High Risk

Based on disease-specific rules.

---

# 🔄 Alternative Recommendation System

The system suggests:

* Healthier food options
* Based on lower risk score
* Personalized for user conditions

---

# ⚙️ Tech Stack

## Frontend

* React.js
* Tailwind CSS
* Axios

## Backend

* Node.js
* Express.js

## ML API

* FastAPI
* Scikit-learn
* Pandas
* NumPy

---

# 📂 Project Structure

```
nutrisafe-ai/
│
├── client/          # React frontend
├── server/          # Node.js backend
├── ml_api/          # FastAPI ML service
│   ├── main.py
│   ├── model.pkl
│   ├── scaler.pkl
│
└── README.md
```

---

# 🔌 API Flow

## Frontend → Backend

```
POST /analyze
{
  "barcode": "123456",
  "conditions": ["Diabetes"]
}
```

---

## Backend → ML API

```
{
  "product": {
    "ingredients": "...",
    "nutriments": {...}
  },
  "userConditions": ["Diabetes"]
}
```

---

## ML API → Backend Response

```
{
  "risk_score": 70,
  "risk_level": "medium",
  "ingredient_analysis": [],
  "alternatives": []
}
```

---

# ▶️ How to Run Locally

## 1️⃣ Clone Repository

```
git clone https://github.com/your-username/safebite-ai.git
cd safebite-ai
```

---

## 2️⃣ Start Backend

```
cd server
npm install
node server.js
```

---

## 3️⃣ Start ML API

```
cd ml_api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 4️⃣ Start Frontend

```
cd client
npm install
npm run dev
```

---

# ⚠️ Challenges Faced

* Handling inconsistent ingredient data
* ML model integration with backend
* API failures and fallback logic
* Multi-language ingredient issues

---

# 🔮 Future Improvements

* 🌍 Multi-language ingredient detection
* 📱 Mobile app version
* 🤖 Advanced deep learning model
* 📷 Image-based food recognition

---

# 🎯 Conclusion

SafeBite AI provides a smart and practical solution for **personalized food safety analysis** using AI. It empowers users to make healthier dietary choices by combining **data, machine learning, and real-time insights**.

---

# 👨‍💻 Author

**Anurudh K**
AI/ML Developer

---

# ⭐ Support

If you found this project useful, please give it a ⭐ on GitHub!
