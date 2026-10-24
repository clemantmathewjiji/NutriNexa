import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, foodNutrients, portionUnits } from "@/drizzle/schema";
import { eq, or, ilike, and, sql } from "drizzle-orm";
import { mockStore } from "@/lib/mockStore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")?.trim() || "";
    const foodGroup = searchParams.get("food_group") || "All Groups";
    const dataSource = searchParams.get("data_source") || "All Sources";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const conditions: any[] = [];

          if (query) {
            conditions.push(
              or(
                ilike(foods.name, `%${query}%`),
                ilike(foods.altNames, `%${query}%`),
                ilike(foods.scientificName, `%${query}%`),
                ilike(foods.foodGroup, `%${query}%`)
              )
            );
          }

          if (foodGroup !== "All Groups") {
            conditions.push(eq(foods.foodGroup, foodGroup));
          }

          if (dataSource !== "All Sources") {
            conditions.push(eq(foods.sourceName, dataSource));
          }

          const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

          const foodRows = await db
            .select()
            .from(foods)
            .where(whereClause)
            .limit(limit)
            .offset(offset);

          const allGroups = await db
            .selectDistinct({ foodGroup: foods.foodGroup })
            .from(foods);
          const allSources = await db
            .selectDistinct({ sourceName: foods.sourceName })
            .from(foods);

          // Attach nutrients & portions for each food
          const enrichedFoods = await Promise.all(
            foodRows.map(async (f) => {
              const nutRows = await db
                .select()
                .from(foodNutrients)
                .where(eq(foodNutrients.foodId, f.id));
              const portRows = await db
                .select()
                .from(portionUnits)
                .where(eq(portionUnits.foodId, f.id));

              const nutrientsMap: Record<string, any> = {};
              for (const nr of nutRows) {
                nutrientsMap[nr.nutrientCode] = {
                  amount_per_100g: nr.amountPer100g,
                  unit: nr.unit,
                  is_missing: nr.isMissing,
                  is_trace: nr.isTrace,
                };
              }

              return {
                id: f.id,
                code: f.code,
                name: f.name,
                alt_names: f.altNames,
                food_group: f.foodGroup,
                category: f.category,
                scientific_name: f.scientificName,
                description: f.description,
                source_name: f.sourceName,
                source_citation: f.sourceCitation,
                source_year: f.sourceYear,
                standard_quantity: f.standardQuantity,
                standard_unit: f.standardUnit,
                preparation_state: f.preparationState,
                data_quality_grade: f.dataQualityGrade,
                is_custom: f.isCustom,
                nutrients: nutrientsMap,
                portions: portRows.map((p) => ({
                  id: p.id,
                  unit_name: p.unitName,
                  gram_weight: p.gramWeight,
                })),
              };
            })
          );

          return NextResponse.json({
            total: enrichedFoods.length,
            foods: enrichedFoods,
            food_groups: ["All Groups", ...allGroups.map((g) => g.foodGroup).filter(Boolean)],
            data_sources: ["All Sources", ...allSources.map((s) => s.sourceName).filter(Boolean)],
          });
        } catch (dbErr) {
          console.warn("DB foods query error, falling back to mock:", dbErr);
        }
      }
    }

    // Mock store filtering
    let filtered = [...mockStore.foods];

    if (query) {
      const qLower = query.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(qLower) ||
          f.alt_names.toLowerCase().includes(qLower) ||
          f.scientific_name.toLowerCase().includes(qLower) ||
          f.food_group.toLowerCase().includes(qLower)
      );
    }

    if (foodGroup !== "All Groups") {
      filtered = filtered.filter((f) => f.food_group === foodGroup);
    }

    if (dataSource !== "All Sources") {
      filtered = filtered.filter((f) => f.source_name === dataSource);
    }

    const paginated = filtered.slice(offset, offset + limit);

    const foodGroups = Array.from(new Set(mockStore.foods.map((f) => f.food_group)));
    const dataSources = Array.from(new Set(mockStore.foods.map((f) => f.source_name)));

    return NextResponse.json({
      total: filtered.length,
      foods: paginated,
      food_groups: ["All Groups", ...foodGroups],
      data_sources: ["All Sources", ...dataSources],
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list foods." }, { status: 500 });
  }
}
