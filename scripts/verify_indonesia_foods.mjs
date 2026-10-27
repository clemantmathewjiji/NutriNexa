import postgres from 'postgres';

const conn = 'postgresql://postgres.gbbjznttbcmdxcwypquc:EKWObPJaNhDoSCTs@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres';
const sql = postgres(conn, { prepare: false });

console.log('🔍 Verifying Indonesian Database Ingestion in Supabase PostgreSQL...');

const sample = await sql`
  SELECT f.id, f.code, f.name, f.food_group, f.scientific_name,
    count(DISTINCT fn.id)::int as nutrient_count,
    count(DISTINCT pu.id)::int as portion_count
  FROM foods f
  LEFT JOIN food_nutrients fn ON fn.food_id = f.id
  LEFT JOIN portion_units pu ON pu.food_id = f.id
  WHERE f.code IN ('AR001', 'AR002', 'FP076', 'AP086', 'GR001', 'HR001')
  GROUP BY f.id, f.code, f.name, f.food_group, f.scientific_name;
`;
console.log('\nSample Indonesian Foods:');
for (const s of sample) {
  console.log(`  [${s.code}] ${s.name.padEnd(35)} | Group: ${s.food_group.padEnd(30)} | Nutrients: ${s.nutrient_count} | Portions: ${s.portion_count}`);
}

// Sample portions for Nasi
const nasiPortions = await sql`
  SELECT pu.unit_name, pu.gram_weight
  FROM portion_units pu
  JOIN foods f ON f.id = pu.food_id
  WHERE f.code = 'AR002';
`;
console.log('\nPortions for Cooked White Rice (AR002 - Nasi putih):');
for (const p of nasiPortions) {
  console.log(`  - ${p.unit_name} -> ${p.gram_weight}g`);
}

// Sample nutrients for Soto Betawi
const sotoNutrients = await sql`
  SELECT fn.nutrient_code, fn.amount_per_100g, fn.unit
  FROM food_nutrients fn
  JOIN foods f ON f.id = fn.food_id
  WHERE f.code = 'FP076'
  ORDER BY fn.nutrient_code;
`;
console.log('\nNutrient composition for Soto Betawi (FP076) per 100g:');
for (const n of sotoNutrients) {
  console.log(`  - ${n.nutrient_code.padEnd(15)}: ${n.amount_per_100g} ${n.unit}`);
}

const totalCounts = await sql`
  SELECT 
    (SELECT count(*)::int FROM foods) as total_foods,
    (SELECT count(*)::int FROM foods WHERE source_name LIKE '%TKPI%') as tkpi_foods,
    (SELECT count(*)::int FROM food_nutrients) as total_nutrients,
    (SELECT count(*)::int FROM portion_units) as total_portions;
`;
console.log('\n📊 Total Live Database Stats:');
console.log(totalCounts[0]);

await sql.end();
