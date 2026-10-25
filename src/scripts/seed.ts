/**
 * Administrative Seed & Import Script
 * Safely imports reference food compositions (TKPI 2017) and portion estimation photos (Buku Foto Makanan 2014)
 * into Supabase PostgreSQL via Drizzle ORM.
 * 
 * Safety Guarantee:
 * - Does NOT overwrite or drop existing user accounts, calculations, or research records.
 * - Uses ON CONFLICT DO NOTHING / insert ignore logic.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { getDb, isDbConnected } from "../db";
import { foodSources, foods, foodNames, foodNutrients, foodPortions, referenceDocuments } from "../db/schema";
import { TKPI_FOOD_RECORDS } from "../data/tkpi2017";
import { BUKU_FOTO_MAKANAN_CATALOG } from "../data/bukuFotoMakanan2014";
import { eq } from "drizzle-orm";

async function runAdministrativeSeed() {
  console.log("🌱 NutriNexa Administrative Reference Data Importer");
  console.log("--------------------------------------------------");

  if (!isDbConnected()) {
    console.error("❌ DATABASE_URL is not configured or reachable. Please check your .env.local file.");
    process.exit(1);
  }

  const db = getDb();
  if (!db) {
    console.error("❌ Failed to initialize Drizzle database client.");
    process.exit(1);
  }

  console.log("📡 Connected to Supabase PostgreSQL.");

  // 1. Seed Reference Documents & Sources
  console.log("1️⃣ Seeding Reference Sources (TKPI 2017 & Buku Foto Makanan 2014)...");
  
  await db
    .insert(foodSources)
    .values([
      {
        code: "TKPI_2017",
        name: "Tabel Komposisi Pangan Indonesia 2017",
        shortTitle: "TKPI 2017",
        citation: "Kementerian Kesehatan RI. Tabel Komposisi Pangan Indonesia (TKPI) 2017. Jakarta: Direktorat Gizi Masyarakat, 2018.",
        publicationYear: 2018,
        country: "ID",
        description: "Official Indonesian food composition database with analytical nutrient values per 100g edible portion (BDD).",
        isPublic: true,
      },
      {
        code: "BUKU_FOTO_2014",
        name: "Buku Foto Makanan 2014",
        shortTitle: "Buku Foto Makanan",
        citation: "Badan Litbangkes Kemenkes RI. Buku Foto Makanan: Survei Konsumsi Makanan Individu. Jakarta, 2014.",
        publicationYear: 2014,
        country: "ID",
        description: "Photographic food portion estimation reference with household measures and edible weights for dietary surveys.",
        isPublic: true,
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(referenceDocuments)
    .values([
      {
        documentCode: "DOC-TKPI-2017",
        title: "Tabel Komposisi Pangan Indonesia 2017",
        authors: "Direktorat Gizi Masyarakat",
        publisher: "Kementerian Kesehatan RI",
        publicationYear: 2018,
        pageCount: 135,
        extractionStatus: "verified",
        summary: "Standard reference containing nutrient values per 100g edible portion for Indonesian agricultural and culinary foods.",
      },
      {
        documentCode: "DOC-BUKU-FOTO-2014",
        title: "Buku Foto Makanan - SKMI 2014",
        authors: "Badan Penelitian dan Pengembangan Kesehatan",
        publisher: "Kementerian Kesehatan RI",
        publicationYear: 2014,
        pageCount: 160,
        extractionStatus: "verified",
        summary: "Visual portion estimation reference displaying household measures (centong, potong, piring) and weights.",
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Reference sources registered.");

  // 2. Seed TKPI Food Records
  console.log("2️⃣ Seeding TKPI 2017 Reference Foods...");
  let insertedFoods = 0;

  for (const tkpi of TKPI_FOOD_RECORDS) {
    const existing = await db.select().from(foods).where(eq(foods.foodCode, tkpi.code)).limit(1);
    if (existing.length === 0) {
      const [newFood] = await db
        .insert(foods)
        .values({
          foodCode: tkpi.code,
          primaryName: tkpi.name_id,
          scientificName: tkpi.scientific_name || null,
          foodGroup: tkpi.food_group,
          preparationState: tkpi.preparation_state,
          ediblePortionFactor: tkpi.bdd_percentage / 100.0,
          ediblePercentage: tkpi.bdd_percentage,
          refuseDescription: tkpi.refuse_description || null,
          sourcePage: tkpi.source_page,
          dataQualityGrade: "Validated (TKPI Grade A)",
          isCustom: false,
          isVerified: true,
        })
        .returning();

      // Seed synonyms in food_names
      await db.insert(foodNames).values([
        { foodId: newFood.id, name: tkpi.name_id, languageCode: "id", isPrimary: true, nameType: "vernacular" },
        { foodId: newFood.id, name: tkpi.name_en, languageCode: "en", isPrimary: false, nameType: "synonym" },
        ...tkpi.synonyms.map((s) => ({
          foodId: newFood.id,
          name: s,
          languageCode: "id",
          isPrimary: false,
          nameType: "local",
        })),
      ]);

      // Seed nutrients
      const nutEntries = [
        { code: "energy_kcal", amount: tkpi.nutrients.energy_kcal, unit: "kcal" },
        { code: "protein", amount: tkpi.nutrients.protein_g, unit: "g" },
        { code: "fat", amount: tkpi.nutrients.fat_g, unit: "g" },
        { code: "carbs", amount: tkpi.nutrients.carbs_g, unit: "g" },
        { code: "fiber", amount: tkpi.nutrients.fiber_g, unit: "g" },
        { code: "calcium", amount: tkpi.nutrients.calcium_mg, unit: "mg" },
        { code: "iron", amount: tkpi.nutrients.iron_mg, unit: "mg" },
        { code: "sodium", amount: tkpi.nutrients.sodium_mg, unit: "mg" },
        { code: "potassium", amount: tkpi.nutrients.potassium_mg, unit: "mg" },
        { code: "vit_c", amount: tkpi.nutrients.vit_c_mg, unit: "mg" },
        { code: "thiamin_b1", amount: tkpi.nutrients.thiamin_b1_mg, unit: "mg" },
        { code: "riboflavin_b2", amount: tkpi.nutrients.riboflavin_b2_mg, unit: "mg" },
        { code: "niacin_b3", amount: tkpi.nutrients.niacin_b3_mg, unit: "mg" },
      ];

      for (const n of nutEntries) {
        await db.insert(foodNutrients).values({
          foodId: newFood.id,
          nutrientCode: n.code,
          amountPer100g: n.amount,
          unit: n.unit,
          isMissing: false,
          isTrace: false,
          valueType: tkpi.value_type,
          methodNote: tkpi.source_page,
        });
      }

      insertedFoods++;
    }
  }

  console.log(`✅ Seeded ${insertedFoods} new TKPI food records.`);

  // 3. Seed Buku Foto Makanan 2014 Portions
  console.log("3️⃣ Seeding Buku Foto Makanan 2014 Photographic Portions...");
  let insertedPortions = 0;

  for (const bfm of BUKU_FOTO_MAKANAN_CATALOG) {
    const matchingFoods = await db.select().from(foods).where(eq(foods.foodCode, bfm.food_code_ref)).limit(1);
    if (matchingFoods.length > 0) {
      const foodId = matchingFoods[0].id;

      // Small portion
      await db.insert(foodPortions).values({
        foodId,
        portionName: `${bfm.food_name_id} - ${bfm.portions.kecil.label_id}`,
        portionSizeCategory: "Kecil",
        gramWeight: bfm.portions.kecil.raw_weight_grams,
        householdMeasure: bfm.portions.kecil.household_desc,
        sourceDocument: "Buku Foto Makanan 2014",
        sourcePage: bfm.source_page,
        photoReference: bfm.photo_badge,
        edibleWeightGrams: bfm.portions.kecil.edible_weight_grams,
      });

      // Medium portion (Standard)
      await db.insert(foodPortions).values({
        foodId,
        portionName: `${bfm.food_name_id} - ${bfm.portions.sedang.label_id}`,
        portionSizeCategory: "Sedang",
        gramWeight: bfm.portions.sedang.raw_weight_grams,
        householdMeasure: bfm.portions.sedang.household_desc,
        sourceDocument: "Buku Foto Makanan 2014",
        sourcePage: bfm.source_page,
        photoReference: bfm.photo_badge,
        edibleWeightGrams: bfm.portions.sedang.edible_weight_grams,
      });

      // Large portion
      await db.insert(foodPortions).values({
        foodId,
        portionName: `${bfm.food_name_id} - ${bfm.portions.besar.label_id}`,
        portionSizeCategory: "Besar",
        gramWeight: bfm.portions.besar.raw_weight_grams,
        householdMeasure: bfm.portions.besar.household_desc,
        sourceDocument: "Buku Foto Makanan 2014",
        sourcePage: bfm.source_page,
        photoReference: bfm.photo_badge,
        edibleWeightGrams: bfm.portions.besar.edible_weight_grams,
      });

      insertedPortions += 3;
    }
  }

  console.log(`✅ Seeded ${insertedPortions} photographic portions.`);
  console.log("🎉 Administrative reference import completed successfully.");
  process.exit(0);
}

runAdministrativeSeed().catch((err) => {
  console.error("❌ Administrative seed error:", err);
  process.exit(1);
});
