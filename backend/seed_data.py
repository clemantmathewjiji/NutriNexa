import json
from database import get_db_connection, init_db
from auth import hash_password

STANDARD_NUTRIENTS = [
    {"code": "energy_kcal", "name": "Energy (kcal)", "category": "Energy", "unit": "kcal", "energy_factor": 0, "order": 1},
    {"code": "energy_kj", "name": "Energy (kJ)", "category": "Energy", "unit": "kJ", "energy_factor": 0, "order": 2},
    {"code": "water", "name": "Water", "category": "Proximates", "unit": "g", "energy_factor": 0, "order": 3},
    {"code": "protein", "name": "Protein", "category": "Proximates", "unit": "g", "energy_factor": 4.0, "order": 4},
    {"code": "fat", "name": "Total Lipid (Fat)", "category": "Proximates", "unit": "g", "energy_factor": 9.0, "order": 5},
    {"code": "sat_fat", "name": "Fatty acids, saturated", "category": "Lipids", "unit": "g", "energy_factor": 0, "order": 6},
    {"code": "mufa", "name": "Fatty acids, monounsaturated", "category": "Lipids", "unit": "g", "energy_factor": 0, "order": 7},
    {"code": "pufa", "name": "Fatty acids, polyunsaturated", "category": "Lipids", "unit": "g", "energy_factor": 0, "order": 8},
    {"code": "cholesterol", "name": "Cholesterol", "category": "Lipids", "unit": "mg", "energy_factor": 0, "order": 9},
    {"code": "carbs", "name": "Carbohydrate, by difference", "category": "Proximates", "unit": "g", "energy_factor": 4.0, "order": 10},
    {"code": "fiber", "name": "Fiber, total dietary", "category": "Carbohydrates", "unit": "g", "energy_factor": 2.0, "order": 11},
    {"code": "sugars", "name": "Sugars, total", "category": "Carbohydrates", "unit": "g", "energy_factor": 0, "order": 12},
    {"code": "calcium", "name": "Calcium (Ca)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 13},
    {"code": "iron", "name": "Iron (Fe)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 14},
    {"code": "magnesium", "name": "Magnesium (Mg)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 15},
    {"code": "phosphorus", "name": "Phosphorus (P)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 16},
    {"code": "potassium", "name": "Potassium (K)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 17},
    {"code": "sodium", "name": "Sodium (Na)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 18},
    {"code": "zinc", "name": "Zinc (Zn)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 19},
    {"code": "copper", "name": "Copper (Cu)", "category": "Minerals", "unit": "mg", "energy_factor": 0, "order": 20},
    {"code": "vitamin_c", "name": "Vitamin C, total ascorbic acid", "category": "Vitamins", "unit": "mg", "energy_factor": 0, "order": 21},
    {"code": "thiamin", "name": "Thiamin (B1)", "category": "Vitamins", "unit": "mg", "energy_factor": 0, "order": 22},
    {"code": "riboflavin", "name": "Riboflavin (B2)", "category": "Vitamins", "unit": "mg", "energy_factor": 0, "order": 23},
    {"code": "niacin", "name": "Niacin (B3)", "category": "Vitamins", "unit": "mg", "energy_factor": 0, "order": 24},
    {"code": "vitamin_b6", "name": "Vitamin B-6", "category": "Vitamins", "unit": "mg", "energy_factor": 0, "order": 25},
    {"code": "folate", "name": "Folate, total DFE", "category": "Vitamins", "unit": "µg", "energy_factor": 0, "order": 26},
    {"code": "vitamin_b12", "name": "Vitamin B-12", "category": "Vitamins", "unit": "µg", "energy_factor": 0, "order": 27},
    {"code": "vitamin_a", "name": "Vitamin A, RAE", "category": "Vitamins", "unit": "µg", "energy_factor": 0, "order": 28},
    {"code": "vitamin_e", "name": "Vitamin E (alpha-tocopherol)", "category": "Vitamins", "unit": "mg", "energy_factor": 0, "order": 29},
    {"code": "vitamin_d", "name": "Vitamin D (D2 + D3)", "category": "Vitamins", "unit": "µg", "energy_factor": 0, "order": 30},
]

FOOD_RECORDS = [
    {
        "code": "FDC-168878",
        "name": "Oats, rolled, raw",
        "alt_names": "Rolled oats, Porridge oats | ml: ഓട്സ് | id: Havermut, Gandum haver | ru: Овсяные хлопья, Овсянка | ar: الشوفان | hi: जई, ओट्स | ta: ஓட்ஸ், காடைக்கண்ணி | kn: ಓಟ್ಸ್ | te: ఓట్స్, యవలు | bn: ওটস, যব | fr: Flocons d'avoine | es: Avena en hojuelas",
        "food_group": "Cereal Grains & Pasta",
        "category": "Whole Grains",
        "scientific_name": "Avena sativa",
        "description": "Dehulled, steamed, and flattened oat groats.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA Agricultural Research Service, FoodData Central ID: 168878",
        "source_year": "2019",
        "portions": [
            {"name": "1 cup dry rolled oats (81g)", "weight": 81.0},
            {"name": "1/2 cup dry rolled oats (40.5g)", "weight": 40.5},
            {"name": "1 packet instant oats (28g)", "weight": 28.0}
        ],
        "nutrients": {
            "energy_kcal": 389.0, "energy_kj": 1628.0, "water": 8.22, "protein": 16.89, "fat": 6.90,
            "sat_fat": 1.22, "mufa": 2.18, "pufa": 2.54, "cholesterol": 0.0, "carbs": 66.27,
            "fiber": 10.6, "sugars": 0.99, "calcium": 54.0, "iron": 4.72, "magnesium": 177.0,
            "phosphorus": 523.0, "potassium": 429.0, "sodium": 2.0, "zinc": 3.97, "copper": 0.62,
            "vitamin_c": 0.0, "thiamin": 0.76, "riboflavin": 0.14, "niacin": 0.96, "vitamin_b6": 0.12,
            "folate": 56.0, "vitamin_b12": 0.0, "vitamin_a": 0.0, "vitamin_e": 0.42, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-169704",
        "name": "Rice, brown, long-grain, raw",
        "alt_names": "Whole grain brown rice | ml: തവിടുള്ള അരി, ചുവന്ന അരി | id: Beras merah, Beras cokelat | ru: Коричневый рис, Бурый рис | ar: الأرز البني | hi: भूरा चावल, ब्राउन राइस | ta: கைக்குத்தல் அரிசி, பழுப்பு அரிசி | kn: ಕುಚ್ಚಲಕ್ಕಿ, ಕಂದು ಅಕ್ಕಿ | te: దంపుడు బియ్యం | bn: ঢেঁকি ছাঁটা চাল, বাদামী চাল | fr: Riz complet | es: Arroz integral",
        "food_group": "Cereal Grains & Pasta",
        "category": "Whole Grains",
        "scientific_name": "Oryza sativa",
        "description": "Unpolished whole grain rice with bran and germ intact.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 169704",
        "source_year": "2019",
        "portions": [
            {"name": "1 cup raw (185g)", "weight": 185.0},
            {"name": "1 cup cooked (195g)", "weight": 195.0},
            {"name": "1 serving uncooked (50g)", "weight": 50.0}
        ],
        "nutrients": {
            "energy_kcal": 370.0, "energy_kj": 1548.0, "water": 10.37, "protein": 7.94, "fat": 2.92,
            "sat_fat": 0.58, "mufa": 1.05, "pufa": 1.04, "cholesterol": 0.0, "carbs": 77.24,
            "fiber": 3.5, "sugars": 0.85, "calcium": 23.0, "iron": 1.47, "magnesium": 143.0,
            "phosphorus": 333.0, "potassium": 223.0, "sodium": 7.0, "zinc": 2.02, "copper": 0.28,
            "vitamin_c": 0.0, "thiamin": 0.40, "riboflavin": 0.09, "niacin": 5.09, "vitamin_b6": 0.51,
            "folate": 20.0, "vitamin_b12": 0.0, "vitamin_a": 0.0, "vitamin_e": 0.60, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-170417",
        "name": "Lentils, mature seeds, raw",
        "alt_names": "Brown lentils, Masoor dal raw | ml: പരിപ്പ്, മസൂർ പരിപ്പ് | id: Kacang lentil, Miju-miju | ru: Чечевица | ar: عدس | hi: दाल, मसूर दाल | ta: பருப்பு, மைசூர் பருப்பு | kn: ತೊಗರಿ ಬೇಳೆ, ಮಸೂರ್ ಬೇಳೆ | te: పప్పు, మసూర్ పప్పు | bn: মসুর ডাল | fr: Lentilles | es: Lentejas",
        "food_group": "Legumes and Legume Products",
        "category": "Pulses",
        "scientific_name": "Lens culinaris",
        "description": "Dried whole lens-shaped legume seeds.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 170417",
        "source_year": "2019",
        "portions": [
            {"name": "1 cup raw (192g)", "weight": 192.0},
            {"name": "1/2 cup cooked (99g)", "weight": 99.0},
            {"name": "1 dry serving (45g)", "weight": 45.0}
        ],
        "nutrients": {
            "energy_kcal": 353.0, "energy_kj": 1477.0, "water": 8.26, "protein": 25.80, "fat": 1.06,
            "sat_fat": 0.15, "mufa": 0.19, "pufa": 0.53, "cholesterol": 0.0, "carbs": 60.08,
            "fiber": 30.5, "sugars": 2.03, "calcium": 56.0, "iron": 7.54, "magnesium": 122.0,
            "phosphorus": 451.0, "potassium": 905.0, "sodium": 6.0, "zinc": 4.78, "copper": 0.95,
            "vitamin_c": 4.4, "thiamin": 0.87, "riboflavin": 0.21, "niacin": 2.61, "vitamin_b6": 0.54,
            "folate": 479.0, "vitamin_b12": 0.0, "vitamin_a": 2.0, "vitamin_e": 0.49, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-171077",
        "name": "Chicken breast, meat only, raw",
        "alt_names": "Skinless chicken breast, Boneless poultry | ml: കോഴിയിറച്ചി, ചിക്കൻ ബ്രെസ്റ്റ് | id: Dada ayam fillet | ru: Куриная грудка | ar: صدر الدجاج | hi: चिकन ब्रेस्ट, मुर्ग़ी का सीना | ta: கோழி இறைச்சி, கோழி நெஞ்சுக்கறி | kn: ಕೋಳಿ ಮಾಂಸ | te: కోడి మాంసం | bn: মুরগির বুকের মাংস | fr: Blanc de poulet | es: Pechuga de pollo",
        "food_group": "Poultry Products",
        "category": "Lean Meats",
        "scientific_name": "Gallus gallus domesticus",
        "description": "Raw, boneless, skinless broiler or fryer breast fillet.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 171077",
        "source_year": "2019",
        "portions": [
            {"name": "1 unit fillet (172g)", "weight": 172.0},
            {"name": "1/2 breast (86g)", "weight": 86.0},
            {"name": "100g standard portion", "weight": 100.0}
        ],
        "nutrients": {
            "energy_kcal": 120.0, "energy_kj": 502.0, "water": 75.0, "protein": 22.50, "fat": 2.62,
            "sat_fat": 0.56, "mufa": 0.89, "pufa": 0.57, "cholesterol": 73.0, "carbs": 0.0,
            "fiber": 0.0, "sugars": 0.0, "calcium": 11.0, "iron": 0.72, "magnesium": 28.0,
            "phosphorus": 228.0, "potassium": 334.0, "sodium": 65.0, "zinc": 0.80, "copper": 0.04,
            "vitamin_c": 0.0, "thiamin": 0.07, "riboflavin": 0.09, "niacin": 11.20, "vitamin_b6": 0.60,
            "folate": 4.0, "vitamin_b12": 0.34, "vitamin_a": 5.0, "vitamin_e": 0.27, "vitamin_d": 0.1
        }
    },
    {
        "code": "FDC-175167",
        "name": "Salmon, Atlantic, wild, raw",
        "alt_names": "Wild Atlantic salmon fillet | ml: സാൽമൺ മത്സ്യം, കോര മീൻ | id: Ikan salmon liar | ru: Атлантический лосось, Сёмга | ar: سمك السلمون الأطلسي | hi: सामन मछली, सैल्मन | ta: சால்மன் மீன், கிழங்கா மீன் | kn: ಸಾಲ್ಮನ್ ಮೀನು | te: సాల్మన్ చేప | bn: স্যামন মাছ | fr: Saumon de l'Atlantique | es: Salmón salvaje",
        "food_group": "Finfish and Shellfish Products",
        "category": "Fish",
        "scientific_name": "Salmo salar",
        "description": "Wild caught Atlantic salmon muscle meat rich in omega-3 fatty acids.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 175167",
        "source_year": "2019",
        "portions": [
            {"name": "1/2 fillet (198g)", "weight": 198.0},
            {"name": "3 oz portion (85g)", "weight": 85.0}
        ],
        "nutrients": {
            "energy_kcal": 142.0, "energy_kj": 594.0, "water": 68.5, "protein": 19.84, "fat": 6.34,
            "sat_fat": 0.98, "mufa": 2.10, "pufa": 2.54, "cholesterol": 55.0, "carbs": 0.0,
            "fiber": 0.0, "sugars": 0.0, "calcium": 12.0, "iron": 0.80, "magnesium": 29.0,
            "phosphorus": 252.0, "potassium": 490.0, "sodium": 44.0, "zinc": 0.64, "copper": 0.06,
            "vitamin_c": 3.9, "thiamin": 0.23, "riboflavin": 0.14, "niacin": 8.67, "vitamin_b6": 0.82,
            "folate": 25.0, "vitamin_b12": 3.23, "vitamin_a": 12.0, "vitamin_e": 1.35, "vitamin_d": 11.0
        }
    },
    {
        "code": "FDC-171055",
        "name": "Egg, whole, raw, fresh",
        "alt_names": "Hen's egg, Grade A large egg | ml: മുട്ട, കോഴിമുട്ട | id: Telur ayam negeri | ru: Куриное яйцо | ar: بيض دجاج طازج, بيضة | hi: अंडा, मुर्गी का अंडा | ta: முட்டை, கோழி முட்டை | kn: ಮೊಟ್ಟೆ | te: గుడ్డు, కోడి గుడ్డు | bn: ডিম, মুরগির ডিম | fr: Œuf de poule frais | es: Huevo de gallina fresco",
        "food_group": "Dairy and Egg Products",
        "category": "Eggs",
        "scientific_name": "Gallus gallus",
        "description": "Whole fresh chicken egg comprising albumen and yolk.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 171055",
        "source_year": "2019",
        "portions": [
            {"name": "1 large egg (50g)", "weight": 50.0},
            {"name": "1 medium egg (44g)", "weight": 44.0},
            {"name": "1 extra large egg (56g)", "weight": 56.0}
        ],
        "nutrients": {
            "energy_kcal": 143.0, "energy_kj": 598.0, "water": 76.15, "protein": 12.56, "fat": 9.51,
            "sat_fat": 3.13, "mufa": 3.66, "pufa": 1.91, "cholesterol": 372.0, "carbs": 0.72,
            "fiber": 0.0, "sugars": 0.37, "calcium": 56.0, "iron": 1.75, "magnesium": 12.0,
            "phosphorus": 198.0, "potassium": 138.0, "sodium": 142.0, "zinc": 1.29, "copper": 0.07,
            "vitamin_c": 0.0, "thiamin": 0.04, "riboflavin": 0.46, "niacin": 0.07, "vitamin_b6": 0.17,
            "folate": 47.0, "vitamin_b12": 0.89, "vitamin_a": 160.0, "vitamin_e": 1.05, "vitamin_d": 2.0
        }
    },
    {
        "code": "FDC-170379",
        "name": "Spinach, raw",
        "alt_names": "Baby spinach leaves | ml: ചീര, പാലക് ചീര | id: Bayam segar | ru: Шпинат свежий | ar: سبانخ طازجة | hi: पालक, हरी पालक | ta: கீரை, பசலைக்கீரை | kn: ಪಾಲಕ್ ಸೊಪ್ಪು | te: పాలకూర | bn: পালং শাক | fr: Épinards frais | es: Espinacas frescas",
        "food_group": "Vegetables and Vegetable Products",
        "category": "Leafy Greens",
        "scientific_name": "Spinacia oleracea",
        "description": "Fresh raw dark green leafy vegetable.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 170379",
        "source_year": "2019",
        "portions": [
            {"name": "1 cup raw packed (30g)", "weight": 30.0},
            {"name": "1 bunch (340g)", "weight": 340.0},
            {"name": "1 handful (25g)", "weight": 25.0}
        ],
        "nutrients": {
            "energy_kcal": 23.0, "energy_kj": 97.0, "water": 91.4, "protein": 2.86, "fat": 0.39,
            "sat_fat": 0.06, "mufa": 0.01, "pufa": 0.17, "cholesterol": 0.0, "carbs": 3.63,
            "fiber": 2.2, "sugars": 0.42, "calcium": 99.0, "iron": 2.71, "magnesium": 79.0,
            "phosphorus": 49.0, "potassium": 558.0, "sodium": 79.0, "zinc": 0.53, "copper": 0.13,
            "vitamin_c": 28.1, "thiamin": 0.08, "riboflavin": 0.19, "niacin": 0.72, "vitamin_b6": 0.20,
            "folate": 194.0, "vitamin_b12": 0.0, "vitamin_a": 469.0, "vitamin_e": 2.03, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-170393",
        "name": "Broccoli, raw",
        "alt_names": "Calabrese broccoli florets | ml: ബ്രോക്കോളി, പച്ച കോളിഫ്ലവർ | id: Brokoli hijau segar | ru: Брокколи | ar: بروكلي طازج | hi: ब्रोकोली, हरी गोभी | ta: பச்சை பூக்கோசு, புரோக்கோலி | kn: ಬ್ರೊಕೊಲಿ | te: బ్రోకలీ | bn: ব্রকলি | fr: Brocoli cru | es: Brócoli fresco",
        "food_group": "Vegetables and Vegetable Products",
        "category": "Cruciferous",
        "scientific_name": "Brassica oleracea var. italica",
        "description": "Green edible flower head and stalk.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 170393",
        "source_year": "2019",
        "portions": [
            {"name": "1 cup chopped florets (91g)", "weight": 91.0},
            {"name": "1 stalk medium (151g)", "weight": 151.0}
        ],
        "nutrients": {
            "energy_kcal": 34.0, "energy_kj": 141.0, "water": 89.3, "protein": 2.82, "fat": 0.37,
            "sat_fat": 0.11, "mufa": 0.03, "pufa": 0.11, "cholesterol": 0.0, "carbs": 6.64,
            "fiber": 2.6, "sugars": 1.70, "calcium": 47.0, "iron": 0.73, "magnesium": 21.0,
            "phosphorus": 66.0, "potassium": 316.0, "sodium": 33.0, "zinc": 0.41, "copper": 0.05,
            "vitamin_c": 89.2, "thiamin": 0.07, "riboflavin": 0.12, "niacin": 0.64, "vitamin_b6": 0.18,
            "folate": 63.0, "vitamin_b12": 0.0, "vitamin_a": 31.0, "vitamin_e": 0.78, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-171688",
        "name": "Apple, raw, with skin",
        "alt_names": "Red delicious / Gala apple | ml: ആപ്പിൾ, ആപ്പിൾ പഴം | id: Apel merah segar | ru: Яблоко свежее | ar: تفاح طازج بالقشر | hi: सेब | ta: ஆப்பிள் பழம் | kn: ಸೇಬು ಹಣ್ಣು | te: యాపిల్ పండు | bn: আপেল | fr: Pomme fraîche avec peau | es: Manzana fresca",
        "food_group": "Fruits and Fruit Juices",
        "category": "Pome Fruit",
        "scientific_name": "Malus domestica",
        "description": "Fresh whole raw apple with edible peel.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 171688",
        "source_year": "2019",
        "portions": [
            {"name": "1 medium apple (182g)", "weight": 182.0},
            {"name": "1 large apple (223g)", "weight": 223.0},
            {"name": "1 small apple (149g)", "weight": 149.0}
        ],
        "nutrients": {
            "energy_kcal": 52.0, "energy_kj": 218.0, "water": 85.56, "protein": 0.26, "fat": 0.17,
            "sat_fat": 0.03, "mufa": 0.01, "pufa": 0.05, "cholesterol": 0.0, "carbs": 13.81,
            "fiber": 2.4, "sugars": 10.39, "calcium": 6.0, "iron": 0.12, "magnesium": 5.0,
            "phosphorus": 11.0, "potassium": 107.0, "sodium": 1.0, "zinc": 0.04, "copper": 0.03,
            "vitamin_c": 4.6, "thiamin": 0.02, "riboflavin": 0.03, "niacin": 0.09, "vitamin_b6": 0.04,
            "folate": 3.0, "vitamin_b12": 0.0, "vitamin_a": 3.0, "vitamin_e": 0.18, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-173944",
        "name": "Banana, raw",
        "alt_names": "Cavendish banana | ml: വാഴപ്പഴം, നേന്ത്രപ്പഴം, പഴം | id: Pisang cavendish | ru: Банан свежий | ar: موز طازج | hi: केला | ta: வாழைப்பழம் | kn: ಬಾಳೆಹಣ್ಣು | te: అరటిపండు | bn: কলা, পাকা কলা | fr: Banane fraîche | es: Plátano, Banana",
        "food_group": "Fruits and Fruit Juices",
        "category": "Tropical Fruit",
        "scientific_name": "Musa acuminata",
        "description": "Fresh peeled ripe banana flesh.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 173944",
        "source_year": "2019",
        "portions": [
            {"name": "1 medium banana (118g)", "weight": 118.0},
            {"name": "1 small banana (101g)", "weight": 101.0},
            {"name": "1 large banana (136g)", "weight": 136.0}
        ],
        "nutrients": {
            "energy_kcal": 89.0, "energy_kj": 372.0, "water": 74.91, "protein": 1.09, "fat": 0.33,
            "sat_fat": 0.11, "mufa": 0.03, "pufa": 0.07, "cholesterol": 0.0, "carbs": 22.84,
            "fiber": 2.6, "sugars": 12.23, "calcium": 5.0, "iron": 0.26, "magnesium": 27.0,
            "phosphorus": 22.0, "potassium": 358.0, "sodium": 1.0, "zinc": 0.15, "copper": 0.08,
            "vitamin_c": 8.7, "thiamin": 0.03, "riboflavin": 0.07, "niacin": 0.67, "vitamin_b6": 0.37,
            "folate": 20.0, "vitamin_b12": 0.0, "vitamin_a": 3.0, "vitamin_e": 0.10, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-170567",
        "name": "Almonds, raw",
        "alt_names": "Whole raw almond kernels | ml: ബദാം, വാൽനട്ട് ബദാം | id: Kacang almond mentah | ru: Миндаль сырой | ar: لوز نيء | hi: बादाम | ta: பாதாம் பருப்பு | kn: ಬಾದಾಮಿ | te: బాదం పప్పు | bn: বাদাম, কাঠবাদাম | fr: Amandes crues | es: Almendras crudas",
        "food_group": "Nut and Seed Products",
        "category": "Tree Nuts",
        "scientific_name": "Prunus dulcis",
        "description": "Unblanched raw almond seeds rich in alpha-tocopherol and MUFA.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 170567",
        "source_year": "2019",
        "portions": [
            {"name": "1 handful / 23 almonds (28g)", "weight": 28.0},
            {"name": "1 cup whole (143g)", "weight": 143.0},
            {"name": "1 tbsp chopped (10g)", "weight": 10.0}
        ],
        "nutrients": {
            "energy_kcal": 579.0, "energy_kj": 2422.0, "water": 4.41, "protein": 21.15, "fat": 49.93,
            "sat_fat": 3.80, "mufa": 31.55, "pufa": 12.33, "cholesterol": 0.0, "carbs": 21.55,
            "fiber": 12.5, "sugars": 4.35, "calcium": 269.0, "iron": 3.71, "magnesium": 270.0,
            "phosphorus": 481.0, "potassium": 733.0, "sodium": 1.0, "zinc": 3.12, "copper": 1.03,
            "vitamin_c": 0.0, "thiamin": 0.21, "riboflavin": 1.14, "niacin": 3.62, "vitamin_b6": 0.14,
            "folate": 44.0, "vitamin_b12": 0.0, "vitamin_a": 0.0, "vitamin_e": 25.63, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-171413",
        "name": "Oil, olive, extra virgin",
        "alt_names": "EVOO, Cold pressed olive oil | ml: ഒലിവ് എണ്ണ | id: Minyak zaitun extra virgin | ru: Оливковое масло первого отжима | ar: زيت زيتون بكر ممتاز | hi: जैतून का तेल | ta: ஆலிவ் எண்ணெய் | kn: ಆಲಿವ್ ಎಣ್ಣೆ | te: ఆలివ్ నూనె | bn: জলপাই তেল | fr: Huile d'olive extra vierge | es: Aceite de oliva virgen extra",
        "food_group": "Fats and Oils",
        "category": "Vegetable Oils",
        "scientific_name": "Olea europaea",
        "description": "First mechanical cold extraction virgin olive oil.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 171413",
        "source_year": "2019",
        "portions": [
            {"name": "1 tbsp (14g)", "weight": 14.0},
            {"name": "1 tsp (4.5g)", "weight": 4.5}
        ],
        "nutrients": {
            "energy_kcal": 884.0, "energy_kj": 3699.0, "water": 0.0, "protein": 0.0, "fat": 100.0,
            "sat_fat": 13.81, "mufa": 72.96, "pufa": 10.52, "cholesterol": 0.0, "carbs": 0.0,
            "fiber": 0.0, "sugars": 0.0, "calcium": 1.0, "iron": 0.56, "magnesium": 0.0,
            "phosphorus": 0.0, "potassium": 1.0, "sodium": 2.0, "zinc": 0.0, "copper": 0.0,
            "vitamin_c": 0.0, "thiamin": 0.0, "riboflavin": 0.0, "niacin": 0.0, "vitamin_b6": 0.0,
            "folate": 0.0, "vitamin_b12": 0.0, "vitamin_a": 0.0, "vitamin_e": 14.35, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-170884",
        "name": "Yogurt, Greek, plain, nonfat",
        "alt_names": "Strained skim milk yogurt | ml: തൈര്, ഗ്രീക്ക് തൈര് | id: Yogurt yunani kental | ru: Греческий йогурт | ar: زبادي يوناني قليل الدسم, لبن | hi: दही, ग्रीक योगर्ट | ta: தயிர், யோகர்ட் | kn: ಮೊಸರು | te: పెరుగు | bn: দই | fr: Yaourt à la grecque | es: Yogur griego natural",
        "food_group": "Dairy and Egg Products",
        "category": "Fermented Dairy",
        "scientific_name": "Lactobacillus bulgaricus culture",
        "description": "Strained nonfat fermented cow's milk yogurt with dense protein content.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 170884",
        "source_year": "2019",
        "portions": [
            {"name": "1 container (170g)", "weight": 170.0},
            {"name": "1 cup (200g)", "weight": 200.0}
        ],
        "nutrients": {
            "energy_kcal": 59.0, "energy_kj": 247.0, "water": 85.06, "protein": 10.19, "fat": 0.39,
            "sat_fat": 0.12, "mufa": 0.09, "pufa": 0.01, "cholesterol": 5.0, "carbs": 3.60,
            "fiber": 0.0, "sugars": 3.24, "calcium": 110.0, "iron": 0.06, "magnesium": 11.0,
            "phosphorus": 135.0, "potassium": 141.0, "sodium": 36.0, "zinc": 0.52, "copper": 0.02,
            "vitamin_c": 0.0, "thiamin": 0.02, "riboflavin": 0.28, "niacin": 0.21, "vitamin_b6": 0.06,
            "folate": 7.0, "vitamin_b12": 0.75, "vitamin_a": 1.0, "vitamin_e": 0.01, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-170438",
        "name": "Tofu, firm, prepared with calcium sulfate",
        "alt_names": "Soybean curd, firm style | ml: ടോഫു, സോയ പനീർ | id: Tahu kedelai padat | ru: Тофу соевый сыр | ar: توفو, جبن الصويا | hi: टोफू, सोया पनीर | ta: டோஃபு, சோயா பனீர் | kn: ಟೋಫು | te: టోఫు, సోయా పన్నీరు | bn: টোফু, সয়াবিন পনির | fr: Tofu ferme | es: Tofu firme de soja",
        "food_group": "Legumes and Legume Products",
        "category": "Soy Products",
        "scientific_name": "Glycine max",
        "description": "Coagulated soybean milk pressed into solid white curds.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 170438",
        "source_year": "2019",
        "portions": [
            {"name": "1/4 block (122g)", "weight": 122.0},
            {"name": "1/2 cup cubed (126g)", "weight": 126.0}
        ],
        "nutrients": {
            "energy_kcal": 76.0, "energy_kj": 318.0, "water": 84.55, "protein": 8.08, "fat": 4.78,
            "sat_fat": 0.69, "mufa": 1.06, "pufa": 2.70, "cholesterol": 0.0, "carbs": 1.87,
            "fiber": 0.9, "sugars": 0.50, "calcium": 350.0, "iron": 5.36, "magnesium": 30.0,
            "phosphorus": 97.0, "potassium": 121.0, "sodium": 7.0, "zinc": 0.80, "copper": 0.19,
            "vitamin_c": 0.1, "thiamin": 0.08, "riboflavin": 0.05, "niacin": 0.20, "vitamin_b6": 0.05,
            "folate": 15.0, "vitamin_b12": 0.0, "vitamin_a": 0.0, "vitamin_e": 0.01, "vitamin_d": 0.0
        }
    },
    {
        "code": "FDC-171265",
        "name": "Milk, whole, 3.25% milkfat",
        "alt_names": "Whole cow milk | ml: പാൽ, പശുവിൻ പാൽ | id: Susu sapi murni segar | ru: Коровье молоко цельное | ar: حليب بقر كامل الدسم, اللبن | hi: दूध, गाय का दूध | ta: பால், பசுவின் பால் | kn: ಹಾಲು | te: పాలు, ఆవు పాలు | bn: দুধ, গরুর দুধ | fr: Lait entier de vache | es: Leche entera de vaca",
        "food_group": "Dairy and Egg Products",
        "category": "Fluid Milk",
        "scientific_name": "Bos taurus",
        "description": "Standardized whole cow's milk with 3.25% butterfat.",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 171265",
        "source_year": "2019",
        "portions": [
            {"name": "1 cup (244g)", "weight": 244.0},
            {"name": "1 glass (200g)", "weight": 200.0},
            {"name": "1 fl oz (30.5g)", "weight": 30.5}
        ],
        "nutrients": {
            "energy_kcal": 61.0, "energy_kj": 257.0, "water": 88.13, "protein": 3.15, "fat": 3.25,
            "sat_fat": 1.86, "mufa": 0.81, "pufa": 0.20, "cholesterol": 10.0, "carbs": 4.80,
            "fiber": 0.0, "sugars": 5.05, "calcium": 113.0, "iron": 0.03, "magnesium": 10.0,
            "phosphorus": 84.0, "potassium": 132.0, "sodium": 43.0, "zinc": 0.37, "copper": 0.01,
            "vitamin_c": 0.0, "thiamin": 0.04, "riboflavin": 0.16, "niacin": 0.08, "vitamin_b6": 0.03,
            "folate": 5.0, "vitamin_b12": 0.45, "vitamin_a": 46.0, "vitamin_e": 0.07, "vitamin_d": 1.2
        }
    },
    {
        "code": "FDC-168482",
        "name": "Sweet potato, raw, unprepared",
        "alt_names": "Raw sweetpotato, orange flesh | ml: മധുരക്കിഴങ്ങ് | id: Ubi jalar manis | ru: Батат, Сладкий картофель | ar: بطاطا حلوة نيئة | hi: शकरकंद | ta: சர்க்கரைவள்ளிக்கிழங்கு | kn: ಸಿಹಿಗೆಣಸು | te: చిలగడదుంప | bn: মিষ্টি আলু | fr: Patate douce crue | es: Batata, Boniato, Camote",
        "food_group": "Vegetables and Vegetable Products",
        "category": "Root Tubers",
        "scientific_name": "Ipomoea batatas",
        "description": "Orange-fleshed raw root tuber rich in beta-carotene (provitamin A).",
        "source_name": "USDA FoodData Central SR Legacy",
        "source_citation": "USDA FDC ID: 168482",
        "source_year": "2019",
        "portions": [
            {"name": "1 medium tuber (114g)", "weight": 114.0},
            {"name": "1 cup cubed (133g)", "weight": 133.0}
        ],
        "nutrients": {
            "energy_kcal": 86.0, "energy_kj": 359.0, "water": 77.28, "protein": 1.57, "fat": 0.05,
            "sat_fat": 0.02, "mufa": 0.00, "pufa": 0.01, "cholesterol": 0.0, "carbs": 20.12,
            "fiber": 3.0, "sugars": 4.18, "calcium": 30.0, "iron": 0.61, "magnesium": 25.0,
            "phosphorus": 47.0, "potassium": 337.0, "sodium": 55.0, "zinc": 0.30, "copper": 0.15,
            "vitamin_c": 2.4, "thiamin": 0.08, "riboflavin": 0.06, "niacin": 0.56, "vitamin_b6": 0.21,
            "folate": 11.0, "vitamin_b12": 0.0, "vitamin_a": 709.0, "vitamin_e": 0.26, "vitamin_d": 0.0
        }
    }
]

DRV_PROFILES = [
    {
        "authority": "US DRI / IOM",
        "profile_name": "US DRI - Adult Male (19-50y)",
        "target_group": "Adult Male 19-50 years",
        "energy_kcal_target": 2500.0,
        "is_default": 1,
        "values": [
            {"code": "energy_kcal", "target": 2500.0, "unit": "kcal", "type": "EER", "ul": None},
            {"code": "protein", "target": 56.0, "unit": "g", "type": "RDA", "ul": None},
            {"code": "fiber", "target": 38.0, "unit": "g", "type": "AI", "ul": None},
            {"code": "calcium", "target": 1000.0, "unit": "mg", "type": "RDA", "ul": 2500.0},
            {"code": "iron", "target": 8.0, "unit": "mg", "type": "RDA", "ul": 45.0},
            {"code": "magnesium", "target": 400.0, "unit": "mg", "type": "RDA", "ul": 350.0},
            {"code": "potassium", "target": 3400.0, "unit": "mg", "type": "AI", "ul": None},
            {"code": "sodium", "target": 1500.0, "unit": "mg", "type": "AI", "ul": 2300.0},
            {"code": "zinc", "target": 11.0, "unit": "mg", "type": "RDA", "ul": 40.0},
            {"code": "vitamin_c", "target": 90.0, "unit": "mg", "type": "RDA", "ul": 2000.0},
            {"code": "thiamin", "target": 1.2, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "riboflavin", "target": 1.3, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "niacin", "target": 16.0, "unit": "mg", "type": "RDA", "ul": 35.0},
            {"code": "vitamin_b6", "target": 1.3, "unit": "mg", "type": "RDA", "ul": 100.0},
            {"code": "folate", "target": 400.0, "unit": "µg", "type": "RDA", "ul": 1000.0},
            {"code": "vitamin_b12", "target": 2.4, "unit": "µg", "type": "RDA", "ul": None},
            {"code": "vitamin_a", "target": 900.0, "unit": "µg", "type": "RDA", "ul": 3000.0},
            {"code": "vitamin_d", "target": 15.0, "unit": "µg", "type": "RDA", "ul": 100.0},
            {"code": "vitamin_e", "target": 15.0, "unit": "mg", "type": "RDA", "ul": 1000.0}
        ]
    },
    {
        "authority": "US DRI / IOM",
        "profile_name": "US DRI - Adult Female (19-50y)",
        "target_group": "Adult Female 19-50 years",
        "energy_kcal_target": 2000.0,
        "is_default": 0,
        "values": [
            {"code": "energy_kcal", "target": 2000.0, "unit": "kcal", "type": "EER", "ul": None},
            {"code": "protein", "target": 46.0, "unit": "g", "type": "RDA", "ul": None},
            {"code": "fiber", "target": 25.0, "unit": "g", "type": "AI", "ul": None},
            {"code": "calcium", "target": 1000.0, "unit": "mg", "type": "RDA", "ul": 2500.0},
            {"code": "iron", "target": 18.0, "unit": "mg", "type": "RDA", "ul": 45.0},
            {"code": "magnesium", "target": 310.0, "unit": "mg", "type": "RDA", "ul": 350.0},
            {"code": "potassium", "target": 2600.0, "unit": "mg", "type": "AI", "ul": None},
            {"code": "sodium", "target": 1500.0, "unit": "mg", "type": "AI", "ul": 2300.0},
            {"code": "zinc", "target": 8.0, "unit": "mg", "type": "RDA", "ul": 40.0},
            {"code": "vitamin_c", "target": 75.0, "unit": "mg", "type": "RDA", "ul": 2000.0},
            {"code": "thiamin", "target": 1.1, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "riboflavin", "target": 1.1, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "niacin", "target": 14.0, "unit": "mg", "type": "RDA", "ul": 35.0},
            {"code": "vitamin_b6", "target": 1.3, "unit": "mg", "type": "RDA", "ul": 100.0},
            {"code": "folate", "target": 400.0, "unit": "µg", "type": "RDA", "ul": 1000.0},
            {"code": "vitamin_b12", "target": 2.4, "unit": "µg", "type": "RDA", "ul": None},
            {"code": "vitamin_a", "target": 700.0, "unit": "µg", "type": "RDA", "ul": 3000.0},
            {"code": "vitamin_d", "target": 15.0, "unit": "µg", "type": "RDA", "ul": 100.0},
            {"code": "vitamin_e", "target": 15.0, "unit": "mg", "type": "RDA", "ul": 1000.0}
        ]
    },
    {
        "authority": "ICMR-NIN 2020",
        "profile_name": "ICMR-NIN 2020 - Adult Male (Moderate Work)",
        "target_group": "Adult Male 65 kg (Sedentary / Moderate Activity)",
        "energy_kcal_target": 2710.0,
        "is_default": 0,
        "values": [
            {"code": "energy_kcal", "target": 2710.0, "unit": "kcal", "type": "EAR", "ul": None},
            {"code": "protein", "target": 54.0, "unit": "g", "type": "RDA", "ul": None},
            {"code": "fiber", "target": 40.0, "unit": "g", "type": "AI", "ul": None},
            {"code": "calcium", "target": 1000.0, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "iron", "target": 19.0, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "zinc", "target": 17.0, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "sodium", "target": 2000.0, "unit": "mg", "type": "AI", "ul": 2300.0},
            {"code": "vitamin_c", "target": 80.0, "unit": "mg", "type": "RDA", "ul": None},
            {"code": "vitamin_a", "target": 1000.0, "unit": "µg", "type": "RDA", "ul": None},
            {"code": "vitamin_b12", "target": 2.2, "unit": "µg", "type": "RDA", "ul": None}
        ]
    }
]

def seed_database():
    """Seeds standard scientific nutrients, reference foods, DRV profiles, and initial sample projects."""
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Seed Nutrients
    for nut in STANDARD_NUTRIENTS:
        cursor.execute("""
            INSERT OR REPLACE INTO nutrients (code, name, category, unit, energy_factor_kcal, display_order)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (nut["code"], nut["name"], nut["category"], nut["unit"], nut["energy_factor"], nut["order"]))

    # 2. Seed Reference Foods
    for food in FOOD_RECORDS:
        cursor.execute("SELECT id FROM foods WHERE code = ?", (food["code"],))
        existing = cursor.fetchone()
        if existing:
            food_id = existing["id"]
            cursor.execute("UPDATE foods SET alt_names = ?, scientific_name = ? WHERE id = ?", (food["alt_names"], food["scientific_name"], food_id))
        else:
            cursor.execute("""
                INSERT INTO foods (
                    code, name, alt_names, food_group, category, scientific_name,
                    description, source_name, source_citation, source_year,
                    standard_quantity, standard_unit, preparation_state, is_custom, data_quality_grade
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 100.0, 'g', 'Raw / Analyzed', 0, 'USDA National Nutrient DB (Grade A)')
            """, (
                food["code"], food["name"], food["alt_names"], food["food_group"],
                food["category"], food["scientific_name"], food["description"],
                food["source_name"], food["source_citation"], food["source_year"]
            ))
            food_id = cursor.lastrowid

        # Insert Nutrients for this Food
        for nut_code, val in food["nutrients"].items():
            unit = next((n["unit"] for n in STANDARD_NUTRIENTS if n["code"] == nut_code), "g")
            cursor.execute("""
                INSERT OR REPLACE INTO food_nutrients (food_id, nutrient_code, amount_per_100g, unit, is_missing, is_trace)
                VALUES (?, ?, ?, ?, 0, 0)
            """, (food_id, nut_code, val, unit))

        # Insert Portion Units
        cursor.execute("DELETE FROM portion_units WHERE food_id = ?", (food_id,))
        for p in food["portions"]:
            cursor.execute("""
                INSERT INTO portion_units (food_id, unit_name, gram_weight)
                VALUES (?, ?, ?)
            """, (food_id, p["name"], p["weight"]))

    # 3. Seed DRV Profiles
    for profile in DRV_PROFILES:
        cursor.execute("SELECT id FROM dietary_reference_profiles WHERE profile_name = ?", (profile["profile_name"],))
        existing_p = cursor.fetchone()
        if existing_p:
            p_id = existing_p["id"]
        else:
            cursor.execute("""
                INSERT INTO dietary_reference_profiles (authority, profile_name, target_group, energy_kcal_target, is_default)
                VALUES (?, ?, ?, ?, ?)
            """, (profile["authority"], profile["profile_name"], profile["target_group"], profile["energy_kcal_target"], profile["is_default"]))
            p_id = cursor.lastrowid

        cursor.execute("DELETE FROM dietary_reference_values WHERE profile_id = ?", (p_id,))
        for val in profile["values"]:
            cursor.execute("""
                INSERT INTO dietary_reference_values (profile_id, nutrient_code, target_value, unit, target_type, upper_limit)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (p_id, val["code"], val["target"], val["unit"], val["type"], val["ul"]))

    # 4. Seed Demo / Lead Researcher Account
    cursor.execute("SELECT id FROM users WHERE email = 'demo@nutrinexa.org'")
    user_row = cursor.fetchone()
    if not user_row:
        pwd_hash, salt = hash_password("NutriNexa2026!")
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, salt, role, institution)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            "Dr. Clemant Mathew Jiji",
            "demo@nutrinexa.org",
            pwd_hash,
            salt,
            "Principal Investigator",
            "SJCET Palai Nutrition Science & Computational Lab"
        ))
        user_id = cursor.lastrowid
    else:
        user_id = user_row["id"]

    # 5. Seed Sample Research Project
    cursor.execute("SELECT id FROM projects WHERE user_id = ? AND code = 'NUTRI-2026-A'", (user_id,))
    existing_proj = cursor.fetchone()
    if not existing_proj:
        cursor.execute("""
            INSERT INTO projects (
                user_id, title, code, objectives, methodology_notes, lead_researcher, status, tags
            ) VALUES (?, ?, ?, ?, ?, ?, 'Active', ?)
        """, (
            user_id,
            "Nutritional Quality & Bioactive Intake in University Student Cohort",
            "NUTRI-2026-A",
            "Assess micronutrient adequacy, omega-3 to omega-6 ratio, and dietary fiber intake across 120 undergraduate students.",
            "Repeated 24-hour recalls analyzed against US DRI and ICMR-NIN 2020 standards using NutriNexa calculation engine.",
            "Dr. Clemant Mathew Jiji",
            "Micronutrients, University Cohort, Dietary Recall, Bioavailability"
        ))
        project_id = cursor.lastrowid

        # Seed sample calculation
        cursor.execute("""
            INSERT INTO calculations (user_id, project_id, name, description, notes)
            VALUES (?, ?, 'High-Protein Breakfast Composite (Sample)', 'Nutrient composition of rolled oats, whole egg, and plain Greek yogurt breakfast.', 'Sample calculation for academic protocol demonstration.')
        """, (user_id, project_id))
        calc_id = cursor.lastrowid

        # Add foods to calculation: Oats (60g), Egg (50g), Greek Yogurt (100g)
        oats_id = cursor.execute("SELECT id FROM foods WHERE code = 'FDC-168878'").fetchone()["id"]
        egg_id = cursor.execute("SELECT id FROM foods WHERE code = 'FDC-171055'").fetchone()["id"]
        yogurt_id = cursor.execute("SELECT id FROM foods WHERE code = 'FDC-170884'").fetchone()["id"]

        cursor.execute("INSERT INTO calculation_items (calculation_id, food_id, quantity_grams, portion_unit_name) VALUES (?, ?, 60.0, '60g raw')", (calc_id, oats_id))
        cursor.execute("INSERT INTO calculation_items (calculation_id, food_id, quantity_grams, portion_unit_name) VALUES (?, ?, 50.0, '1 large egg')", (calc_id, egg_id))
        cursor.execute("INSERT INTO calculation_items (calculation_id, food_id, quantity_grams, portion_unit_name) VALUES (?, ?, 100.0, '100g strained')", (calc_id, yogurt_id))

        # Seed sample recipe: Mediterranean Salmon & Vegetable Skillet
        salmon_id = cursor.execute("SELECT id FROM foods WHERE code = 'FDC-175167'").fetchone()["id"]
        spinach_id = cursor.execute("SELECT id FROM foods WHERE code = 'FDC-170379'").fetchone()["id"]
        olive_oil_id = cursor.execute("SELECT id FROM foods WHERE code = 'FDC-171413'").fetchone()["id"]

        cursor.execute("""
            INSERT INTO recipes (
                user_id, project_id, name, description, category, servings,
                total_weight_grams, cooking_instructions, research_notes, allergens
            ) VALUES (?, ?, 'Mediterranean Wild Salmon & Greens', 'Heart-healthy pan-seared salmon with baby spinach and cold-pressed extra virgin olive oil.', 'Entrée', 2.0, 310.0, 'Sear salmon in olive oil for 4 minutes per side; gently wilt fresh spinach with residual heat.', 'Demonstration recipe showing nutrient concentration per serving.', 'Fish')
        """, (user_id, project_id))
        recipe_id = cursor.lastrowid

        cursor.execute("INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams, preparation_note) VALUES (?, ?, 198.0, 'Fresh skinless wild fillet')", (recipe_id, salmon_id))
        cursor.execute("INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams, preparation_note) VALUES (?, ?, 100.0, 'Washed raw baby spinach')", (recipe_id, spinach_id))
        cursor.execute("INSERT INTO recipe_ingredients (recipe_id, food_id, quantity_grams, preparation_note) VALUES (?, ?, 14.0, 'Extra virgin cold pressed')", (recipe_id, olive_oil_id))

        # Seed sample dietary recall diary
        cursor.execute("""
            INSERT INTO food_diaries (user_id, project_id, client_code, diary_date, assessment_type, reference_profile_id, notes)
            VALUES (?, ?, 'SUBJ-409', '2026-10-24', '24-Hour Recall', 1, 'Day 1 baseline recall for longitudinal micronutrient study.')
        """, (user_id, project_id))
        diary_id = cursor.lastrowid

        cursor.execute("INSERT INTO diary_entries (diary_id, meal_type, food_id, item_type, quantity_grams, portion_description) VALUES (?, 'Breakfast', ?, 'food', 81.0, '1 cup dry rolled oats')", (diary_id, oats_id))
        cursor.execute("INSERT INTO diary_entries (diary_id, meal_type, food_id, item_type, quantity_grams, portion_description) VALUES (?, 'Breakfast', ?, 'food', 118.0, '1 medium banana')", (diary_id, cursor.execute("SELECT id FROM foods WHERE code = 'FDC-173944'").fetchone()["id"]))
        cursor.execute("INSERT INTO diary_entries (diary_id, meal_type, food_id, item_type, quantity_grams, portion_description) VALUES (?, 'Lunch', ?, 'recipe', 155.0, '1 serving Mediterranean Salmon')", (diary_id, recipe_id))

        # Seed sample anthropometric assessment
        cursor.execute("""
            INSERT INTO anthropometrics (
                user_id, project_id, subject_identifier, age_years, sex, assessment_date,
                height_cm, weight_kg, waist_cm, hip_cm, bmi, bmi_category,
                waist_to_height_ratio, reference_standard, notes
            ) VALUES (?, ?, 'SUBJ-409', 23, 'Male', '2026-10-24', 178.0, 72.5, 81.0, 96.0, 22.88, 'Normal Weight', 0.455, 'WHO Adult Standard', 'Baseline physical assessment.')
        """, (user_id, project_id))

    conn.commit()
    conn.close()
    print("Database seeded successfully.")

if __name__ == "__main__":
    seed_database()
