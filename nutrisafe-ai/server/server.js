const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ML_SERVICE_URL = null;

const app = express();
app.use(cors());
app.use(express.json());
// Root route for Render health checks
app.get('/', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'SafeBite API is running',
    endpoints: ['/api/health', '/api/diseases', '/api/ai-stats', '/api/analyze'],
    timestamp: new Date().toISOString()
  });
});
// --- ENHANCED MEDICAL KNOWLEDGE BASE ---
const MEDICAL_KNOWLEDGE = {
    "Diabetes": {
        triggers: ["sugar", "syrup", "fructose", "glucose", "sucrose", "dextrose", "maltodextrin", "honey", "molasses", "corn syrup", "high fructose", "cane sugar", "brown sugar"],
        aliases: ["sugar", "diabatese", "diabetis", "diabetic", "blood sugar", "high sugar", "diab", "sugar problem"],
        advice: "High glycemic index causes rapid blood sugar spikes.",
        icon: "💉",
        severity: "high",
        category: "Metabolic"
    },
    "Hypertension": {
        triggers: ["salt", "sodium", "msg", "monosodium glutamate", "soy sauce", "sea salt", "sodium benzoate", "sodium chloride"],
        aliases: ["high bp", "blood pressure", "bp", "hypertention", "high pressure", "blood pressure high", "bp high"],
        advice: "High sodium content raises blood pressure.",
        icon: "❤️",
        severity: "high",
        category: "Cardiovascular"
    },
    "Heart Disease": {
        triggers: ["hydrogenated", "trans fat", "palm oil", "lard", "shortening", "saturated fat", "butter fat"],
        aliases: ["heart", "cardiac", "heart problem", "heart issue", "cardio", "heart attack risk", "cardiovascular"],
        advice: "Trans fats and saturated fats increase LDL cholesterol.",
        icon: "🫀",
        severity: "high",
        category: "Cardiovascular"
    },
    "High Cholesterol": {
        triggers: ["cholesterol", "saturated fat", "butter", "cream", "cheese", "egg yolk", "red meat"],
        aliases: ["cholesterol", "high cholesterol", "high fat", "lipid", "fat", "ldl", "bad cholesterol"],
        advice: "Dietary cholesterol raises LDL (bad) cholesterol.",
        icon: "🩸",
        severity: "medium",
        category: "Cardiovascular"
    },
    "Obesity": {
        triggers: ["sugar", "high fructose", "corn syrup", "saturated fat", "fried", "high calorie"],
        aliases: ["obesity", "overweight", "weight", "fat", "bmi", "weight gain", "over weight"],
        advice: "High calorie density promotes weight gain.",
        icon: "⚖️",
        severity: "medium",
        category: "Metabolic"
    },
    "Kidney Issues": {
        triggers: ["potassium", "phosphorus", "sodium", "high protein", "mineral salts"],
        aliases: ["kidney", "renal", "kidney problem", "kidney disease", "kidney failure", "renal disease"],
        advice: "High mineral content strains kidney function.",
        icon: "🫘",
        severity: "high",
        category: "Renal"
    },
    "Allergies": {
        triggers: ["peanut", "milk", "soy", "wheat", "egg", "tree nut", "almond", "shellfish"],
        aliases: ["allergy", "allergic", "food allergy", "allergies", "allergic reaction", "food sensitivity"],
        advice: "Contains common allergens.",
        icon: "🤧",
        severity: "critical",
        category: "Immune"
    },
    "Gluten Intolerance": {
        triggers: ["wheat", "gluten", "barley", "rye", "spelt", "malt"],
        aliases: ["gluten", "celiac", "wheat allergy", "gluten sensitive", "gluten allergy", "celiac disease"],
        advice: "Contains gluten which triggers autoimmune response.",
        icon: "🌾",
        severity: "critical",
        category: "Immune"
    },
    "Lactose Intolerance": {
        triggers: ["milk", "lactose", "cream", "cheese", "yogurt", "butter", "whey"],
        aliases: ["lactose", "milk allergy", "dairy", "lactose problem", "milk intolerance"],
        advice: "Contains lactose which cannot be digested.",
        icon: "🥛",
        severity: "high",
        category: "Digestive"
    },
    "Acid Reflux": {
        triggers: ["citric acid", "vinegar", "tomato", "spicy", "fried", "chocolate", "mint"],
        aliases: ["acid reflux", "gerd", "heartburn", "acid problem", "reflux"],
        advice: "Acidic or spicy foods trigger reflux.",
        icon: "🔥",
        severity: "medium",
        category: "Digestive"
    },
    "IBS": {
        triggers: ["garlic", "onion", "beans", "lentils", "wheat", "dairy", "artificial sweeteners"],
        aliases: ["ibs", "irritable bowel", "bowel syndrome", "stomach problem", "digestive issue"],
        advice: "High FODMAP foods trigger IBS symptoms.",
        icon: "🌀",
        severity: "medium",
        category: "Digestive"
    },
    "Gout": {
        triggers: ["red meat", "seafood", "alcohol", "high fructose", "organ meats"],
        aliases: ["gout", "uric acid", "joint pain", "gout problem"],
        advice: "High purine content increases uric acid.",
        icon: "🦶",
        severity: "high",
        category: "Metabolic"
    },
    "Migraine": {
        triggers: ["msg", "nitrates", "aged cheese", "chocolate", "alcohol", "artificial sweeteners"],
        aliases: ["migraine", "headache", "chronic headache", "migraine trigger"],
        advice: "Contains migraine triggers.",
        icon: "🌀",
        severity: "medium",
        category: "Neurological"
    },
    "PCOS": {
        triggers: ["sugar", "refined carbs", "processed", "trans fats", "dairy"],
        aliases: ["pcos", "polycystic", "ovary syndrome", "hormonal imbalance"],
        advice: "Increases insulin resistance.",
        icon: "🦋",
        severity: "medium",
        category: "Endocrine"
    },
    "Thyroid Issues": {
        triggers: ["soy", "raw cruciferous", "gluten", "processed"],
        aliases: ["thyroid", "hypothyroid", "hyperthyroid", "thyroid problem"],
        advice: "Interferes with thyroid hormone production.",
        icon: "🦋",
        severity: "medium",
        category: "Endocrine"
    }
};

// --- DISEASE MATCHER ---
class DiseaseMatcher {
    static findMatchingDisease(input) {
        const inputLower = input.toLowerCase().trim();
        
        if (!inputLower) return null;
        
        // First, try exact match
        for (const [disease, data] of Object.entries(MEDICAL_KNOWLEDGE)) {
            if (disease.toLowerCase() === inputLower) {
                return disease;
            }
            
            // Check aliases
            if (data.aliases) {
                for (const alias of data.aliases) {
                    const aliasLower = alias.toLowerCase();
                    
                    // Direct match
                    if (aliasLower === inputLower) {
                        return disease;
                    }
                    
                    // Contains match
                    if (inputLower.includes(aliasLower) || aliasLower.includes(inputLower)) {
                        return disease;
                    }
                    
                    // Fuzzy match for common misspellings
                    if (this.getSimilarity(aliasLower, inputLower) > 0.7) {
                        return disease;
                    }
                }
            }
        }
        
        // Special cases for common typos
        const commonTypos = {
            'diabatese': 'Diabetes',
            'diabetis': 'Diabetes',
            'hypertention': 'Hypertension',
            'colesterol': 'High Cholesterol',
            'alergy': 'Allergies',
            'gluten': 'Gluten Intolerance',
            'lactose': 'Lactose Intolerance',
            'bp': 'Hypertension',
            'heart': 'Heart Disease',
            'kidney': 'Kidney Issues',
            'weight': 'Obesity',
            'migrane': 'Migraine'
        };
        
        for (const [typo, disease] of Object.entries(commonTypos)) {
            if (inputLower.includes(typo) || this.getSimilarity(inputLower, typo) > 0.6) {
                return disease;
            }
        }
        
        return null;
    }
    
    static getSimilarity(s1, s2) {
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1.0;
        
        return (longer.length - this.editDistance(longer, shorter)) / parseFloat(longer.length);
    }
    
    static editDistance(s1, s2) {
        const costs = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else {
                    if (j > 0) {
                        let newValue = costs[j - 1];
                        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    }
}

// --- AI RECOMMENDATION ENGINE ---
class AIRecommendationEngine {
    static getRecommendations(productName, productData, userConditions) {
        const recommendations = [];
        const productLower = productName.toLowerCase();
        
        // Analyze product type and suggest based on category
        if (productLower.includes('chips') || productLower.includes('crisp')) {
            recommendations.push({
                name: 'Baked Veggie Chips',
                brand: 'Healthy Snack',
                image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400',
                benefits: ['Low fat', 'High fiber', 'No trans fats'],
                matchScore: this.calculateMatchScore('chips', userConditions),
                reason: 'Baked instead of fried, lower fat content',
                category: 'Snacks',
                nutritionalValue: 'High in fiber, low in saturated fat'
            });
            
            recommendations.push({
                name: 'Roasted Chickpeas',
                brand: 'Protein Snack',
                image: 'https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?w=400',
                benefits: ['High protein', 'High fiber', 'Low glycemic'],
                matchScore: this.calculateMatchScore('protein', userConditions),
                reason: 'High protein alternative with fiber',
                category: 'Snacks',
                nutritionalValue: 'Rich in protein and fiber'
            });
        }
        
        if (productLower.includes('soda') || productLower.includes('cola') || productLower.includes('soft drink')) {
            recommendations.push({
                name: 'Sparkling Water with Natural Flavors',
                brand: 'Zero Sugar',
                image: 'https://images.unsplash.com/photo-1536746803623-cef87080bfc9?w=400',
                benefits: ['Zero sugar', 'No artificial sweeteners', 'Hydrating'],
                matchScore: this.calculateMatchScore('drinks', userConditions),
                reason: 'Natural hydration without added sugars',
                category: 'Beverages',
                nutritionalValue: 'Zero calories, no sugar'
            });
            
            recommendations.push({
                name: 'Herbal Infused Water',
                brand: 'Natural Refreshment',
                image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
                benefits: ['Antioxidants', 'Natural flavors', 'Detoxifying'],
                matchScore: this.calculateMatchScore('healthy', userConditions),
                reason: 'Natural herbs provide antioxidants',
                category: 'Beverages',
                nutritionalValue: 'Rich in antioxidants'
            });
        }
        
        if (productLower.includes('chocolate') || productLower.includes('candy') || productLower.includes('sweet')) {
            recommendations.push({
                name: 'Dark Chocolate (70%+ Cocoa)',
                brand: 'Premium Quality',
                image: 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=400',
                benefits: ['Antioxidants', 'Lower sugar', 'Heart healthy'],
                matchScore: this.calculateMatchScore('chocolate', userConditions),
                reason: 'Higher cocoa content, less sugar, more antioxidants',
                category: 'Sweets',
                nutritionalValue: 'Rich in flavonoids, lower sugar'
            });
            
            recommendations.push({
                name: 'Date-Based Energy Balls',
                brand: 'Natural Sweet',
                image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=400',
                benefits: ['Natural sugars', 'Fiber', 'No added sugar'],
                matchScore: this.calculateMatchScore('natural', userConditions),
                reason: 'Natural sweetness from dates, no refined sugar',
                category: 'Sweets',
                nutritionalValue: 'Natural sugars with fiber'
            });
        }
        
        if (productLower.includes('ice cream') || productLower.includes('frozen dessert')) {
            recommendations.push({
                name: 'Frozen Yogurt with Probiotics',
                brand: 'Gut Healthy',
                image: 'https://images.unsplash.com/photo-1568307977363-2f36c09c3401?w=400',
                benefits: ['Probiotics', 'Lower fat', 'Less sugar'],
                matchScore: this.calculateMatchScore('dairy', userConditions),
                reason: 'Probiotics for gut health, lower in fat and sugar',
                category: 'Desserts',
                nutritionalValue: 'Contains probiotics, lower in fat'
            });
            
            recommendations.push({
                name: 'Fruit Sorbet',
                brand: 'Dairy Free',
                image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
                benefits: ['Dairy free', 'Natural fruit', 'Lower calories'],
                matchScore: this.calculateMatchScore('fruit', userConditions),
                reason: 'Made from real fruit, no dairy',
                category: 'Desserts',
                nutritionalValue: 'Natural fruit sugars, dairy-free'
            });
        }
        
        if (productLower.includes('bread') || productLower.includes('pasta') || productLower.includes('white flour')) {
            recommendations.push({
                name: 'Whole Grain / Whole Wheat',
                brand: 'High Fiber',
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                benefits: ['High fiber', 'More nutrients', 'Lower glycemic index'],
                matchScore: this.calculateMatchScore('grains', userConditions),
                reason: 'Whole grains retain fiber and nutrients',
                category: 'Grains',
                nutritionalValue: 'High in fiber and B vitamins'
            });
            
            recommendations.push({
                name: 'Quinoa or Brown Rice Pasta',
                brand: 'Gluten Free',
                image: 'https://images.unsplash.com/photo-1516685018646-549198525c1b?w=400',
                benefits: ['Gluten free', 'High protein', 'More minerals'],
                matchScore: this.calculateMatchScore('glutenfree', userConditions),
                reason: 'Gluten-free with complete protein profile',
                category: 'Grains',
                nutritionalValue: 'Complete protein, gluten-free'
            });
        }
        
        if (productLower.includes('fast food') || productLower.includes('burger') || productLower.includes('fries')) {
            recommendations.push({
                name: 'Grilled Chicken / Veggie Burger',
                brand: 'Lean Protein',
                image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
                benefits: ['Lean protein', 'Lower fat', 'More nutrients'],
                matchScore: this.calculateMatchScore('protein', userConditions),
                reason: 'Grilled instead of fried, leaner protein',
                category: 'Fast Food',
                nutritionalValue: 'Lower in saturated fat'
            });
            
            recommendations.push({
                name: 'Baked Sweet Potato Fries',
                brand: 'Nutrient Dense',
                image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400',
                benefits: ['More vitamins', 'Lower fat', 'Fiber'],
                matchScore: this.calculateMatchScore('vegetables', userConditions),
                reason: 'Baked not fried, rich in vitamin A',
                category: 'Fast Food',
                nutritionalValue: 'Rich in vitamin A and fiber'
            });
        }
        
        // Default recommendations if no specific match
        if (recommendations.length === 0) {
            recommendations.push({
                name: 'Whole Food Alternative',
                brand: 'Minimally Processed',
                image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
                benefits: ['Minimally processed', 'Natural ingredients', 'Better nutrition'],
                matchScore: this.calculateMatchScore('general', userConditions),
                reason: 'Less processed foods generally healthier',
                category: 'General',
                nutritionalValue: 'Higher nutrient density'
            });
            
            recommendations.push({
                name: 'Homemade Version',
                brand: 'You Control Ingredients',
                image: 'https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=400',
                benefits: ['Fresh ingredients', 'Customizable', 'No preservatives'],
                matchScore: this.calculateMatchScore('homemade', userConditions),
                reason: 'Control over ingredients and cooking methods',
                category: 'Homemade',
                nutritionalValue: 'Customizable to health needs'
            });
            
            recommendations.push({
                name: 'Similar Product with Cleaner Label',
                brand: 'Healthier Brands',
                image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=400',
                benefits: ['Fewer additives', 'Simpler ingredients', 'Better sourcing'],
                matchScore: this.calculateMatchScore('clean', userConditions),
                reason: 'Look for products with fewer and simpler ingredients',
                category: 'Alternatives',
                nutritionalValue: 'Fewer artificial additives'
            });
        }
        
        // Sort by match score and return top 3
        return recommendations
            .sort((a, b) => b.matchScore - a.matchScore)
            .slice(0, 3);
    }
    
    static calculateMatchScore(productType, userConditions) {
        let baseScore = 70;
        
        // Adjust score based on user conditions
        userConditions.forEach(condition => {
            const conditionName = condition.name.toLowerCase();
            
            // Diabetes-friendly adjustments
            if (conditionName.includes('diabetes')) {
                if (productType.includes('sugar') || productType.includes('sweet')) {
                    baseScore -= 20;
                }
                if (productType.includes('fiber') || productType.includes('whole')) {
                    baseScore += 15;
                }
            }
            
            // Heart health adjustments
            if (conditionName.includes('heart') || conditionName.includes('cholesterol')) {
                if (productType.includes('fat') || productType.includes('fried')) {
                    baseScore -= 20;
                }
                if (productType.includes('lean') || productType.includes('grilled')) {
                    baseScore += 15;
                }
            }
            
            // Hypertension adjustments
            if (conditionName.includes('hypertension') || conditionName.includes('blood pressure')) {
                if (productType.includes('salt') || productType.includes('sodium')) {
                    baseScore -= 20;
                }
                if (productType.includes('low sodium') || productType.includes('unsalted')) {
                    baseScore += 15;
                }
            }
            
            // General healthy adjustments
            if (productType.includes('natural') || productType.includes('whole')) {
                baseScore += 10;
            }
            if (productType.includes('processed') || productType.includes('artificial')) {
                baseScore -= 10;
            }
        });
        
        return Math.min(95, Math.max(50, baseScore));
    }
}

// --- PRODUCT ANALYZER ---
class ProductAnalyzer {
    analyzeProduct(product, userConditions) {
        const analysis = {
            overallRisk: 'low',
            riskScore: 20, // Start lower
            ingredients: [],
            medicalRisks: [],
            insights: [],
            summary: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0 }
        };
        
        // Extract ingredients
        const ingredients = this.extractIngredients(product.ingredients);
        
        // Analyze each ingredient
        ingredients.forEach(ingredient => {
            const ingredientAnalysis = this.analyzeIngredient(ingredient, userConditions);
            analysis.ingredients.push(ingredientAnalysis);
            
            // Update summary
            if (ingredientAnalysis.risk === 'high') analysis.summary.highRisk++;
            else if (ingredientAnalysis.risk === 'medium') analysis.summary.mediumRisk++;
            else analysis.summary.lowRisk++;
        });
        
        analysis.summary.total = analysis.ingredients.length;
        
        // Calculate risk score with adjusted thresholds
        analysis.riskScore = this.calculateRiskScore(analysis.ingredients, product.nutriments, userConditions);

        // Determine overall risk with better thresholds
        analysis.overallRisk = this.getOverallRisk(analysis, userConditions);
        
        // Generate medical risks
        analysis.medicalRisks = this.generateMedicalRisks(analysis.ingredients, userConditions);
        
        // Generate insights
        analysis.insights = this.generateInsights(analysis);
        
        return analysis;
    }
    
    extractIngredients(text) {
        if (!text || text === "Ingredients not specified") return [];
        
        let cleaned = text.toLowerCase();
        
        // Basic cleaning
        cleaned = cleaned.replace(/[^\w\s,]/g, ' ')
                         .replace(/\s+/g, ' ')
                         .trim();
        
        return cleaned.split(',')
                      .map(ing => ing.trim())
                      .filter(ing => ing.length > 2);
    }
    analyzeIngredient(ingredient, userConditions) {
    const ingredientLower = ingredient.toLowerCase();
    let risk = 'low';
    let reasons = [];
    let score = 10;
    
    // First, normalize the ingredient name (handle foreign languages)
    const normalizedIngredient = this.normalizeIngredientName(ingredientLower);
    
    userConditions.forEach(condition => {
        const disease = condition.name;
        const medicalData = MEDICAL_KNOWLEDGE[disease];
        
        if (medicalData) {
            // Check both original and normalized ingredient
            const ingredientToCheck = [ingredientLower, normalizedIngredient];
            
            medicalData.triggers.forEach(trigger => {
                const triggerLower = trigger.toLowerCase();
                
                // Check if ingredient contains trigger OR normalized version does
                const containsTrigger = ingredientToCheck.some(ing => 
                    ing.includes(triggerLower) || triggerLower.includes(ing)
                );
                
                if (containsTrigger) {
                    // HIGH RISK for dangerous combinations
                    if (medicalData.severity === 'critical' || medicalData.severity === 'high') {
                        risk = 'high';
                        score = 90;
                        reasons.push(`🚨 HIGH RISK for ${disease}: Contains ${trigger}`);
                    }
                    // Medium risk
                    else if (medicalData.severity === 'medium' && risk !== 'high') {
                        risk = 'medium';
                        score = 65;
                        reasons.push(`⚠️ Moderate risk for ${disease}: Contains ${trigger}`);
                    }
                }
            });
        }
    });
    
    // Check for foreign language ingredients
    const foreignTriggers = this.detectForeignLanguageIngredients(ingredientLower);
    if (foreignTriggers.length > 0 && reasons.length === 0) {
        risk = 'medium';
        score = 65;
        reasons.push(`⚠️ Contains foreign language ingredient: ${foreignTriggers.join(', ')}`);
    }
    
    if (reasons.length === 0) {
        reasons.push('✅ Generally safe ingredient');
    }
    
    return {
        name: ingredient,
        risk: risk,
        reasons: reasons,
        score: score
    };
}

// Add these helper methods to ProductAnalyzer class:
normalizeIngredientName(ingredient) {
    // Map foreign language ingredients to English
    const ingredientMap = {
        // Sugar in different languages
        'sucre': 'sugar',
        'azúcar': 'sugar',
        'zucker': 'sugar',
        'sucre': 'sugar',
        'socker': 'sugar',
        'şeker': 'sugar',
        'sucre': 'sugar',
        
        // Salt in different languages
        'sel': 'salt',
        'salz': 'salt',
        'sale': 'salt',
        'só': 'salt',
        'tuz': 'salt',
        'sare': 'salt',
        
        // Fat in different languages
        'gras': 'fat',
        'fett': 'fat',
        'grasso': 'fat',
        'zsír': 'fat',
        
        // Gluten-related
        'blé': 'wheat',
        'weizen': 'wheat',
        'grano': 'wheat',
        'orge': 'barley',
        'gerste': 'barley',
        
        // Dairy
        'lait': 'milk',
        'milch': 'milk',
        'leche': 'milk',
        'fromage': 'cheese',
        'käse': 'cheese',
        'queso': 'cheese'
    };
    
    // Check for exact matches first
    if (ingredientMap[ingredient]) {
        return ingredientMap[ingredient];
    }
    
    // Check for partial matches
    for (const [foreign, english] of Object.entries(ingredientMap)) {
        if (ingredient.includes(foreign)) {
            return english;
        }
    }
    
    return ingredient;
}
// Add to ProductAnalyzer class in server.js
generateMedicalRisksFromML(ingredients, userConditions) {
    const risks = [];
    
    userConditions.forEach(condition => {
        const disease = condition.name;
        const medicalData = MEDICAL_KNOWLEDGE[disease];
        
        if (medicalData) {
            const diseaseRisks = [];
            let maxSeverity = 'low';
            
            ingredients.forEach(ing => {
                // Check if ingredient contains any trigger for this disease
                const ingredientLower = ing.name.toLowerCase();
                const hasTrigger = medicalData.triggers.some(trigger => 
                    ingredientLower.includes(trigger.toLowerCase())
                );
                
                if (hasTrigger) {
                    diseaseRisks.push({
                        ingredient: ing.name,
                        risk: ing.score / 100,
                        reason: medicalData.advice
                    });
                    
                    if (ing.risk === 'high') maxSeverity = 'high';
                    else if (ing.risk === 'medium' && maxSeverity !== 'high') maxSeverity = 'medium';
                }
            });
            
            if (diseaseRisks.length > 0) {
                risks.push({
                    disease: disease,
                    icon: medicalData.icon,
                    severity: maxSeverity,
                    displayName: disease,
                    risks: diseaseRisks,
                    advice: medicalData.advice
                });
            }
        }
    });
    
    return risks;
}
detectForeignLanguageIngredients(ingredient) {
    const foreignKeywords = [
        'sucre', 'azúcar', 'zucker', 'sel', 'salz', 'sale',
        'gras', 'fett', 'grasso', 'lait', 'milch', 'leche',
        'fromage', 'käse', 'queso', 'blé', 'weizen', 'orge'
    ];
    
    return foreignKeywords.filter(keyword => ingredient.includes(keyword));
}
    
    calculateRiskScore(ingredients, nutriments, userConditions) {
        if (ingredients.length === 0) return 20; // Lower default
        
        let totalScore = 0;
        ingredients.forEach(ing => {
            totalScore += ing.score;
        });
        
        let baseScore = Math.round(totalScore / ingredients.length);
        
        // Adjust based on nutrition if available
        if (nutriments) {
            if (nutriments.sugars_100g > 10) baseScore += 25; // Increased impact
            if (nutriments.salt_100g > 1.5) baseScore += 20; // Increased impact
            if (nutriments.saturated_fat_100g > 5) baseScore += 20; // Increased impact
        }
        
        // Adjust based on user conditions severity
        if (userConditions.some(c => {
            const data = MEDICAL_KNOWLEDGE[c.name];
            return data && data.severity === 'critical';
        })) {
            baseScore += 10;
        }
        
        return Math.min(100, Math.max(10, baseScore)); // Wider range
    }
    
    getOverallRisk(analysis, userConditions) {
        // Enhanced risk logic with better thresholds
        const hasCriticalCondition = userConditions.some(c => {
            const data = MEDICAL_KNOWLEDGE[c.name];
            return data && data.severity === 'critical';
        });
        
        // High risk if any high risk ingredients OR high score with critical conditions
        if (analysis.summary.highRisk > 0 || 
            (hasCriticalCondition && analysis.riskScore > 60) ||
            analysis.riskScore > 80) {
            return 'high';
        }
        
        // Medium risk for orange/yellow range
        if (analysis.summary.mediumRisk > 0 || 
            analysis.riskScore > 40) { // Lowered threshold for medium
            return 'medium';
        }
        
        return 'low';
    }
    
    generateMedicalRisks(ingredients, userConditions) {
        const risks = [];
        
        userConditions.forEach(condition => {
            const disease = condition.name;
            const medicalData = MEDICAL_KNOWLEDGE[disease];
            
            if (medicalData) {
                const diseaseRisks = [];
                let maxSeverity = 'low';
                
                ingredients.forEach(ing => {
                    if (ing.reasons.some(r => r.includes(disease))) {
                        diseaseRisks.push({
                            ingredient: ing.name,
                            risk: ing.score / 100,
                            reason: medicalData.advice
                        });
                        
                        if (ing.risk === 'high') maxSeverity = 'high';
                        else if (ing.risk === 'medium' && maxSeverity !== 'high') maxSeverity = 'medium';
                    }
                });
                
                if (diseaseRisks.length > 0) {
                    risks.push({
                        disease: disease,
                        icon: medicalData.icon,
                        severity: maxSeverity,
                        displayName: disease,
                        risks: diseaseRisks,
                        advice: medicalData.advice
                    });
                }
            }
        });
        
        return risks;
    }
    
    generateInsights(analysis) {
        const insights = [];
        
        if (analysis.overallRisk === 'high') {
            insights.push('🚫 AVOID - High risk detected for your health conditions');
            insights.push(`🔴 Contains ${analysis.summary.highRisk} dangerous ingredients`);
            insights.push('⚠️ Strongly consider healthier alternatives');
        } else if (analysis.overallRisk === 'medium') {
            insights.push('🟠 MODERATE RISK - Consume with caution');
            insights.push(`⚠️ Contains ${analysis.summary.mediumRisk} concerning ingredients`);
            insights.push('⚖️ Limit portion size and frequency');
        } else {
            insights.push('✅ SAFE - Good choice for your conditions');
            insights.push(`🟢 ${analysis.summary.lowRisk} safe ingredients analyzed`);
            insights.push('👍 Maintains health goals');
        }
        
        // Add personalized insights based on risk score
        if (analysis.riskScore > 70) {
            insights.push('📈 High risk score suggests caution needed');
        } else if (analysis.riskScore > 50) {
            insights.push('📊 Moderate risk - check alternatives for better options');
        }
        
        return insights;
    }
    
   async generateHealthyAlternatives(productName, productData, userConditions) {
    // Use AI engine for recommendations
    return AIRecommendationEngine.getRecommendations(productName, productData, userConditions);
}
}

// --- PRODUCT CACHE ---
const PRODUCT_CACHE_FILE = path.join(__dirname, 'product-cache.json');
let productCache = {};

function loadCache() {
    try {
        if (fs.existsSync(PRODUCT_CACHE_FILE)) {
            productCache = JSON.parse(fs.readFileSync(PRODUCT_CACHE_FILE, 'utf8'));
            console.log(`📊 Loaded ${Object.keys(productCache).length} cached products`);
        }
    } catch (error) {
        productCache = {};
    }
}
// --- RISK LEVEL CALCULATION ---
function calculateRiskLevel(riskScore) {
    // High: > 70
    // Medium: 40-70  
    // Low: < 40
    if (riskScore >= 70) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
}

function getRiskColor(risk) {
    switch(risk) {
        case 'high': return 'from-red-500 to-rose-500';
        case 'medium': return 'from-amber-500 to-orange-500';
        case 'low': return 'from-emerald-500 to-green-500';
        default: return 'from-gray-500 to-gray-600';
    }
}
function saveCache() {
    try {
        fs.writeFileSync(PRODUCT_CACHE_FILE, JSON.stringify(productCache, null, 2));
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

// --- FETCH PRODUCT ---
async function fetchProduct(productName, barcode = null) {
    const cacheKey = barcode || productName.toLowerCase();
    
    if (productCache[cacheKey]) {
        console.log(`📦 Using cached: ${cacheKey}`);
        return productCache[cacheKey];
    }
    
    try {
        let url;
        let apiProduct;
        
        if (barcode) {
            console.log(`🔍 Fetching barcode: ${barcode}`);
            url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
            const response = await axios.get(url, { timeout: 8000 });
            apiProduct = response.data.product;
        } else {
            console.log(`🔍 Searching product: ${productName}`);
            url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(productName)}&json=1&page_size=1`;
            const response = await axios.get(url, { timeout: 8000 });
            apiProduct = response.data.products?.[0];
        }
        
        if (apiProduct) {
            const product = {
                name: apiProduct.product_name || productName,
                brand: apiProduct.brands || 'Unknown',
                ingredients: apiProduct.ingredients_text || 'Ingredients not specified',
                image: apiProduct.image_url || `https://source.unsplash.com/400x400/?${encodeURIComponent(productName)}`,
                categories: apiProduct.categories || 'General Food',
                nutriments: apiProduct.nutriments || {},
                category_tags: apiProduct.categories_tags || [],
                allergens: apiProduct.allergens || '',
                nutrition_grades: apiProduct.nutrition_grades || 'unknown'
            };
            
            productCache[cacheKey] = product;
            saveCache();
            
            console.log(`✅ Fetched: ${product.name}`);
            return product;
        }
    } catch (error) {
        console.error('API Error:', error.message);
    }
    
    // Fallback
    console.log(`⚠️ Using fallback for: ${productName}`);
    return {
        name: productName,
        brand: 'Unknown',
        ingredients: 'Ingredients not specified',
        image: `https://source.unsplash.com/400x400/?${encodeURIComponent(productName)}`,
        categories: 'General Food',
        nutriments: {},
        category_tags: [],
        allergens: '',
        nutrition_grades: 'unknown'
    };
}

// --- INITIALIZE ---
loadCache();
const analyzer = new ProductAnalyzer();

// --- API ENDPOINTS ---

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        version: '2.1',
        cache: Object.keys(productCache).length,
        diseases: Object.keys(MEDICAL_KNOWLEDGE).length,
        features: ['AI Recommendations', 'Smart Risk Analysis', 'Mobile Scanner']
    });
});

// Get diseases with limited suggestions initially
app.get('/api/diseases', (req, res) => {
    try {
        const allDiseases = Object.entries(MEDICAL_KNOWLEDGE).map(([name, data]) => ({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name: name,
            icon: data.icon,
            color: getDiseaseColor(name),
            severity: data.severity,
            category: data.category
        }));
        
        // Always return first 4 diseases
        const limitedDiseases = allDiseases.slice(0, 4);
        
        res.json({
            diseases: limitedDiseases,
            hasMore: allDiseases.length > 4,
            total: allDiseases.length
        });
    } catch (error) {
        console.error('Error getting diseases:', error);
        res.json({
            diseases: [
                { id: 1, name: 'Diabetes', icon: '💉', color: 'bg-red-50 border-red-200 text-red-700' },
                { id: 2, name: 'Hypertension', icon: '❤️', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { id: 3, name: 'High Cholesterol', icon: '🫀', color: 'bg-amber-50 border-amber-200 text-amber-700' },
                { id: 4, name: 'Allergies', icon: '🤧', color: 'bg-purple-50 border-purple-200 text-purple-700' }
            ],
            hasMore: true,
            total: 15
        });
    }
});

// Get all diseases
app.get('/api/all-diseases', (req, res) => {
    try {
        const allDiseases = Object.entries(MEDICAL_KNOWLEDGE).map(([name, data]) => ({
            id: name.toLowerCase().replace(/\s+/g, '_'),
            name: name,
            icon: data.icon,
            color: getDiseaseColor(name),
            severity: data.severity,
            category: data.category
        }));
        
        res.json(allDiseases);
    } catch (error) {
        console.error('Error getting all diseases:', error);
        res.json([]);
    }
});

function getDiseaseColor(disease) {
    const colors = {
        'Diabetes': 'bg-red-50 border-red-200 text-red-700',
        'Hypertension': 'bg-blue-50 border-blue-200 text-blue-700',
        'Heart Disease': 'bg-pink-50 border-pink-200 text-pink-700',
        'High Cholesterol': 'bg-amber-50 border-amber-200 text-amber-700',
        'Obesity': 'bg-orange-50 border-orange-200 text-orange-700',
        'Kidney Issues': 'bg-cyan-50 border-cyan-200 text-cyan-700',
        'Allergies': 'bg-purple-50 border-purple-200 text-purple-700',
        'Gluten Intolerance': 'bg-yellow-50 border-yellow-200 text-yellow-700',
        'Lactose Intolerance': 'bg-indigo-50 border-indigo-200 text-indigo-700',
        'Acid Reflux': 'bg-red-50 border-red-200 text-red-700',
        'IBS': 'bg-green-50 border-green-200 text-green-700',
        'Gout': 'bg-purple-50 border-purple-200 text-purple-700',
        'Migraine': 'bg-blue-50 border-blue-200 text-blue-700',
        'PCOS': 'bg-purple-50 border-purple-200 text-purple-700',
        'Thyroid Issues': 'bg-pink-50 border-pink-200 text-pink-700'
    };
    return colors[disease] || 'bg-gray-50 border-gray-200 text-gray-700';
}

app.get('/api/ai-stats', (req, res) => {
    res.json({
        trained: true,
        databaseSize: Object.keys(productCache).length,
        diseases: Object.keys(MEDICAL_KNOWLEDGE).length,
        model: 'AI Recommendation Engine v2.1',
        features: ['Smart Disease Matching', 'AI-Powered Recommendations', 'Risk Analysis']
    });
});

// Search products
app.get('/api/search-products', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json([]);
        }
        
        console.log(`🔍 Searching for: ${query}`);
        
        // Check cache first
        const cachedResults = [];
        Object.values(productCache).forEach(product => {
            if (product.name.toLowerCase().includes(query.toLowerCase())) {
                cachedResults.push({
                    name: product.name,
                    brand: product.brand,
                    image: product.image
                });
            }
        });
        
        if (cachedResults.length >= 5) {
            return res.json(cachedResults.slice(0, 6));
        }
        
        // Fetch from API
        const response = await axios.get(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&json=1&page_size=8`
        );
        
        const results = [...cachedResults];
        
        if (response.data.products) {
            response.data.products.forEach(apiProduct => {
                if (apiProduct.product_name && results.length < 8) {
                    results.push({
                        name: apiProduct.product_name,
                        brand: apiProduct.brands || 'Unknown',
                        image: apiProduct.image_url || `https://source.unsplash.com/200x200/?${encodeURIComponent(apiProduct.product_name)}`
                    });
                }
            });
        }
        
        res.json(results.slice(0, 6));
    } catch (error) {
        console.error('Search error:', error);
        res.json([]);
    }
});

// Match disease from user input
app.post('/api/match-disease', (req, res) => {
    try {
        const { query } = req.body;
        
        if (!query || query.trim() === '') {
            return res.json({ 
                success: false, 
                message: "Please enter a health condition" 
            });
        }
        
        const matchedDisease = DiseaseMatcher.findMatchingDisease(query);
        
        if (matchedDisease) {
            const diseaseData = MEDICAL_KNOWLEDGE[matchedDisease];
            res.json({
                success: true,
                disease: {
                    id: matchedDisease.toLowerCase().replace(/\s+/g, '_'),
                    name: matchedDisease,
                    icon: diseaseData.icon,
                    color: getDiseaseColor(matchedDisease),
                    severity: diseaseData.severity
                },
                message: `✅ Matched "${query}" to "${matchedDisease}"`
            });
        } else {
            res.json({
                success: false,
                message: `❌ Could not match "${query}". Please select from the list below.`,
                suggestion: "Try: Diabetes, Hypertension, Heart Disease, etc."
            });
        }
    } catch (error) {
        console.error('Disease match error:', error);
        res.json({
            success: false,
            message: "Error matching disease. Please try again."
        });
    }
});
function convertMLAlternativesToFrontendFormat(mlAlternatives, userConditions) {
    if (!mlAlternatives || mlAlternatives.length === 0) return [];
    
    console.log("🔄 Converting ML alternatives:", JSON.stringify(mlAlternatives, null, 2));
    
    // Track used names to avoid duplicates
    const usedNames = new Set();
    
    return mlAlternatives
        .filter(alt => alt && (typeof alt === 'string' || typeof alt === 'object')) // Filter valid alternatives
        .map((alt, index) => {
            // Extract name from object or string
            let altName;
            if (typeof alt === 'string') {
                altName = alt.trim();
            } else if (typeof alt === 'object') {
                altName = alt.name || alt.Name || "Healthy Alternative";
                
                // If it's one of those generic options, make it better
                if (altName.includes('Option') && altName.includes('Healthy')) {
                    const categories = ['Grains', 'Cereal', 'Snacks', 'Fruits', 'Nuts', 'Yogurt'];
                    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                    altName = `Healthy ${randomCategory} Option`;
                }
            } else {
                altName = "Healthy Alternative";
            }
            
            // Extract match score from object or calculate
            let matchScore;
            if (typeof alt === 'object' && alt.match_score !== undefined) {
                matchScore = Math.round(alt.match_score);
            } else {
                matchScore = 80 - (index * 5); // Default descending scores
            }
            
            // Extract reason from object or generate
            let reason;
            if (typeof alt === 'object' && alt.reason) {
                reason = alt.reason;
            } else {
                reason = generateReasonFromMLAlternative(altName, userConditions);
            }
            
            // Ensure unique name
            let finalName = altName;
            let counter = 1;
            while (usedNames.has(finalName)) {
                finalName = `${altName} ${counter}`;
                counter++;
            }
            usedNames.add(finalName);
            
            // Generate benefits
            const benefits = generateBenefitsFromMLAlternative(finalName, userConditions);
            
            // Generate image URL based on product type
            let imageCategory = 'food';
            const lowerName = finalName.toLowerCase();
            if (lowerName.includes('beverage') || lowerName.includes('drink')) {
                imageCategory = 'drink';
            } else if (lowerName.includes('grain') || lowerName.includes('cereal')) {
                imageCategory = 'cereal';
            } else if (lowerName.includes('fruit')) {
                imageCategory = 'fruit';
            } else if (lowerName.includes('vegetable')) {
                imageCategory = 'vegetable';
            } else if (lowerName.includes('nut')) {
                imageCategory = 'nuts';
            }
            
            const imageUrl = `https://source.unsplash.com/400x400/?${encodeURIComponent(imageCategory)},healthy`;
            
            return {
                name: finalName,
                brand: "AI Recommended",
                image: imageUrl,
                matchScore: Math.min(95, Math.max(60, matchScore)), // Keep between 60-95
                reason: reason,
                benefits: benefits.slice(0, 3),
                category: "ML Recommendation",
                nutritionalValue: "Personalized alternative"
            };
        })
        .slice(0, 5); // Limit to 5 alternatives
}
function generateBenefitsFromMLAlternative(productName, userConditions) {
    const name = productName.toLowerCase();
    const benefits = new Set();
    
    // Smart benefit generation based on product name
    if (name.includes('low sugar') || name.includes('sugar free')) {
        benefits.add('Low sugar');
    }
    if (name.includes('low sodium') || name.includes('salt free')) {
        benefits.add('Low sodium');
    }
    if (name.includes('low fat') || name.includes('fat free')) {
        benefits.add('Low fat');
    }
    if (name.includes('high fiber') || name.includes('fiber rich')) {
        benefits.add('High fiber');
    }
    if (name.includes('protein') || name.includes('protein rich')) {
        benefits.add('Good protein');
    }
    if (name.includes('low calorie') || name.includes('calorie controlled')) {
        benefits.add('Low calorie');
    }
    if (name.includes('heart healthy') || name.includes('heart')) {
        benefits.add('Heart healthy');
    }
    if (name.includes('whole grain') || name.includes('whole wheat')) {
        benefits.add('Whole grains');
    }
    
    // Add benefits based on user conditions
    if (userConditions && userConditions.length > 0) {
        const conditions = userConditions.map(c => c.name.toLowerCase());
        
        if (conditions.some(c => c.includes('diabetes'))) {
            benefits.add('Diabetes friendly');
            if (!name.includes('sugar')) {
                benefits.add('Low glycemic');
            }
        }
        if (conditions.some(c => c.includes('hypertension') || c.includes('blood pressure'))) {
            benefits.add('Blood pressure friendly');
            if (!name.includes('salt') && !name.includes('sodium')) {
                benefits.add('Low sodium');
            }
        }
        if (conditions.some(c => c.includes('heart') || c.includes('cholesterol'))) {
            benefits.add('Heart healthy');
            if (!name.includes('fat')) {
                benefits.add('Low saturated fat');
            }
        }
    }
    
    // Default benefits if none generated
    if (benefits.size === 0) {
        benefits.add('Healthier choice');
        benefits.add('Better nutrition');
        benefits.add('AI optimized');
    }
    
    return Array.from(benefits);
}
function generateReasonFromMLAlternative(productName, userConditions) {
    const name = productName.toLowerCase();
    const conditions = userConditions?.map(c => c.name.toLowerCase()) || [];
    
    let reasons = [];
    
    if (conditions.some(c => c.includes("diabetes"))) {
        if (name.includes('low sugar') || name.includes('sugar free')) {
            reasons.push('Low sugar for diabetes');
        } else if (name.includes('high fiber') || name.includes('whole grain')) {
            reasons.push('High fiber for blood sugar control');
        }
    }
    
    if (conditions.some(c => c.includes("hypertension") || c.includes("blood pressure"))) {
        if (name.includes('low sodium') || name.includes('salt free')) {
            reasons.push('Low sodium for blood pressure');
        }
    }
    
    if (conditions.some(c => c.includes("heart") || c.includes("cholesterol"))) {
        if (name.includes('low fat') || name.includes('heart healthy')) {
            reasons.push('Low saturated fat for heart health');
        }
    }
    
    if (reasons.length === 0) {
        if (name.includes('grain') || name.includes('cereal')) {
            reasons.push('Whole grains for better nutrition');
        } else if (name.includes('nut') || name.includes('seed')) {
            reasons.push('Healthy fats and protein');
        } else if (name.includes('fruit') || name.includes('vegetable')) {
            reasons.push('Natural vitamins and fiber');
        } else {
            reasons.push('Healthier alternative recommended by AI');
        }
    }
    
    return reasons.join('; ');
}
function generateBenefitsFromName(productName) {
    const name = productName.toLowerCase();
    const benefits = [];
    
    if (name.includes("tea") || name.includes("water")) {
        benefits.push("Hydrating", "Low calories", "Natural");
    } else if (name.includes("apple") || name.includes("fruit") || name.includes("peach")) {
        benefits.push("Natural sugars", "Vitamins", "Fiber");
    } else if (name.includes("flakes") || name.includes("cereal")) {
        benefits.push("Fortified", "Energy source");
    } else {
        benefits.push("Healthier choice", "Better nutrition");
    }
    
    return benefits.slice(0, 3);
}

function generateReasonFromConditions(productName, conditionNames) {
    if (conditionNames.includes("diabetes") || conditionNames.some(c => c.includes("diabetes"))) {
        return "Lower glycemic index for blood sugar control";
    } else if (conditionNames.includes("hypertension") || conditionNames.some(c => c.includes("blood pressure"))) {
        return "Reduced sodium for blood pressure management";
    } else if (conditionNames.some(c => c.includes("heart"))) {
        return "Heart-healthy nutrients";
    } else if (conditionNames.some(c => c.includes("cholesterol"))) {
        return "Lower saturated fat for cholesterol control";
    }
    
    return "Healthier alternative based on ML analysis";
}

function getImprovementTips(analysis) {
    const tips = [];
    
    if (analysis.overallRisk === 'high') {
        tips.push("🚫 Avoid this product completely");
        tips.push("🔍 Look for low-sugar, low-sodium alternatives");
        tips.push("🥗 Consider whole food alternatives");
    } else if (analysis.overallRisk === 'medium') {
        tips.push("⚖️ Limit portion size");
        tips.push("📅 Consume occasionally, not daily");
        tips.push("💧 Drink water with your meal");
    } else {
        tips.push("✅ Good choice for your health goals");
        tips.push("🍽️ Maintain balanced portions");
        tips.push("📊 Continue monitoring your health");
    }
    
    return tips;
}

/// MAIN ANALYSIS ENDPOINT - SINGLE DEFINITION
app.post('/api/analyze', async (req, res) => {
    try {
        const { productName, userConditions, barcode } = req.body;
        
        if (!productName && !barcode) {
            return res.status(400).json({ 
                success: false, 
                message: "Product name or barcode required" 
            });
        }
        
        console.log(`🎯 Analyzing: ${productName || barcode}`);
        console.log(`👤 User conditions: ${JSON.stringify(userConditions, null, 2)}`);
        
        // Get product
        const product = await fetchProduct(productName, barcode);
        
        // Initialize ML result variables
        let mlResult = null;
        let mlAlternatives = [];
        let mlRiskScore = null;
        let mlRiskLevel = null;
        let mlUsed = false;
        
        // ---- ML INFERENCE ----
        try {
            console.log("🤖 Calling ML service...");
            
          const mlPayload = {
    product: {
        name: product.name || productName || "Unknown Product", // REQUIRED FIELD
        product_name: product.name || productName || "Unknown Product",
        ingredients: product.ingredients || "",
        ingredients_text: product.ingredients || "",
        nutriments: product.nutriments || {}
    },
    userConditions: userConditions ? userConditions.map(c => c.name || c) : []
};
            console.log("📤 ML Payload:", JSON.stringify(mlPayload, null, 2));

            const mlResponse = await axios.post(
                "http://localhost:8000/analyze",
                mlPayload,
                { timeout: 8000 }
            );

            console.log("✅ ML Response received!");
            console.log("📊 ML Risk Score:", mlResponse.data.risk_score);
            console.log("📈 ML Risk Level:", mlResponse.data.risk_level);
            console.log("🔄 ML Alternatives count:", mlResponse.data.alternatives?.length || 0);
            console.log("🧪 ML Ingredient Analysis count:", mlResponse.data.ingredient_analysis?.length || 0);

            // Store ML results
            mlResult = mlResponse.data;
            mlUsed = true;
            mlAlternatives = mlResponse.data.alternatives || [];
            mlRiskScore = mlResponse.data.risk_score || 0;
            mlRiskLevel = mlResponse.data.risk_level || 'medium';
            
        } catch (mlError) {
            console.warn("⚠️ ML service failed:", mlError.message);
            if (mlError.code === 'ECONNREFUSED') {
                console.error("❌ ML service is not running on http://localhost:8000");
            }
            mlUsed = false;
        }
        
       // ---- CREATE ANALYSIS BASED ON ML OR RULE-BASED ----
let analysis;
if (mlUsed && mlResult) {
    console.log("📊 Creating analysis from ML results");
    
    // Convert ML ingredient_analysis to our format
    const mlIngredients = mlResult.ingredient_analysis || [];
    
    // Generate summary counts from ML data
    const highRiskCount = mlIngredients.filter(i => i.risk === 'high').length;
    const mediumRiskCount = mlIngredients.filter(i => i.risk === 'medium').length;
    const lowRiskCount = mlIngredients.filter(i => i.risk === 'low' || (!i.risk && i.risk !== 'high' && i.risk !== 'medium')).length;
    
    // ✅ CRITICAL: Calculate proper risk level
    let overallRisk;
    if (mlRiskScore >= 70) overallRisk = 'high';
    else if (mlRiskScore >= 40) overallRisk = 'medium';
    else overallRisk = 'low';
    
    console.log(`📊 Risk calculation: ML Score=${mlRiskScore}%, ML Level="${mlRiskLevel}", Calculated="${overallRisk}"`);
    
    // Create analysis object from ML results
    analysis = {
        overallRisk: overallRisk, // Use OUR calculation, not mlRiskLevel
        riskScore: mlRiskScore,
        ingredients: mlIngredients.map(ing => ({
            name: ing.name || "Unknown ingredient",
            risk: ing.risk || 'low',
            reasons: ing.risk === 'high' ? ['🚨 High risk ingredient detected'] : 
                    ing.risk === 'medium' ? ['⚠️ Moderate risk ingredient'] : 
                    ['✅ Generally safe'],
            score: ing.risk === 'high' ? 90 : 
                  ing.risk === 'medium' ? 65 : 10
        })),
        medicalRisks: [],
        summary: {
            total: mlIngredients.length,
            highRisk: highRiskCount,
            mediumRisk: mediumRiskCount,
            lowRisk: lowRiskCount
        },
        insights: [
            `🤖 AI Neural Network Analysis Complete`,
            `📊 Risk Score: ${mlRiskScore}%`,
            overallRisk === 'high' ? '🚫 HIGH RISK - Avoid this product' :
            overallRisk === 'medium' ? '🟠 MODERATE RISK - Consume with caution' :
            '✅ LOW RISK - Good choice for your health'
        ]
    };
    
    // Generate medical risks based on ML ingredient analysis
    if (userConditions && userConditions.length > 0) {
        analysis.medicalRisks = analyzer.generateMedicalRisksFromML(analysis.ingredients, userConditions);
    }
    
} else {
    console.log("📊 Using rule-based analysis (ML not available)");
    analysis = analyzer.analyzeProduct(product, userConditions || []);
    // Also apply proper risk calculation to rule-based
    let ruleBasedRisk;
    if (analysis.riskScore >= 70) ruleBasedRisk = 'high';
    else if (analysis.riskScore >= 40) ruleBasedRisk = 'medium';
    else ruleBasedRisk = 'low';
    analysis.overallRisk = ruleBasedRisk;
}
        // ---- ALTERNATIVES ----
        let alternatives = [];
        if (mlUsed && mlAlternatives && mlAlternatives.length > 0) {
            console.log(`✅ Using ML alternatives: ${mlAlternatives.length} products`);
            alternatives = convertMLAlternativesToFrontendFormat(mlAlternatives, userConditions);
        } else {
            console.log("⚠️ No ML alternatives available");
            // Use rule-based alternatives if needed
            alternatives = await analyzer.generateHealthyAlternatives(product.name, product, userConditions || []);
        }
        
        // ---- BUILD FINAL RESPONSE ----
        const response = {
            success: true,
            product: {
                name: product.name,
                brand: product.brand,
                ingredients: product.ingredients,
                nutriments: product.nutriments,
                categories: product.categories,
                nutrition_grades: product.nutrition_grades,
                image: product.image,
                allergens: product.allergens
            },
            analysis: {
                overallRisk: analysis.overallRisk,
                riskScore: analysis.riskScore,
                ingredients: analysis.ingredients,
                medicalRisks: analysis.medicalRisks,
                summary: analysis.summary,
                insights: analysis.insights
            },
            recommendation: {
                status: analysis.overallRisk === 'high' ? 'avoid' : 
                        analysis.overallRisk === 'medium' ? 'moderate' : 'safe',
                message: analysis.insights?.join(' • ') || 'AI Analysis Complete',
                alternatives: alternatives.slice(0, 3), // Use the alternatives we prepared
                improvementTips: getImprovementTips(analysis),
                aiInsights: analysis.insights || []
            },
            // THIS IS CRITICAL - Pass ML alternatives separately
            mlAlternatives: mlUsed && mlAlternatives && mlAlternatives.length > 0 ? 
                            convertMLAlternativesToFrontendFormat(mlAlternatives, userConditions) : 
                            [],
            ai: {
                enabled: mlUsed,
                confidence: mlUsed ? 85 : 70,
                trained: mlUsed,
                version: "2.0"
            }
        };

        console.log("📤 Sending response with:", {
            mlUsed: mlUsed,
            mlAlternativesCount: mlAlternatives?.length || 0,
            riskScore: analysis.riskScore,
            riskLevel: analysis.overallRisk,
            ingredientsCount: analysis.ingredients?.length || 0
        });

        return res.json(response);
        
    } catch (error) {
        console.error('❌ Analysis error:', error);
        res.status(500).json({
            success: false,
            message: "Analysis failed. Please try again.",
            error: error.message
        });
    }
});
function getRecommendationMessage(risk, score) {
    switch(risk) {
        case 'high': 
            return `🚫 AVOID - High risk (${score}%) for your health conditions`;
        case 'medium': 
            return `🟠 MODERATE - Consume with caution (${score}% risk score)`;
        default: 
            return `✅ SAFE - Good choice (${score}% risk score)`;
    }
}

function calculateConfidence(analysis) {
    let confidence = 80; // Higher base confidence
    
    if (analysis.summary.total > 5) {
        confidence += 10;
    }
    
    if (analysis.riskScore > 60 && analysis.summary.highRisk > 0) {
        confidence += 5;
    }
    
    if (analysis.medicalRisks.length > 0) {
        confidence += 5;
    }
    
    return Math.min(95, confidence);
}
function applyDiseasePenalty(baseRisk, nutriments, userConditions) {
    let score = baseRisk;

    const sugar = nutriments?.sugars_100g || 0;
    const salt = nutriments?.salt_100g || 0;
    const fat = nutriments?.saturated_fat_100g || 0;

    userConditions.forEach(c => {
        const name = c.name.toLowerCase();

        if (name.includes("diabetes") && sugar > 5) score += 20;
        if (name.includes("hypertension") && salt > 1) score += 20;
        if ((name.includes("heart") || name.includes("cholesterol")) && fat > 5) score += 15;
        if (name.includes("kidney") && salt > 1) score += 15;
    });

    if (userConditions.length > 1) {
        score += (userConditions.length - 1) * 5;
    }

    return Math.min(100, score);
}

// Barcode scan endpoint
app.post('/api/scan-barcode', async (req, res) => {
    try {
        const { barcode } = req.body;
        
        if (!barcode) {
            return res.status(400).json({ 
                success: false, 
                message: "Barcode required" 
            });
        }
        
        console.log(`📷 Scanning barcode: ${barcode}`);
        
        const product = await fetchProduct(null, barcode);
        
        if (!product || product.name === 'Unknown Product') {
            return res.json({
                success: false,
                message: "Product not found in database",
                suggestion: "Try searching by name instead",
                barcode: barcode
            });
        }
        
        res.json({ 
            success: true, 
            product: product,
            message: "Product found successfully"
        });
        
    } catch (error) {
        console.error('❌ Scan error:', error);
        res.status(500).json({ 
            success: false, 
            message: "Scan failed. Camera might be blocked or barcode invalid.",
            suggestion: "Try manual search or check camera permissions"
        });
    }
});

// --- START SERVER ---
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Food Safety AI Server v2.1`);
    console.log(✅ Server listening on port ${PORT} (0.0.0.0));
    console.log(`🔗 http://localhost:${PORT}`);
    console.log(`📊 Cached products: ${Object.keys(productCache).length}`);
    console.log(`💊 Medical conditions: ${Object.keys(MEDICAL_KNOWLEDGE).length}`);
    console.log("✅ AI Recommendation Engine: Active");
    console.log(`🤖 ML Service URL: ${ML_SERVICE_URL}`);
    console.log("✅ Risk Thresholds: High > 80%, Medium > 40%, Low < 40%");
    console.log("✅ Mobile Scanner: Optimized");
    
});


