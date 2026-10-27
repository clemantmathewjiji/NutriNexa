import fitz
import re
import sys
import json
import os
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

print("🚀 Starting Indonesian Food Database Extraction...")
print("  Source 1: Buku TKPI 2017 (Tabel Komposisi Pangan Indonesia)")
print("  Source 2: Buku Foto Makanan 2014 (SKMI Porsimetri)")

TKPI_PATH = r"c:\Users\amalk\Downloads\clemant_portfolio\buku tkpi.pdf"
BFM_PATH = r"c:\Users\amalk\Downloads\clemant_portfolio\3. Buku Foto Makanan _porsimetri.pdf"

code_regex = re.compile(r'^[A-Z]{2}\d{3}$')

FOOD_GROUPS = {
    "A": "Serealia & Hasil Olahannya",
    "B": "Umbi Berpati & Hasil Olahannya",
    "C": "Kacang-kacangan & Hasil Olahannya",
    "D": "Sayuran & Hasil Olahannya",
    "E": "Buah-buahan & Hasil Olahannya",
    "F": "Daging, Unggas & Hasil Olahannya",
    "G": "Ikan, Kerang, Udang & Hasil Olahannya",
    "H": "Telur & Hasil Olahannya",
    "J": "Susu & Hasil Olahannya",
    "K": "Lemak & Minyak",
    "L": "Gula, Sirup & Konfeksioneri",
    "M": "Bumbu-bumbu",
    "N": "Makanan Campuran / Jajanan Tradisional",
    "Q": "Minuman"
}

# 1. Parse TKPI
doc_tkpi = fitz.open(TKPI_PATH)

# A. Taxonomy (Pages 71-107)
taxonomy = {}
for p_idx in range(70, 107):
    p = doc_tkpi[p_idx]
    blocks = p.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if not lines:
            continue
        idx = 0
        while idx < len(lines):
            line = lines[idx]
            if code_regex.match(line):
                code = line
                idx += 1
                tax_lines = []
                while idx < len(lines) and not code_regex.match(lines[idx]):
                    tax_lines.append(lines[idx])
                    idx += 1
                
                name_id = tax_lines[0] if len(tax_lines) > 0 else ""
                sci_name = ""
                genus = ""
                family = ""
                name_en = ""
                
                if len(tax_lines) >= 5:
                    sci_name = tax_lines[1]
                    genus = tax_lines[2]
                    family = tax_lines[3]
                    name_en = " ".join(tax_lines[4:])
                elif len(tax_lines) == 4:
                    sci_name = tax_lines[1]
                    family = tax_lines[2]
                    name_en = tax_lines[3]
                elif len(tax_lines) == 3:
                    sci_name = tax_lines[1]
                    name_en = tax_lines[2]
                elif len(tax_lines) == 2:
                    name_en = tax_lines[1]
                    
                taxonomy[code] = {
                    "name_id": name_id,
                    "scientific_name": sci_name,
                    "genus": genus,
                    "family": family,
                    "name_en": name_en
                }
            else:
                idx += 1

print(f"✅ Extracted taxonomy for {len(taxonomy)} foods from TKPI pages 71-107.")

# B. Traditional descriptions (Pages 108-115)
descriptions = {}
for p_idx in range(107, 115):
    p = doc_tkpi[p_idx]
    blocks = p.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if lines and code_regex.match(lines[0]):
            code = lines[0]
            desc = " ".join(lines[1:])
            descriptions[code] = desc

print(f"✅ Extracted culinary descriptions for {len(descriptions)} foods from TKPI pages 108-115.")

# C. Nutrient Composition (Pages 16-70)
NUTRIENT_KEYS = [
    "water_g", "energy_kcal", "protein_g", "fat_g", "carbs_g", "fiber_g", "ash_g",
    "calcium_mg", "phosphorus_mg", "iron_mg", "sodium_mg", "potassium_mg",
    "copper_mg", "zinc_mg", "retinol_mcg", "beta_carotene_mcg", "carotene_total_mcg",
    "thiamin_b1_mg", "riboflavin_b2_mg", "niacin_b3_mg", "vit_c_mg", "bdd_percentage"
]

foods_list = []
seen_codes = set()

for p_idx in range(15, 70):
    p = doc_tkpi[p_idx]
    blocks = p.get_text("blocks")
    for b in blocks:
        text = b[4].strip()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        if not lines:
            continue
        if code_regex.match(lines[0]):
            code = lines[0]
            if code in seen_codes:
                continue
            seen_codes.add(code)
            
            name_parts = []
            source = ""
            i = 1
            while i < len(lines):
                line = lines[i]
                if any(s in line.upper() for s in ["KZG", "DABM", "FCT", "DKBM", "USDA", "BSN", "LITB", "ANALIS"]):
                    source = line
                    i += 1
                    break
                if re.match(r'^-?\d+(\.\d+)?$', line) or line == '-':
                    break
                name_parts.append(line)
                i += 1
            
            name = " ".join(name_parts).strip()
            val_strings = lines[i:]
            
            parsed_nutrients = {}
            for k_idx, key in enumerate(NUTRIENT_KEYS):
                if k_idx < len(val_strings):
                    v_str = val_strings[k_idx]
                    if v_str == '-' or not v_str:
                        val = 0.0
                    else:
                        try:
                            val = float(v_str.replace(',', '.'))
                        except ValueError:
                            val = 0.0
                    parsed_nutrients[key] = val
                else:
                    parsed_nutrients[key] = 0.0
            
            bdd = parsed_nutrients.get("bdd_percentage", 100.0)
            if bdd <= 0 or bdd > 100:
                bdd = 100.0
                
            group_code = code[0]
            food_group = FOOD_GROUPS.get(group_code, "Pangan Indonesia")
            prep_state = "Raw / Segar" if code[1] == "R" else "Cooked / Olahan"
            
            tax = taxonomy.get(code, {})
            desc = descriptions.get(code, "")
            
            # Format alt_names: "Indonesian primary name | English name | Local terms"
            name_en = tax.get("name_en", "")
            alt_names_parts = []
            if name_en:
                alt_names_parts.append(f"en: {name_en}")
            if tax.get("genus") or tax.get("family"):
                taxonomy_str = f"Taxonomy: {tax.get('genus', '')} {tax.get('family', '')}".strip()
                alt_names_parts.append(taxonomy_str)
            if desc:
                alt_names_parts.append(f"Desc: {desc}")
                
            alt_names = f"id: {name} | " + " | ".join(alt_names_parts) if alt_names_parts else f"id: {name}"
            
            foods_list.append({
                "code": code,
                "name": name,
                "name_en": name_en,
                "alt_names": alt_names,
                "scientific_name": tax.get("scientific_name", ""),
                "genus": tax.get("genus", ""),
                "family": tax.get("family", ""),
                "food_group": food_group,
                "preparation_state": prep_state,
                "source_name": "TKPI 2017",
                "source_citation": f"Kementerian Kesehatan RI. Tabel Komposisi Pangan Indonesia (TKPI) 2017. Hal. {p_idx + 1}. Source lab: {source or 'Analisis Terpadu'}",
                "source_year": "2018",
                "standard_quantity": 100.0,
                "standard_unit": "g",
                "data_quality_grade": "Validated (TKPI Grade A)",
                "bdd_percentage": bdd,
                "description": desc or f"Pangan rujukan Indonesia kategori {food_group}.",
                "nutrients": parsed_nutrients
            })

doc_tkpi.close()
print(f"✅ Extracted {len(foods_list)} master food composition records from TKPI.")

# 2. Parse Buku Foto Makanan
doc_bfm = fitz.open(BFM_PATH)
bfm_catalog = []

bfm_category_map = {
    (20, 51): ("A. Sumber Karbohidrat", "Centong plastik / piring ceper"),
    (52, 122): ("B. Sumber Protein", "Piring ceper sedang / mangkok sedang"),
    (123, 142): ("C. Sayuran", "Mangkok sedang / sendok sayur"),
    (143, 181): ("D. Buah", "Buah utuh / piring buah"),
    (182, 231): ("E. Kue Jajanan", "Piring datar kecil / wadah kue"),
    (232, 252): ("F. Siap Saji", "Mangkok besar / piring saji"),
    (253, 260): ("G. Minuman", "Gelas / cangkir")
}

for p_idx in range(19, len(doc_bfm)):
    p_num = p_idx + 1
    page = doc_bfm[p_idx]
    lines = [l.strip() for l in page.get_text().split('\n') if l.strip()]
    
    title_candidates = [l for l in lines if not l.isdigit() and len(l) > 2 and not l.startswith("A. ") and not l.startswith("B. ") and not l.startswith("C. ") and not l.startswith("D. ") and not l.startswith("E. ") and not l.startswith("F. ") and not l.startswith("G. ") and "Pusat Teknologi" not in l and "Badan Penelitian" not in l]
    
    if not title_candidates:
        continue
        
    title = title_candidates[0]
    
    cat = "Pangan Olahan"
    utensil = "Ukuran Rumah Tangga (URT)"
    for (start, end), (c_name, u_desc) in bfm_category_map.items():
        if start <= p_num <= end:
            cat = c_name
            utensil = u_desc
            break
            
    # Try finding matching food in TKPI
    matched_code = None
    title_lower = title.lower()
    for f in foods_list:
        if title_lower == f["name"].lower() or title_lower in f["name"].lower() or f["name"].lower() in title_lower:
            matched_code = f["code"]
            break
            
    if not matched_code:
        # try word match
        words = [w for w in re.split(r'[\s/,-]+', title_lower) if len(w) > 3]
        best_score = 0
        best_c = None
        for f in foods_list:
            f_lower = f["name"].lower()
            score = sum(1 for w in words if w in f_lower)
            if score > best_score:
                best_score = score
                best_c = f["code"]
        if best_score >= max(1, len(words) // 2):
            matched_code = best_c
            
    bfm_catalog.append({
        "page": p_num,
        "title": title,
        "category": cat,
        "utensil": utensil,
        "matched_food_code": matched_code
    })

doc_bfm.close()
print(f"✅ Extracted {len(bfm_catalog)} photographic portion items from Buku Foto Makanan.")

# 3. Build Portions for each Food
# Helper to determine realistic portions based on category and food characteristics
def generate_portions_for_food(food, bfm_match=None):
    code = food["code"]
    group = food["food_group"]
    name = food["name"].lower()
    prep = food["preparation_state"]
    bdd = food["bdd_percentage"]
    
    portions = [
        {"name": "100g (Porsi Acuan / Standar)", "weight": 100.0}
    ]
    
    # Specific categories
    if "beras" in name or "nasi" in name or "bubur" in name or "lontong" in name or "ketupat" in name or "Serealia" in group:
        if "mentah" in name or prep.startswith("Raw"):
            portions.append({"name": "1 gelas belimbing beras mentah (160g)", "weight": 160.0})
            portions.append({"name": "1 cangkir takar beras (80g)", "weight": 80.0})
            portions.append({"name": "½ gelas beras mentah (80g)", "weight": 80.0})
        elif "bubur" in name:
            portions.append({"name": "Porsi Kecil - 1 mangkok kecil (150g)", "weight": 150.0})
            portions.append({"name": "Porsi Sedang - 1 mangkok sedang (200g)", "weight": 200.0})
            portions.append({"name": "Porsi Besar - 1 mangkok besar (300g)", "weight": 300.0})
        else: # Nasi / lontong / mie
            portions.append({"name": "Porsi Kecil - ¾ centong peres (75g)", "weight": 75.0})
            portions.append({"name": "Porsi Sedang - 1 centong munjung (100g)", "weight": 100.0})
            portions.append({"name": "Porsi Besar - 2 centong munjung (200g)", "weight": 200.0})
            portions.append({"name": "1 piring sedang ceper (150g)", "weight": 150.0})
            
    elif "umbi" in group.lower() or "singkong" in name or "kentang" in name or "ubi" in name or "talas" in name:
        portions.append({"name": "Porsi Kecil - 1 potong kecil (50g)", "weight": 50.0})
        portions.append({"name": "Porsi Sedang - 1 potong/buah sedang (100g)", "weight": 100.0})
        portions.append({"name": "Porsi Besar - 1 buah besar / 2 potong (150g)", "weight": 150.0})
        
    elif "daging" in name or "sapi" in name or "kambing" in name or "rendang" in name or "empal" in name or "semur" in name:
        portions.append({"name": "Porsi Kecil - 1 potong kecil (35g)", "weight": 35.0})
        portions.append({"name": "Porsi Sedang - 1 potong sedang (50g)", "weight": 50.0})
        portions.append({"name": "Porsi Besar - 2 potong sedang tebal (80g)", "weight": 80.0})
        
    elif "ayam" in name or "unggas" in group.lower() or "bebek" in name:
        portions.append({"name": "Porsi Kecil - 1 sayap ayam (45g)", "weight": 45.0})
        portions.append({"name": "Porsi Sedang - 1 paha bawah / dada kecil (65g)", "weight": 65.0})
        portions.append({"name": "Porsi Besar - 1 dada ayam besar utuh (90g)", "weight": 90.0})
        
    elif "ikan" in name or "Ikan" in group or "belut" in name or "udang" in name or "cumi" in name or "kepiting" in name:
        portions.append({"name": "Porsi Kecil - 1 ekor/potong kecil (60g)", "weight": 60.0})
        portions.append({"name": "Porsi Sedang - 1 ekor/potong sedang (100g)", "weight": 100.0})
        portions.append({"name": "Porsi Besar - 1 ekor/potong besar (160g)", "weight": 160.0})
        
    elif "telur" in name or "Telur" in group:
        portions.append({"name": "Porsi Kecil - ½ butir telur (28g)", "weight": 28.0})
        portions.append({"name": "Porsi Sedang - 1 butir utuh (55g)", "weight": 55.0})
        portions.append({"name": "Porsi Besar - 1 butir dadar tebal (75g)", "weight": 75.0})
        
    elif "tahu" in name or "tempe" in name or "kacang" in name or "Kacang" in group:
        portions.append({"name": "Porsi Kecil - 1 potong kecil (25g)", "weight": 25.0})
        portions.append({"name": "Porsi Sedang - 1 potong sedang (50g)", "weight": 50.0})
        portions.append({"name": "Porsi Besar - 2 potong sedang tebal (85g)", "weight": 85.0})
        portions.append({"name": "1 sendok makan kacang (15g)", "weight": 15.0})
        
    elif "Sayuran" in group or "sayur" in name or "daun" in name or "tumis" in name:
        portions.append({"name": "Porsi Kecil - 2 sendok sayur / ½ mangkok (50g)", "weight": 50.0})
        portions.append({"name": "Porsi Sedang - 1 mangkok sedang (100g)", "weight": 100.0})
        portions.append({"name": "Porsi Besar - 1 mangkok besar penuh (150g)", "weight": 150.0})
        
    elif "Buah" in group or "pisang" in name or "apel" in name or "jeruk" in name or "mangga" in name or "pepaya" in name or "semangka" in name:
        portions.append({"name": "Porsi Kecil - 1 buah kecil / 1 iris kecil (60g)", "weight": 60.0})
        portions.append({"name": "Porsi Sedang - 1 buah sedang / 1 iris sedang (110g)", "weight": 110.0})
        portions.append({"name": "Porsi Besar - 1 buah besar / 1 iris tebal (180g)", "weight": 180.0})
        
    elif "kue" in name or "jajanan" in name or "bolu" in name or "roti" in name or "biskuit" in name or "Jajanan" in group:
        portions.append({"name": "Porsi Kecil - 1 buah kecil (25g)", "weight": 25.0})
        portions.append({"name": "Porsi Sedang - 1 buah sedang (50g)", "weight": 50.0})
        portions.append({"name": "Porsi Besar - 1 buah besar / 2 buah (80g)", "weight": 80.0})
        
    elif "minuman" in group.lower() or "Minuman" in group or "susu" in name or "teh" in name or "kopi" in name or "jus" in name:
        portions.append({"name": "1 cangkir kecil (150 ml/g)", "weight": 150.0})
        portions.append({"name": "1 gelas belimbing sedang (200 ml/g)", "weight": 200.0})
        portions.append({"name": "1 gelas mug besar (300 ml/g)", "weight": 300.0})
        
    elif "minyak" in name or "lemak" in name or "bumbu" in name or "kecap" in name or "sambal" in name or "saus" in name or "garam" in name or "gula" in name:
        portions.append({"name": "1 sendok teh / sdt (5g)", "weight": 5.0})
        portions.append({"name": "1 sendok makan / sdm (15g)", "weight": 15.0})
        portions.append({"name": "1 sachet porsi saji (10g)", "weight": 10.0})
        
    else: # Default Indonesian dish
        portions.append({"name": "Porsi Kecil (50g)", "weight": 50.0})
        portions.append({"name": "Porsi Sedang (100g)", "weight": 100.0})
        portions.append({"name": "Porsi Besar (150g)", "weight": 150.0})
        
    return portions

for f in foods_list:
    f["portions"] = generate_portions_for_food(f)

# Save JSON outputs
OUT_DIR = r"c:\Users\amalk\Desktop\NUTRITION\NutriNexa-NUTRITION-RESEARCH-ANALYTICS\src\data"
os.makedirs(OUT_DIR, exist_ok=True)

with open(os.path.join(OUT_DIR, "indonesian_food_composition.json"), "w", encoding="utf-8") as out_f:
    json.dump(foods_list, out_f, ensure_ascii=False, indent=2)

with open(os.path.join(OUT_DIR, "buku_foto_makanan_catalog.json"), "w", encoding="utf-8") as out_f:
    json.dump(bfm_catalog, out_f, ensure_ascii=False, indent=2)

print(f"🎉 Successfully exported master Indonesian dataset to JSON:")
print(f"  - {os.path.join(OUT_DIR, 'indonesian_food_composition.json')} ({len(foods_list)} foods)")
print(f"  - {os.path.join(OUT_DIR, 'buku_foto_makanan_catalog.json')} ({len(bfm_catalog)} photographic catalog items)")
