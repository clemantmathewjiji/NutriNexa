import { NextRequest, NextResponse } from "next/server";
import { getDb, isDbConnected } from "@/lib/db";
import { foods, calculations, recipes, projects, foodDiaries, anthropometrics, auditLogs } from "@/drizzle/schema";
import { count, eq, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { mockStore } from "@/lib/mockStore";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const userId = user?.id || 1;

    if (isDbConnected()) {
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
            .orderBy(desc(auditLogs.timestamp))
            .limit(8);

          return NextResponse.json({
            summary: {
              total_foods: foodsCount?.val || 0,
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
          });
        } catch (dbErr) {
          console.warn("DB query error in dashboard stats, falling back to mock:", dbErr);
        }
      }
    }

    // Mock store response
    return NextResponse.json({
      summary: {
        total_foods: mockStore.foods.length,
        user_calculations: mockStore.calculations.length,
        user_recipes: mockStore.recipes.length,
        active_projects: mockStore.projects.length,
        dietary_assessments: mockStore.diaries.length,
        anthropometric_records: mockStore.anthropometrics.length,
      },
      recent_calculations: mockStore.calculations.slice(0, 5),
      recent_recipes: mockStore.recipes.slice(0, 5),
      active_projects: mockStore.projects.slice(0, 5),
      recent_activity: mockStore.auditLogs.slice(0, 8),
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to load dashboard stats." }, { status: 500 });
  }
}
