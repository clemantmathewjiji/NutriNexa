import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { dietaryReferenceProfiles, dietaryReferenceValues } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { DRV_PROFILES } from "@/lib/seedData";

export async function GET(_request: NextRequest) {
  try {
    if (isDbConnected()) {
      const db = getDb();
      if (db) {
        try {
          const profiles = await db.select().from(dietaryReferenceProfiles);
          const enriched = await Promise.all(
            profiles.map(async (p) => {
              const vals = await db
                .select()
                .from(dietaryReferenceValues)
                .where(eq(dietaryReferenceValues.profileId, p.id));
              return {
                id: p.id,
                authority: p.authority,
                profile_name: p.profileName,
                target_group: p.targetGroup,
                energy_kcal_target: p.energyKcalTarget,
                is_default: p.isDefault,
                values: vals.map((v) => ({
                  nutrient_code: v.nutrientCode,
                  target_value: v.targetValue,
                  unit: v.unit,
                  target_type: v.targetType,
                  upper_limit: v.upperLimit,
                })),
              };
            })
          );
          if (enriched.length > 0) {
            return NextResponse.json({ profiles: enriched });
          }
        } catch (dbErr) {
          console.warn("DB DRV profiles error, falling back to static:", dbErr);
        }
      }
    }

    const fallbackProfiles = DRV_PROFILES.map((p, idx) => ({
      id: idx + 1,
      authority: p.authority,
      profile_name: p.profile_name,
      target_group: p.target_group,
      energy_kcal_target: p.energy_kcal_target,
      is_default: p.is_default,
      values: p.values.map((v) => ({
        nutrient_code: v.code,
        target_value: v.target,
        unit: v.unit,
        target_type: v.type,
        upper_limit: v.ul,
      })),
    }));

    return NextResponse.json({ profiles: fallbackProfiles });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list DRV profiles." }, { status: 500 });
  }
}
