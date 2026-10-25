import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, calculations, recipes, projects, foodDiaries, anthropometrics, auditLogs } from "@/drizzle/schema";
import { count, eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const isGuest = !user;

    // 1. Guest Response: Public database metrics only, 0 private records
    if (isGuest) {
      let publicFoodCount = mockStore.foods.length;
      if (isDbConnected()) {
        try {
          const db = getDb();
          if (db) {
            const [fCount] = await db.select({ val: count() }).from(foods);
            if (fCount?.val) publicFoodCount = fCount.val;
          }
        } catch {
          // fallback to mock food count
        }
      }

      return NextResponse.json({
        summary: {
          total_foods: publicFoodCount,
          user_calculations: 0,
          user_recipes: 0,
          active_projects: 0,
          dietary_assessments: 0,
          anthropometric_records: 0,
        },
        recent_calculations: [],
        recent_recipes: [],
        active_projects: [],
        recent_activity: [
          {
            action: "SYSTEM_ONLINE",
            entity_type: "system",
            details: "NutriNexa Research Engine online with USDA SR Legacy & TKPI 2017 datasets.",
            timestamp: new Date().toISOString(),
          },
          {
            action: "GUEST_EXPLORATION",
            entity_type: "guest",
            details: "Public food composition and nutrient calculation tools available.",
            timestamp: new Date().toISOString(),
          },
        ],
        is_guest: true,
      });
    }

    // 2. Authenticated Response: Strictly filtered by user.id
    const userId = user.id;

    if (isDbConnected() && typeof userId === "number") {
      const db = getDb();
      if (db) {
        try {
          const [foodsCount] = await db.select({ val: count() }).from(foods);
          const [calcsCount] = await db.select({ val: count() }).from(calculations).where(eq(calculations.userId, userId));
          const [recipesCount] = await db.select({ val: count() }).from(recipes).where(eq(recipes.userId, userId));
          const [projsCount] = await db.select({ val: count() }).from(projects).where(eq(projects.userId, userId));
          const [diariesCount] = await db.select({ val: count() }).from(foodDiaries).where(eq(foodDiaries.userId, userId));
          const [anthroCount] = await db.select({ val: count() }).from(anthropometrics).where(eq(anthropometrics.userId, userId));

          const recentCalcs = await db
            .select()
            .from(calculations)
            .where(eq(calculations.userId, userId))
            .orderBy(desc(calculations.createdAt))
            .limit(5);

          const recentRecipes = await db
            .select()
            .from(recipes)
            .where(eq(recipes.userId, userId))
            .orderBy(desc(recipes.createdAt))
            .limit(5);

          const activeProjs = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, userId))
            .orderBy(desc(projects.createdAt))
            .limit(5);

          const recentActivity = await db
            .select()
            .from(auditLogs)
            .where(eq(auditLogs.userId, userId))
            .orderBy(desc(auditLogs.timestamp))
            .limit(8);

          return NextResponse.json({
            summary: {
              total_foods: foodsCount?.val || mockStore.foods.length,
              user_calculations: calcsCount?.val || 0,
              user_recipes: recipesCount?.val || 0,
              active_projects: projsCount?.val || 0,
              dietary_assessments: diariesCount?.val || 0,
              anthropometric_records: anthroCount?.val || 0,
            },
            recent_calculations: recentCalcs,
            recent_recipes: recentRecipes,
            active_projects: activeProjs,
            recent_activity: recentActivity,
            is_guest: false,
          });
        } catch (dbErr) {
          console.warn("DB query error in dashboard stats, falling back to mock:", dbErr);
        }
      }
    }

    // Authenticated Mock Store Fallback: strictly filtered by user.id
    const userCalcs = mockStore.calculations.filter((c) => c.user_id === userId);
    const userRecipes = mockStore.recipes.filter((r) => r.user_id === userId);
    const userProjects = mockStore.projects.filter((p) => p.user_id === userId);
    const userDiaries = mockStore.diaries.filter((d) => d.user_id === userId);
    const userAnthros = mockStore.anthropometrics.filter((a) => a.user_id === userId);
    const userLogs = mockStore.auditLogs.filter((l) => l.user_id === userId);

    return NextResponse.json({
      summary: {
        total_foods: mockStore.foods.length,
        user_calculations: userCalcs.length,
        user_recipes: userRecipes.length,
        active_projects: userProjects.length,
        dietary_assessments: userDiaries.length,
        anthropometric_records: userAnthros.length,
      },
      recent_calculations: userCalcs.slice(0, 5),
      recent_recipes: userRecipes.slice(0, 5),
      active_projects: userProjects.slice(0, 5),
      recent_activity: userLogs.slice(0, 8),
      is_guest: false,
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load dashboard stats." }, { status: 500 });
  }
}
