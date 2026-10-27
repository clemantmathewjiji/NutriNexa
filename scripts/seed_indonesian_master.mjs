import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../src/data/indonesian_food_composition.json');
const foodsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

console.log(`========================================================================`);
console.log(`🇮🇩 NutriNexa Master Indonesian Food Database Ingestion`);
console.log(`   Source 1: Buku TKPI 2017 (Tabel Komposisi Pangan Indonesia)`);
console.log(`   Source 2: Buku Foto Makanan 2014 (SKMI Porsimetri)`);
console.log(`   Total Foods to Ingest: ${foodsData.length}`);
console.log(`========================================================================`);

const conn = process.env.DATABASE_URL || 'postgresql://postgres.gbbjznttbcmdxcwypquc:EKWObPJaNhDoSCTs@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(conn, { prepare: false, connect_timeout: 30 });

const NUTRIENT_MAPPING = [
  { key: 'energy_kcal', code: 'energy_kcal', unit: 'kcal' },
  { key: 'protein_g', code: 'protein', unit: 'g' },
  { key: 'fat_g', code: 'fat', unit: 'g' },
  { key: 'carbs_g', code: 'carbs', unit: 'g' },
  { key: 'fiber_g', code: 'fiber', unit: 'g' },
  { key: 'water_g', code: 'water', unit: 'g' },
  { key: 'calcium_mg', code: 'calcium', unit: 'mg' },
  { key: 'phosphorus_mg', code: 'phosphorus', unit: 'mg' },
  { key: 'iron_mg', code: 'iron', unit: 'mg' },
  { key: 'sodium_mg', code: 'sodium', unit: 'mg' },
  { key: 'potassium_mg', code: 'potassium', unit: 'mg' },
  { key: 'copper_mg', code: 'copper', unit: 'mg' },
  { key: 'zinc_mg', code: 'zinc', unit: 'mg' },
  { key: 'retinol_mcg', code: 'vitamin_a', unit: 'µg' },
  { key: 'thiamin_b1_mg', code: 'thiamin', unit: 'mg' },
  { key: 'riboflavin_b2_mg', code: 'riboflavin', unit: 'mg' },
  { key: 'niacin_b3_mg', code: 'niacin', unit: 'mg' },
  { key: 'vit_c_mg', code: 'vitamin_c', unit: 'mg' },
];

async function main() {
  const startTime = Date.now();
  console.log('📡 Connecting to Supabase PostgreSQL database...');

  // 1. Bulk Upsert Foods in chunks of 100
  console.log('\n1️⃣ Ingesting Foods...');
  const FOOD_CHUNK = 100;
  for (let i = 0; i < foodsData.length; i += FOOD_CHUNK) {
    const slice = foodsData.slice(i, i + FOOD_CHUNK);
    const rows = slice.map(item => ({
      code: item.code,
      name: item.name,
      alt_names: item.alt_names || '',
      food_group: item.food_group,
      category: item.food_group,
      scientific_name: item.scientific_name || '',
      description: item.description || '',
      source_name: 'TKPI 2017 (Kemenkes RI)',
      source_citation: item.source_citation || 'Kemenkes RI 2018',
      source_year: '2018',
      standard_quantity: 100.0,
      standard_unit: 'g',
      preparation_state: item.preparation_state || 'Raw / Segar',
      is_custom: 0,
      data_quality_grade: 'Validated (TKPI Grade A)'
    }));

    await sql`
      INSERT INTO foods ${sql(rows, 'code', 'name', 'alt_names', 'food_group', 'category', 'scientific_name', 'description', 'source_name', 'source_citation', 'source_year', 'standard_quantity', 'standard_unit', 'preparation_state', 'is_custom', 'data_quality_grade')}
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        alt_names = EXCLUDED.alt_names,
        food_group = EXCLUDED.food_group,
        category = EXCLUDED.category,
        scientific_name = EXCLUDED.scientific_name,
        description = EXCLUDED.description,
        source_name = EXCLUDED.source_name,
        source_citation = EXCLUDED.source_citation,
        preparation_state = EXCLUDED.preparation_state;
    `;
    const progress = Math.min(i + FOOD_CHUNK, foodsData.length);
    console.log(`   Processed ${progress}/${foodsData.length} foods...`);
  }

  // 2. Query all food codes to get DB IDs
  console.log('\n2️⃣ Mapping Database IDs...');
  const allDbFoods = await sql`SELECT id, code FROM foods;`;
  const codeToId = new Map(allDbFoods.map(r => [r.code, r.id]));
  console.log(`   Found ${codeToId.size} foods in database.`);

  // 3. Prepare All Nutrients and Portions
  console.log('\n3️⃣ Preparing Nutrients and Photographic Portions...');
  const allNutrients = [];
  const allPortions = [];
  const foodIdsToCleanPortions = [];

  for (const item of foodsData) {
    const dbId = codeToId.get(item.code);
    if (!dbId) continue;

    foodIdsToCleanPortions.push(dbId);

    // Nutrients
    for (const m of NUTRIENT_MAPPING) {
      let val = item.nutrients[m.key];
      if (val !== undefined && val !== null && !isNaN(val)) {
        if (m.code === 'vitamin_a' && (!val || val === 0)) {
          const bCar = item.nutrients['beta_carotene_mcg'];
          if (bCar && bCar > 0) {
            val = Math.round((bCar / 12) * 10) / 10;
          }
        }
        allNutrients.push({
          food_id: dbId,
          nutrient_code: m.code,
          amount_per_100g: Number(val),
          unit: m.unit,
          is_missing: 0,
          is_trace: 0
        });
      }
    }

    // Portions
    if (item.portions && item.portions.length > 0) {
      for (const p of item.portions) {
        allPortions.push({
          food_id: dbId,
          unit_name: p.name,
          gram_weight: Number(p.weight)
        });
      }
    }
  }

  console.log(`   Generated ${allNutrients.length} nutrient values.`);
  console.log(`   Generated ${allPortions.length} portion records.`);

  // 4. Bulk Delete existing portions for these foods
  console.log('\n4️⃣ Refreshing Portion Units...');
  const PORTION_CLEAN_CHUNK = 200;
  for (let i = 0; i < foodIdsToCleanPortions.length; i += PORTION_CLEAN_CHUNK) {
    const ids = foodIdsToCleanPortions.slice(i, i + PORTION_CLEAN_CHUNK);
    await sql`DELETE FROM portion_units WHERE food_id IN ${sql(ids)};`;
  }

  // 5. Bulk Insert Portions in chunks of 500
  const PORTION_CHUNK = 500;
  for (let i = 0; i < allPortions.length; i += PORTION_CHUNK) {
    const slice = allPortions.slice(i, i + PORTION_CHUNK);
    await sql`INSERT INTO portion_units ${sql(slice, 'food_id', 'unit_name', 'gram_weight')};`;
    const progress = Math.min(i + PORTION_CHUNK, allPortions.length);
    console.log(`   Inserted ${progress}/${allPortions.length} portions...`);
  }

  // 6. Bulk Upsert Nutrients in chunks of 500
  console.log('\n5️⃣ Ingesting Nutrient Values...');
  const NUT_CHUNK = 500;
  for (let i = 0; i < allNutrients.length; i += NUT_CHUNK) {
    const slice = allNutrients.slice(i, i + NUT_CHUNK);
    await sql`
      INSERT INTO food_nutrients ${sql(slice, 'food_id', 'nutrient_code', 'amount_per_100g', 'unit', 'is_missing', 'is_trace')}
      ON CONFLICT (food_id, nutrient_code) DO UPDATE SET
        amount_per_100g = EXCLUDED.amount_per_100g,
        unit = EXCLUDED.unit;
    `;
    const progress = Math.min(i + NUT_CHUNK, allNutrients.length);
    console.log(`   Inserted ${progress}/${allNutrients.length} nutrients...`);
  }

  // 7. Audit Log
  try {
    await sql`
      INSERT INTO audit_logs (action, entity_type, details)
      VALUES (
        'INDONESIAN_DATABASE_INGESTION',
        'foods',
        ${`Imported complete Indonesian food dataset from TKPI 2017 & Buku Foto Makanan 2014. Foods: ${foodsData.length}, Nutrients: ${allNutrients.length}, Portions: ${allPortions.length}.`}
      );
    `;
  } catch (e) {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================================================`);
  console.log(`🎉 INGESTION COMPLETE in ${elapsed}s!`);
  console.log(`   - Foods in DB: ${allDbFoods.length}`);
  console.log(`   - TKPI Foods: ${foodsData.length}`);
  console.log(`   - Nutrient Data Points: ${allNutrients.length}`);
  console.log(`   - Photographic & Household Portions: ${allPortions.length}`);
  console.log(`========================================================================`);

  await sql.end();
}

main().catch(err => {
  console.error('❌ Ingestion Error:', err);
  process.exit(1);
});
