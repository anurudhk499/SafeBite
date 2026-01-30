# file name: datasets/disease_ingredients.py
import pandas as pd
import numpy as np
import json
from typing import Dict, List, Tuple

class DiseaseIngredientDataset:
    def __init__(self):
        self.disease_data = self._create_disease_dataset()
        self.ingredient_mapping = self._create_ingredient_mapping()
        self.severity_scores = self._create_severity_scoring()
        
    def _create_disease_dataset(self) -> Dict:
        """Comprehensive disease-ingredient relationship dataset"""
        return {
            # METABOLIC DISORDERS

    "diabetes": {
        "triggers": {
            "high": ["sugar", "glucose", "fructose", "sucrose", "dextrose", "corn syrup", "honey", "molasses", "maltodextrin", "maple syrup", "brown sugar", "agave nectar", "invert sugar", "treacle", "panela", "palm sugar", "coconut sugar", "fruit juice concentrate", "rice syrup", "barley malt syrup", "caramel", "lactose (milk sugar)", "golden syrup", "malt syrup", "evaporated cane juice", "confectioner's sugar", "turbinado sugar", "demerara sugar", "muscovado sugar"],
            "medium": ["refined flour", "white rice", "potato starch", "tapioca", "corn flour", "white bread flour", "instant mashed potato flakes", "puffed rice", "crisped rice", "instant oatmeal", "cornmeal", "white pasta", "semolina", "couscous (refined)", "pretzels", "rice cakes", "cornflakes", "breakfast cereals (low-fiber)", "instant rice", "panko breadcrumbs"],
            "low": ["artificial sweeteners", "sugar alcohols", "aspartame", "saccharin", "sucralose", "acesulfame potassium", "stevia leaf extract", "monk fruit extract", "neotame", "advantame", "xylitol", "erythritol", "mannitol", "sorbitol", "isomalt", "lactitol", "maltitol"]
        },
        "beneficial": ["cinnamon", "bitter melon", "fenugreek", "fiber", "chromium", "green leafy vegetables", "chia seeds", "flaxseed", "apple cider vinegar", "turmeric (curcumin)", "ginger", "psyllium husk", "resistant starch", "legumes (beans, lentils)", "berries (blueberries, strawberries)", "whole grains (oats, quinoa)", "nuts (almonds, walnuts)", "avocado", "green tea", "cocoa (high-flavonoid)", "fatty fish (omega-3)", "garlic", "onions", "extra virgin olive oil", "acv (apple cider vinegar)", "alphalipoic acid"],
        "severity_weight": 1.5,
        "thresholds": {"sugar_g_per_100g": 5, "carbs_g_per_100g": 15}
    },
    "hypertension": {
        "triggers": {
            "high": ["salt", "sodium chloride", "msg", "soy sauce", "baking soda", "baking powder", "disodium phosphate", "sodium benzoate", "sodium nitrite/nitrate (preservative)", "sodium alginate", "sodium caseinate", "sodium citrate", "sodium erythorbate", "sodium lactate", "sodium metabisulfite", "sodium phosphate", "sodium propionate", "sodium saccharin", "sodium stearoyl lactylate", "teriyaki sauce", "fish sauce", "hoisin sauce", "worcestershire sauce", "bouillon cubes/powder", "stock concentrates", "instant noodles seasoning", "cured meats (bacon, ham)", "salted butter/margarine", "olives (brined)", "capers", "anchovies", "salted nuts", "potato chips", "salted crackers"],
            "medium": ["processed meat", "canned soup", "pickles", "cheese", "instant pasta/rice mixes", "frozen ready meals", "pizza (commercial)", "sandwich meats", "sausages", "hot dogs", "gravies & sauces (packaged)", "salad dressings (bottled)", "ketchup", "mustard (prepared)", "relish", "barbecue sauce", "salsa (jarred)", "bread & rolls (commercial)", "breakfast cereals", "biscuits/cookies", "pastries", "cake mixes", "pancake/waffle mixes", "self-rising flour"],
            "low": ["caffeine", "licorice", "energy drinks", "black/green tea (strong)", "dark chocolate (>70%)", "guarana extract", "yerba mate"]
        },
        "beneficial": ["potassium", "magnesium", "garlic", "hibiscus", "beetroot", "celery seed extract", "pomegranate", "watermelon", "leafy greens (spinach, kale)", "sweet potatoes", "bananas", "oranges", "cantaloupe", "tomatoes", "cucumbers", "zucchini", "beans (white, kidney)", "yogurt", "kefir", "dark leafy greens", "pumpkin seeds", "almonds", "cashews", "peanuts", "dark chocolate (min. 70%)", "avocados", "legumes", "fatty fish (salmon)", "flaxseeds", "chia seeds", "walnuts", "olive oil"],
        "severity_weight": 1.4,
        "thresholds": {"salt_g_per_100g": 1.5}
    },
    "heart_disease": {
        "triggers": {
            "high": ["trans fat", "hydrogenated oil", "saturated fat", "cholesterol", "palm oil", "coconut oil", "butter", "lard", "shortening", "partially hydrogenated oils", "margarine (stick)", "commercial frying oils", "beef tallow", "dripping", "suet", "cream", "whipped topping (non-dairy)", "coffee creamer (powdered)", "frosting/icing", "pie crust (commercial)", "biscuit dough (canned)", "croissants (commercial)", "donuts", "muffins (commercial)", "crackers (butter-type)", "microwave popcorn (butter-flavored)", "instant hot chocolate mixes", "creamy salad dressings", "packaged gravy mixes", "frozen fried foods", "processed pastries", "packaged cake mixes", "packaged cookie dough"],
            "medium": ["red meat", "processed meat", "full-fat dairy", "sausages", "salami", "pepperoni", "bologna", "pork ribs", "lamb chops", "duck", "goose", "organ meats (liver, kidney)", "pâté", "fried chicken (skin-on)", "bacon", "ham hocks", "prime rib", "T-bone steak", "cream cheese", "sour cream", "heavy cream", "ice cream", "buttermilk", "cheese spreads", "whole milk yogurt", "custard", "queso fresco"],
            "low": ["cholesterol", "egg yolk", "shellfish (shrimp, lobster)", "squid", "caviar", "offal", "animal fats in processed foods"]
        },
        "beneficial": ["omega-3", "fiber", "antioxidants", "plant sterols", "fatty fish (salmon, mackerel, sardines, herring)", "walnuts", "flaxseeds", "chia seeds", "hemp seeds", "soybeans", "kidney beans", "lentils", "oats", "barley", "psyllium", "berries", "dark leafy greens", "dark chocolate (>70%)", "green tea", "red wine (moderate)", "tomatoes", "broccoli", "artichokes", "red cabbage", "beans", "nuts (almonds, pistachios)", "avocado", "olive oil", "garlic", "turmeric", "ginger"],
        "severity_weight": 1.6,
        "thresholds": {"saturated_fat_g": 5, "cholesterol_mg": 300}
    },
    "high_cholesterol": {
        "triggers": {
            "high": ["trans fat", "saturated fat", "dietary cholesterol", "partially hydrogenated oils", "shortening", "margarine (stick)", "commercial baked goods", "fried foods (fast food)", "non-dairy creamers", "frosting", "packaged snacks (chips, crackers)", "frozen pies/pastries", "microwave popcorn (butter)", "coffee whiteners", "biscuits (packaged)", "cake mixes", "cookie dough", "pancake/waffle mixes", "creamy salad dressings", "packaged gravy/sauce mixes", "instant noodle seasoning oil", "processed cheese", "high-fat processed meats"],
            "medium": ["full-fat dairy", "red meat", "butter", "palm oil", "cream", "whole milk", "cheese", "ice cream", "sour cream", "whipped cream", "beef (ribeye, T-bone)", "lamb", "pork (belly, ribs)", "processed meats (sausage, salami)", "duck", "goose", "coconut milk (canned, full-fat)", "coconut cream", "palm kernel oil"],
            "low": ["coconut oil", "MCT oil", "virgin coconut oil"]
        },
        "beneficial": ["fiber", "plant sterols", "stanols", "omega-3", "oats", "barley", "psyllium husk", "legumes", "apples", "pears", "prunes", "brussels sprouts", "carrots", "eggplant", "okra", "almonds", "walnuts", "pistachios", "flaxseeds", "chia seeds", "fatty fish", "soy protein", "avocado", "olive oil", "foods fortified with sterols/stanols", "green tea", "dark chocolate (>70%)", "garlic", "turmeric"],
        "severity_weight": 1.4,
        "thresholds": {"saturated_fat_g": 5}
    },
    "obesity": {
        "triggers": {
            "high": ["high fructose corn syrup", "added sugars", "trans fat", "sugar-sweetened beverages (soda, energy drinks)", "fruit punch", "sweetened iced tea", "flavored coffees", "sports drinks", "chocolate milk (sweetened)", "breakfast cereals (sugar-coated)", "granola bars", "candy", "chocolate bars", "cookies", "cakes", "pastries", "donuts", "ice cream", "sweetened yogurt", "pancake syrup", "dessert toppings", "condensed milk", "canned fruit in syrup", "jam/jelly", "partially hydrogenated oils", "fried fast foods", "packaged baked snacks"],
            "medium": ["refined carbs", "high-calorie density", "fried foods", "white bread", "bagels", "white rice", "regular pasta", "pretzels", "crackers", "chips", "buttered popcorn", "pizza (commercial)", "burgers (fast food)", "French fries", "onion rings", "fried chicken", "nachos", "quesadillas", "cream-based soups", "alfredo sauce", "cheesy sauces", "gravies", "cream cheese", "full-fat dips", "nuts (salted/candied)", "trail mix (with candy)", "dried fruit (sugar-added)", "energy bars (high-sugar)"],
            "low": ["saturated fat", "processed foods", "high-fat meats", "full-fat dairy", "butter", "cream", "processed cheeses", "bacon", "sausages", "pre-packaged meals", "instant noodles", "frozen dinners", "canned pasta", "packaged side dishes", "instant mashed potatoes", "boxed meal kits"]
        },
        "beneficial": ["fiber", "protein", "water content", "vegetables (non-starchy)", "leafy greens", "cruciferous vegetables", "legumes", "whole fruits", "whole grains", "lean poultry", "fish", "eggs", "Greek yogurt", "cottage cheese", "tofu", "tempeh", "soups (broth-based)", "salads (with vinegar dressing)", "chia seeds", "flaxseeds", "apple cider vinegar", "green tea", "water-rich foods (cucumber, celery, watermelon)"],
        "severity_weight": 1.3,
        "thresholds": {"calories_per_100g": 400}
    },
    "celiac_disease": {
        "triggers": {
            "critical": ["gluten", "wheat", "barley", "rye", "spelt", "kamut", "triticale", "wheat berries", "wheat germ", "wheat bran", "farina", "durum", "einkorn", "emmer", "farro", "graham flour", "semolina", "couscous", "bulgur", "seitan (wheat gluten)", "malt", "malt extract", "malt vinegar", "brewer's yeast", "barley malt", "rye bread", "pumpernickel", "oats (unless certified gluten-free due to cross-contamination)"],
            "medium": ["oats", "malt", "brewer's yeast", "modified food starch (source not specified)", "dextrin (source not specified)", "caramel color (can be barley-derived)", "natural flavors (can contain gluten)", "soy sauce (unless tamari wheat-free)", "teriyaki sauce", "hoisin sauce", "miso (some types)", "processed meats (with fillers)", "imitation crab/seafood", "blue cheese (can use bread mold)", "communion wafers", "play-doh (for children)"],
            "low": ["gluten-free grains", "rice", "corn", "quinoa", "buckwheat", "amaranth", "millet", "sorghum", "teff", "certified gluten-free oats", "arrowroot", "tapioca", "potato starch", "cassava", "nut flours", "coconut flour", "bean flours"]
        },
        "beneficial": ["gluten-free grains", "quinoa", "rice", "corn", "buckwheat", "amaranth", "millet", "sorghum", "teff", "certified gluten-free oats", "potatoes", "sweet potatoes", "legumes", "nuts", "seeds", "fresh meats", "fish", "eggs", "dairy (plain)", "fruits", "vegetables", "healthy fats", "iron-rich foods", "B-vitamin rich foods", "vitamin D sources", "zinc-rich foods"],
        "severity_weight": 2.0,
        "thresholds": {}
    },
    "lactose_intolerance": {
        "triggers": {
            "high": ["lactose", "milk", "whey", "curd", "cheese", "cream", "buttermilk", "condensed milk", "evaporated milk", "powdered milk", "malted milk", "cream cheese", "sour cream", "ice cream", "yogurt (regular)", "kefir", "butter (contains trace amounts)", "ghee (clarified butter)", "casein", "caseinates", "milk solids", "non-fat dry milk", "lactose", "lactulose", "lactitol", "milk chocolate", "white chocolate", "whey protein concentrate", "whey powder", "rennet casein"],
            "medium": ["butter", "ghee", "casein", "margarine (may contain whey)", "bread (can contain milk powder)", "crackers", "cookies", "cakes", "pastries", "pancakes", "waffles", "processed breakfast cereals", "instant potatoes", "soups (creamy)", "sauces (creamy)", "gravy mixes", "salad dressings (creamy)", "protein bars", "meal replacement shakes", "processed meats (sausages, hot dogs)", "some medications (check fillers)"],
            "low": ["lactose-free dairy", "lactose-free milk", "lactose-free yogurt", "aged hard cheeses (parmesan, cheddar, swiss)", "butter (generally well-tolerated)", "ghee (clarified butter)", "fermented dairy products (some tolerance)", "probiotic yogurt (some tolerance)"]
        },
        "beneficial": ["lactase enzyme", "fermented dairy", "lactose-free dairy products", "plant-based milks (almond, soy, oat, rice)", "calcium-fortified juices", "leafy green vegetables", "broccoli", "almonds", "canned fish with bones", "tofu (calcium-set)", "tempeh", "fermented foods (sauerkraut, kimchi)", "probiotic supplements", "digestive enzymes"],
        "severity_weight": 1.2,
        "thresholds": {"lactose_g": 1}
    },
    "ibs": {
        "triggers": {
            "high": ["fodmaps", "onion", "garlic", "wheat", "beans", "lentils", "asparagus", "artichokes", "cauliflower", "mushrooms", "snow peas", "sugar snap peas", "apples", "pears", "mango", "watermelon", "peaches", "plums", "dried fruit", "fruit juice", "high-fructose corn syrup", "honey", "agave", "milk", "soft cheeses", "yogurt", "rye", "barley", "cashews", "pistachios", "chickpeas", "soybeans", "inulin", "fructo-oligosaccharides (fos)", "mannitol", "sorbitol", "xylitol", "isomalt"],
            "medium": ["dairy", "caffeine", "artificial sweeteners", "cruciferous vegetables (broccoli, cabbage)", "bell peppers", "celery", "corn", "cherries", "nectarines", "apricots", "blackberries", "coconut milk (canned)", "cottage cheese", "ricotta", "coffee", "black tea", "cola", "aspartame", "saccharin", "sucralose", "spicy foods", "fatty foods", "fried foods", "processed foods"],
            "low": ["gluten", "fructose", "wheat-based products", "high-fructose fruits", "some sweeteners"]
        },
        "beneficial": ["low-fodmap foods", "peppermint oil", "fiber", "ginger", "turmeric", "fennel seeds", "chamomile", "bananas (ripe)", "blueberries", "strawberries", "oranges", "grapes", "carrots", "cucumbers", "lettuce", "potatoes", "zucchini", "oats", "quinoa", "rice", "eggs", "tofu", "tempeh", "lean meats", "fish", "lactose-free dairy", "almond milk", "probiotics (specific strains)", "psyllium husk", "adequate hydration"],
        "severity_weight": 1.1,
        "thresholds": {}
    },
    "kidney_disease": {
        "triggers": {
            "high": ["potassium", "phosphorus", "sodium", "protein", "bananas", "oranges", "tomatoes", "potatoes", "sweet potatoes", "spinach", "avocados", "dried fruits", "beans", "lentils", "nuts", "seeds", "dairy products", "cola drinks", "processed meats", "whole grains", "chocolate", "bran", "wheat germ", "soy products", "fish", "poultry", "red meat", "eggs", "salt substitutes (potassium chloride)", "sea salt", "soy sauce", "processed foods"],
            "medium": ["potassium-rich foods", "dairy", "nuts", "beans", "melons", "mangoes", "kiwis", "pomegranates", "beets", "brussels sprouts", "pumpkin", "squash", "mushrooms", "peas", "corn", "whole wheat bread", "brown rice", "oatmeal", "yogurt", "cheese", "ice cream", "pudding", "custard", "organ meats", "shellfish", "protein powders", "nutritional supplements"],
            "low": ["processed foods", "preservatives", "canned soups", "frozen dinners", "instant noodles", "snack chips", "cured meats", "pickled foods", "bouillon cubes", "monosodium glutamate (msg)", "sodium benzoate", "sodium nitrate", "phosphoric acid", "food colorings", "artificial flavors"]
        },
        "beneficial": ["low-protein foods", "controlled minerals", "apples", "berries", "pineapple", "cabbage", "cauliflower", "onions", "garlic", "bell peppers", "radishes", "turnips", "cucumber", "eggplant", "white bread", "white rice", "pasta", "refined cereals", "egg whites (in moderation)", "lean poultry (in moderation)", "olive oil", "canola oil", "herbs & spices (salt-free)", "vinegar", "lemon juice", "ginger", "turmeric"],
        "severity_weight": 1.5,
        "thresholds": {"potassium_mg": 200, "phosphorus_mg": 100}
    },
    "gout": {
        "triggers": {
            "high": ["purines", "red meat", "organ meat", "seafood", "alcohol", "beef", "lamb", "pork", "venison", "liver", "kidneys", "sweetbreads", "brain", "heart", "anchovies", "sardines", "mackerel", "herring", "trout", "tuna", "scallops", "mussels", "crab", "lobster", "shrimp", "beer", "whiskey", "vodka", "gin", "rum", "yeast extracts", "gravies", "meat extracts", "bouillon", "consommé"],
            "medium": ["fructose", "sugary drinks", "yeast", "high-fructose corn syrup", "soda", "fruit juices", "sweetened beverages", "pastries", "cakes", "cookies", "candy", "chocolate", "breakfast cereals (sweetened)", "some salad dressings", "baker's yeast", "nutritional yeast", "bread (yeast-risen)", "asparagus", "spinach", "cauliflower", "mushrooms", "peas", "beans", "lentils"],
            "low": ["plant purines", "vegetables (asparagus, spinach, etc.)", "legumes", "whole grains", "nuts", "seeds"]
        },
        "beneficial": ["cherries", "vitamin C", "water", "low-fat dairy", "tart cherry juice", "strawberries", "blueberries", "citrus fruits", "bell peppers", "broccoli", "kiwi", "coffee (moderate)", "skim milk", "yogurt (low-fat)", "cottage cheese (low-fat)", "vegetables (most)", "whole grains", "plant-based proteins", "olive oil", "flaxseeds", "adequate hydration"],
        "severity_weight": 1.3,
        "thresholds": {}
    },
    "migraine": {
        "triggers": {
            "high": ["tyramine", "msg", "nitrates", "caffeine", "alcohol", "aged cheeses (cheddar, blue, gouda)", "processed meats (salami, pepperoni)", "sauerkraut", "soy sauce", "miso", "teriyaki sauce", "smoked fish", "dried fish", "overripe bananas", "avocados", "broad beans", "snow peas", "red wine", "beer", "champagne", "vermouth", "monosodium glutamate", "hydrolyzed vegetable protein", "autolyzed yeast", "sodium nitrate/nitrite", "cured meats", "hot dogs", "bacon", "ham", "energy drinks", "strong coffee", "black tea", "cola"],
            "medium": ["aged cheese", "processed meat", "chocolate", "citrus", "parmesan", "feta", "brie", "camembert", "sausages", "corned beef", "pastrami", "bologna", "dark chocolate", "milk chocolate", "white chocolate", "oranges", "lemons", "limes", "grapefruit", "tangerines", "clementines", "tomatoes", "onions", "nuts", "peanuts", "seeds", "fermented/pickled foods", "artificial sweeteners"],
            "low": ["artificial sweeteners", "fermented foods", "aspartame", "sucralose", "saccharin", "yogurt", "kefir", "kombucha", "sourdough bread", "vinegar", "soy products (tofu, tempeh)"]
        },
        "beneficial": ["magnesium", "riboflavin", "coenzyme q10", "leafy green vegetables", "nuts", "seeds", "whole grains", "legumes", "dark chocolate", "avocado", "bananas", "fatty fish", "organ meats", "spinach", "broccoli", "cauliflower", "eggs", "lean meats", "milk", "yogurt", "coenzyme q10 supplements", "ginger", "feverfew", "butterbur", "omega-3 fatty acids", "adequate hydration", "consistent meal timing"],
        "severity_weight": 1.2,
        "thresholds": {}
    },
    "pcos": {
        "triggers": {
            "high": ["high glycemic foods", "sugars", "refined carbs", "white bread", "white rice", "regular pasta", "pastries", "cakes", "cookies", "sugary cereals", "soda", "fruit juices", "candy", "chocolate bars", "ice cream", "sweetened yogurt", "syrups", "jams", "honey", "agave", "dried fruits", "instant mashed potatoes", "cornflakes", "rice cakes", "pretzels"],
            "medium": ["saturated fats", "processed foods", "dairy", "red meat (fatty cuts)", "butter", "cream", "cheese", "fried foods", "fast food", "frozen meals", "canned soups", "packaged snacks", "ready-to-eat meals", "milk", "yogurt (full-fat)", "ice cream", "cream-based sauces", "gravies", "high-fat dips", "processed meats"],
            "low": ["gluten", "soy", "wheat products", "barley", "rye", "soy milk", "tofu", "tempeh", "edamame", "soy sauce", "soy protein isolate", "textured vegetable protein"]
        },
        "beneficial": ["fiber", "lean protein", "anti-inflammatory foods", "leafy greens", "cruciferous vegetables", "berries", "cherries", "oranges", "fatty fish", "flaxseeds", "chia seeds", "walnuts", "extra virgin olive oil", "turmeric", "ginger", "garlic", "cinnamon", "green tea", "legumes", "lentils", "quinoa", "buckwheat", "sweet potatoes", "avocado", "nuts (almonds, Brazil nuts)", "seeds (pumpkin, sunflower)", "probiotic foods", "apple cider vinegar", "spearmint tea"],
        "severity_weight": 1.3,
        "thresholds": {"sugar_g": 10}
    },
    "thyroid_issues": {
        "triggers": {
            "medium": ["goitrogens", "soy", "cruciferous vegetables", "gluten", "broccoli", "cauliflower", "cabbage", "kale", "brussels sprouts", "bok choy", "turnips", "radishes", "mustard greens", "collard greens", "soy milk", "tofu", "tempeh", "edamame", "soy protein", "soy sauce", "miso", "wheat", "barley", "rye", "triticale", "processed foods with gluten additives", "peanuts", "pine nuts", "millet", "strawberries", "peaches", "spinach (raw in large amounts)", "sweet potatoes (raw)"],
            "low": ["processed foods", "sugars", "refined carbohydrates", "added sugars", "artificial sweeteners", "food colorings", "preservatives", "fast food", "packaged snacks", "sugary beverages"]
        },
        "beneficial": ["iodine", "selenium", "zinc", "iron", "seaweed", "fish", "shellfish", "iodized salt", "eggs", "dairy", "Brazil nuts", "sunflower seeds", "mushrooms", "whole grains", "meat", "poultry", "legumes", "nuts", "seeds", "red meat", "poultry", "fish", "beans", "lentils", "spinach", "pumpkin seeds", "quinoa", "dark chocolate", "vitamin D sources", "omega-3 fatty acids", "antioxidant-rich fruits & vegetables", "adequate protein", "fermented foods"],
        "severity_weight": 1.1,
        "thresholds": {}
    }
}
        
    
    def _create_ingredient_mapping(self) -> Dict:
        """Multi-language ingredient name mapping"""
        return {
            # SUGAR (ENGLISH) - Other languages
            "sugar": ["sucre", "azúcar", "zucker", "sucre", "cukor", "socker", "cukr", "zahar", "şeker", "zahár", "sukker"],
            "glucose": ["glucose", "glucosa", "glukose", "glucosio", "glikoz", "glicose", "glykose"],
            "fructose": ["fructose", "fructosa", "fruktose", "fruttosio", "fruktoz", "frutose"],
            "honey": ["honey", "miel", "honig", "miele", "med", "bal", "méz", "hunaja"],
            
            # SALT (ENGLISH) - Other languages
            "salt": ["salt", "sel", "salz", "sale", "só", "tuz", "sare", "suola", "zout", "soľ", "sůl"],
            "sodium": ["sodium", "sodio", "natrium", "sodík", "nátrium", "sódio"],
            
            # FATS
            "trans fat": ["trans fat", "gras trans", "transfett", "grasso trans", "trans zsír", "transfet"],
            "saturated fat": ["saturated fat", "gras saturé", "gesättigtes fett", "grasso saturo", "telített zsír"],
            "palm oil": ["palm oil", "huile de palme", "palmöl", "olio di palma", "pálmaolaj", "olej palmowy"],
            
            # GLUTEN
            "gluten": ["gluten", "gluten", "gluten", "gluten", "glutén", "gluten", "глютен"],
            "wheat": ["wheat", "blé", "weizen", "grano", "frumento", "búza", "trigo", "pszenica"],
            "barley": ["barley", "orge", "gerste", "cebada", "orzo", "árpa", "jęczmień"],
            
            # DAIRY
            "milk": ["milk", "lait", "milch", "leche", "latte", "tej", "mlijeko", "mjölk"],
            "lactose": ["lactose", "lactose", "laktose", "lactosa", "lattosio", "laktóz", "laktoza"],
            "cheese": ["cheese", "fromage", "käse", "queso", "formaggio", "sajt", "queijo", "ser"],
            
            # ALLERGENS
            "peanut": ["peanut", "arachide", "erdnuss", "cacahuete", "arachidi", "földimogyoró", "amendoim"],
            "soy": ["soy", "soja", "soja", "soja", "soia", "szója", "soja", "соя"],
            "egg": ["egg", "œuf", "ei", "huevo", "uovo", "tojás", "ovo", "jajko"],
            
            # PRESERVATIVES
            "msg": ["msg", "glutamate", "e621", "monosodium glutamate", "natriumglutamat"],
            "nitrate": ["nitrate", "nitrate", "nitrat", "nitrato", "nitrato", "nitrát"],
            "benzoate": ["benzoate", "benzoate", "benzoat", "benzoato", "benzoát"]
        }
    
    def _create_severity_scoring(self) -> Dict:
        """Scoring system for ingredient severity"""
        return {
            "critical": 90,  # Life-threatening (allergies, celiac)
            "high": 80,      # Major health risk
            "medium": 60,    # Moderate risk
            "low": 40,       # Minor concern
            "safe": 10       # Safe or beneficial
        }
    
    def get_ingredient_risk(self, ingredient: str, diseases: List[str]) -> Dict:
        """Calculate risk for a specific ingredient across diseases"""
        ingredient_lower = ingredient.lower().strip()
        risk_results = {}
        
        # Check multi-language mappings
        matched_keys = []
        for eng_key, translations in self.ingredient_mapping.items():
            if (ingredient_lower == eng_key or 
                ingredient_lower in translations or
                any(trans in ingredient_lower for trans in translations)):
                matched_keys.append(eng_key)
        
        # If no direct match, try partial matching
        if not matched_keys:
            for eng_key in self.ingredient_mapping.keys():
                if eng_key in ingredient_lower:
                    matched_keys.append(eng_key)
        
        # Calculate risk for each disease
        for disease in diseases:
            if disease in self.disease_data:
                disease_info = self.disease_data[disease]
                max_severity = "safe"
                risk_score = 0
                
                for eng_key in matched_keys:
                    for severity_level, triggers in disease_info["triggers"].items():
                        if eng_key in triggers:
                            # Update to highest severity found
                            severity_order = {"critical": 4, "high": 3, "medium": 2, "low": 1, "safe": 0}
                            if severity_order[severity_level] > severity_order[max_severity]:
                                max_severity = severity_level
                                risk_score = self.severity_scores[severity_level]
                
                risk_results[disease] = {
                    "severity": max_severity,
                    "score": risk_score,
                    "ingredient": ingredient
                }
        
        return risk_results
    
    def save_datasets(self):
        """Save datasets to files for ML training"""
        import json
        
        # Save disease data
        with open("datasets/disease_data.json", "w") as f:
            json.dump(self.disease_data, f, indent=2)
        
        # Save ingredient mapping
        with open("datasets/ingredient_mapping.json", "w") as f:
            json.dump(self.ingredient_mapping, f, indent=2)
        
        # Create training data
        training_data = self._generate_training_data()
        training_data.to_csv("datasets/training_data.csv", index=False)
        
        return training_data
    
    def _generate_training_data(self) -> pd.DataFrame:
        """Generate synthetic training data for ML model"""
        records = []
        
        for disease, info in self.disease_data.items():
            # Generate positive examples (dangerous combinations)
            for severity, triggers in info["triggers"].items():
                for trigger in triggers:
                    records.append({
                        "disease": disease,
                        "ingredient": trigger,
                        "nutrients": self._generate_nutrients_for_ingredient(trigger),
                        "is_risky": 1,
                        "risk_score": self.severity_scores[severity],
                        "severity": severity
                    })
            
            # Generate negative examples (safe combinations)
            for beneficial in info["beneficial"]:
                records.append({
                    "disease": disease,
                    "ingredient": beneficial,
                    "nutrients": self._generate_nutrients_for_ingredient(beneficial, safe=True),
                    "is_risky": 0,
                    "risk_score": 10,
                    "severity": "safe"
                })
        
        return pd.DataFrame(records)
    
    def _generate_nutrients_for_ingredient(self, ingredient: str, safe: bool = False) -> Dict:
        """Generate synthetic nutrient data for training"""
        import random
        
        # Base nutrient profiles based on ingredient type
        if any(word in ingredient for word in ["sugar", "syrup", "honey"]):
            return {
                "sugars_100g": random.uniform(50, 100) if not safe else random.uniform(0, 10),
                "carbohydrates_100g": random.uniform(60, 100),
                "salt_100g": random.uniform(0, 1),
                "fat_100g": random.uniform(0, 5),
                "saturated_fat_100g": random.uniform(0, 3),
                "fiber_100g": random.uniform(0, 2),
                "proteins_100g": random.uniform(0, 2),
                "energy_kcal_100g": random.uniform(300, 500)
            }
        elif any(word in ingredient for word in ["salt", "sodium"]):
            return {
                "sugars_100g": random.uniform(0, 5),
                "carbohydrates_100g": random.uniform(0, 10),
                "salt_100g": random.uniform(50, 100) if not safe else random.uniform(0, 1),
                "fat_100g": random.uniform(0, 5),
                "saturated_fat_100g": random.uniform(0, 3),
                "fiber_100g": random.uniform(0, 2),
                "proteins_100g": random.uniform(0, 2),
                "energy_kcal_100g": random.uniform(0, 100)
            }
        elif any(word in ingredient for word in ["oil", "fat", "butter"]):
            return {
                "sugars_100g": random.uniform(0, 5),
                "carbohydrates_100g": random.uniform(0, 10),
                "salt_100g": random.uniform(0, 2),
                "fat_100g": random.uniform(80, 100) if not safe else random.uniform(0, 20),
                "saturated_fat_100g": random.uniform(40, 60) if not safe else random.uniform(0, 10),
                "fiber_100g": random.uniform(0, 2),
                "proteins_100g": random.uniform(0, 2),
                "energy_kcal_100g": random.uniform(700, 900)
            }
        else:
            # Generic food profile
            return {
                "sugars_100g": random.uniform(0, 20),
                "carbohydrates_100g": random.uniform(10, 60),
                "salt_100g": random.uniform(0, 2),
                "fat_100g": random.uniform(0, 30),
                "saturated_fat_100g": random.uniform(0, 10),
                "fiber_100g": random.uniform(0, 10),
                "proteins_100g": random.uniform(0, 30),
                "energy_kcal_100g": random.uniform(50, 400)
            }

# Create and save datasets
if __name__ == "__main__":
    dataset = DiseaseIngredientDataset()
    training_data = dataset.save_datasets()
    print(f"Created dataset with {len(training_data)} training examples")
    print(f"Diseases covered: {list(dataset.disease_data.keys())}")