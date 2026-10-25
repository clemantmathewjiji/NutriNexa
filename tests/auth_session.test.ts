import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getCurrentUser, createSessionToken, invalidateSessionToken } from "../lib/auth";
import { GET as getMeRoute } from "../app/api/auth/me/route";
import { POST as loginRoute } from "../app/api/auth/login/route";
import { POST as registerRoute } from "../app/api/auth/register/route";
import { POST as logoutRoute } from "../app/api/auth/logout/route";
import { GET as getDashboardStatsRoute } from "../app/api/dashboard/stats/route";
import { GET as getCalculationsRoute, POST as createCalculationRoute } from "../app/api/calculations/route";
import { GET as getCalculationByIdRoute, DELETE as deleteCalculationByIdRoute } from "../app/api/calculations/[id]/route";
import { GET as getRecipesRoute, POST as createRecipeRoute } from "../app/api/recipes/route";
import { POST as createProjectRoute } from "../app/api/projects/route";
import { POST as saveAnthropometricsRoute } from "../app/api/anthropometrics/route";
import { mockStore } from "../lib/mockStore";

function createNextRequest(url: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}) {
  const reqInit: RequestInit = {
    method: options.method || "GET",
    headers: options.headers || {},
  };
  if (options.body) {
    reqInit.body = JSON.stringify(options.body);
    (reqInit.headers as Record<string, string>)["content-type"] = "application/json";
  }
  return new NextRequest(new URL(url, "http://localhost:3000"), reqInit);
}

describe("NutriNexa Authentication, Guest Mode, and Session Security", () => {
  beforeEach(() => {
    // Reset or ensure mockStore has expected test users
    const existing = mockStore.users.find((u) => u.email === "test.user@nutrinexa.org");
    if (!existing) {
      mockStore.users.push({
        id: 999,
        name: "Test Researcher",
        email: "test.user@nutrinexa.org",
        role: "Research Scientist",
        institution: "NutriNexa Institute",
        password_hash: "mockhash",
        salt: "mocksalt",
        created_at: new Date().toISOString(),
      });
    }
  });

  // Scenario A: First-time visitor
  describe("Scenario A: First-time visitor in clean browser context", () => {
    it("initializes in guest mode with no authenticated session", async () => {
      const req = createNextRequest("http://localhost:3000/api/auth/me");
      const user = await getCurrentUser(req);
      expect(user).toBeNull();

      const res = await getMeRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.isGuest).toBe(true);
      expect(data.user).toBeNull();
    });

    it("never returns a hardcoded profile or default user record to a guest", async () => {
      const req = createNextRequest("http://localhost:3000/api/auth/me");
      const res = await getMeRoute(req);
      const data = await res.json();
      expect(data.user).toBeNull();
      expect(data.isGuest).toBe(true);
    });

    it("returns public database counts and zero user records on dashboard stats for guests", async () => {
      const req = createNextRequest("http://localhost:3000/api/dashboard/stats");
      const res = await getDashboardStatsRoute(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.is_guest).toBe(true);
      expect(data.summary.total_foods).toBeGreaterThan(0);
      expect(data.summary.user_calculations).toBe(0);
      expect(data.summary.user_recipes).toBe(0);
      expect(data.summary.active_projects).toBe(0);
      expect(data.recent_calculations).toEqual([]);
      expect(data.active_projects).toEqual([]);
    });
  });

  // Scenario B: Guest uses a protected feature
  describe("Scenario B: Guest attempts to access or mutate protected features", () => {
    it("rejects POST /api/calculations without authentication", async () => {
      const req = createNextRequest("http://localhost:3000/api/calculations", {
        method: "POST",
        body: {
          name: "Unauthorized Calculation",
          description: "Guest trying to save",
          items: [{ food_id: 1, quantity_grams: 100 }],
        },
      });
      const res = await createCalculationRoute(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.detail).toContain("Authentication required");
    });

    it("rejects POST /api/recipes without authentication", async () => {
      const req = createNextRequest("http://localhost:3000/api/recipes", {
        method: "POST",
        body: {
          name: "Guest Recipe",
          servings: 2,
          ingredients: [{ food_id: 1, quantity_grams: 100 }],
        },
      });
      const res = await createRecipeRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects POST /api/projects without authentication", async () => {
      const req = createNextRequest("http://localhost:3000/api/projects", {
        method: "POST",
        body: {
          title: "Guest Project",
          code: "PROJ-GUEST",
        },
      });
      const res = await createProjectRoute(req);
      expect(res.status).toBe(401);
    });

    it("rejects POST /api/anthropometrics without authentication", async () => {
      const req = createNextRequest("http://localhost:3000/api/anthropometrics", {
        method: "POST",
        body: {
          subject_identifier: "SUBJ-GUEST",
          height_cm: 175,
          weight_kg: 70,
        },
      });
      const res = await saveAnthropometricsRoute(req);
      expect(res.status).toBe(401);
    });

    it("returns safe empty lists for guests on protected list endpoints", async () => {
      const calcReq = createNextRequest("http://localhost:3000/api/calculations");
      const calcRes = await getCalculationsRoute(calcReq);
      expect(calcRes.status).toBe(200);
      const calcData = await calcRes.json();
      expect(calcData.calculations).toEqual([]);

      const recipeReq = createNextRequest("http://localhost:3000/api/recipes");
      const recipeRes = await getRecipesRoute(recipeReq);
      expect(recipeRes.status).toBe(200);
      const recipeData = await recipeRes.json();
      expect(recipeData.recipes).toEqual([]);
    });
  });

  // Scenario C: Login
  describe("Scenario C: Authentication login flow", () => {
    it("successfully logs in with valid credentials and issues a session token", async () => {
      const loginReq = createNextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: {
          email: "demo@nutrinexa.org",
          password: "NutriNexa2026!",
        },
      });
      const res = await loginRoute(loginReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe("demo@nutrinexa.org");

      // Verify the issued session token resolves the user
      const meReq = createNextRequest("http://localhost:3000/api/auth/me", {
        headers: { authorization: `Bearer ${data.token}` },
      });
      const meRes = await getMeRoute(meReq);
      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.user.email).toBe("demo@nutrinexa.org");
      expect(meData.isGuest).toBe(false);
    });

    it("rejects invalid login credentials", async () => {
      const loginReq = createNextRequest("http://localhost:3000/api/auth/login", {
        method: "POST",
        body: {
          email: "demo@nutrinexa.org",
          password: "WrongPassword!",
        },
      });
      const res = await loginRoute(loginReq);
      expect(res.status).toBe(401);
    });
  });

  // Scenario D: Signup / Registration
  describe("Scenario D: Signup and profile initialization", () => {
    it("creates a new user account with isolated profile and returns session token", async () => {
      const testEmail = `researcher_${Date.now()}@university.edu`;
      const regReq = createNextRequest("http://localhost:3000/api/auth/register", {
        method: "POST",
        body: {
          name: "Dr. Elena Rostova",
          email: testEmail,
          password: "SecureAcademicPassword2026!",
          role: "Co-Investigator",
          institution: "Institute of Nutritional Sciences",
        },
      });
      const res = await registerRoute(regReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user.name).toBe("Dr. Elena Rostova");
      expect(data.user.email).toBe(testEmail);

      // Verify profile retrieval
      const meReq = createNextRequest("http://localhost:3000/api/auth/me", {
        headers: { authorization: `Bearer ${data.token}` },
      });
      const meRes = await getMeRoute(meReq);
      const meData = await meRes.json();
      expect(meData.user.name).toBe("Dr. Elena Rostova");
    });
  });

  // Scenario E: Multi-tab session restoration
  describe("Scenario E: Same browser profile across multiple tabs", () => {
    it("restores the exact authenticated session in another tab using the valid token", async () => {
      const token = await createSessionToken(999);

      // Tab 1 request
      const tab1Req = createNextRequest("http://localhost:3000/api/auth/me", {
        headers: { authorization: `Bearer ${token}` },
      });
      const tab1Res = await getMeRoute(tab1Req);
      const tab1Data = await tab1Res.json();
      expect(tab1Data.user.id).toBe(999);

      // Tab 2 request (simulating second tab in same browser profile)
      const tab2Req = createNextRequest("http://localhost:3000/api/auth/me", {
        headers: { authorization: `Bearer ${token}` },
      });
      const tab2Res = await getMeRoute(tab2Req);
      const tab2Data = await tab2Res.json();
      expect(tab2Data.user.id).toBe(999);
      expect(tab2Data.user.email).toBe(tab1Data.user.email);
    });
  });

  // Scenario F: Isolated browser context / Incognito
  describe("Scenario F: Isolated or incognito browser context", () => {
    it("opens in guest mode and does not inherit active sessions from other contexts", async () => {
      // Create session in "normal" browser
      const token = await createSessionToken(1);

      // Isolated context sends request with no token
      const isolatedReq = createNextRequest("http://localhost:3000/api/auth/me");
      const isolatedRes = await getMeRoute(isolatedReq);
      expect(isolatedRes.status).toBe(401);
      const isolatedData = await isolatedRes.json();
      expect(isolatedData.isGuest).toBe(true);
      expect(isolatedData.user).toBeNull();
    });
  });

  // Scenario G: Logout
  describe("Scenario G: Session invalidation upon logout", () => {
    it("invalidates the session token so subsequent requests are rejected", async () => {
      const token = await createSessionToken(999);

      // Validate session works initially
      const authReq = createNextRequest("http://localhost:3000/api/auth/me", {
        headers: { authorization: `Bearer ${token}` },
      });
      const authRes = await getMeRoute(authReq);
      expect(authRes.status).toBe(200);

      // Execute logout
      const logoutReq = createNextRequest("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const logoutRes = await logoutRoute(logoutReq);
      expect(logoutRes.status).toBe(200);

      // Subsequent request with invalidated token must be rejected
      const postLogoutReq = createNextRequest("http://localhost:3000/api/auth/me", {
        headers: { authorization: `Bearer ${token}` },
      });
      const postLogoutRes = await getMeRoute(postLogoutReq);
      expect(postLogoutRes.status).toBe(401);
    });
  });

  // Scenario H & I: Data isolation between different accounts
  describe("Scenario H & I: User data isolation and client user ID forgery prevention", () => {
    it("prevents User B from accessing or deleting User A's private calculations", async () => {
      const userAToken = await createSessionToken(1); // User 1
      const userBToken = await createSessionToken(999); // User 999

      // User A creates a private calculation
      const createReq = createNextRequest("http://localhost:3000/api/calculations", {
        method: "POST",
        headers: { authorization: `Bearer ${userAToken}` },
        body: {
          name: "User A Confidential Formulation",
          description: "Private study formulation",
          items: [{ food_id: 1, quantity_grams: 120 }],
        },
      });
      const createRes = await createCalculationRoute(createReq);
      expect(createRes.status).toBe(200);
      const { calculation_id } = await createRes.json();

      // User B attempts to access User A's calculation -> 403 Forbidden
      const unauthorizedGetReq = createNextRequest(`http://localhost:3000/api/calculations/${calculation_id}`, {
        headers: { authorization: `Bearer ${userBToken}` },
      });
      const unauthorizedGetRes = await getCalculationByIdRoute(unauthorizedGetReq, {
        params: Promise.resolve({ id: String(calculation_id) }),
      });
      expect(unauthorizedGetRes.status).toBe(403);

      // User B attempts to delete User A's calculation -> 403 Forbidden
      const unauthorizedDelReq = createNextRequest(`http://localhost:3000/api/calculations/${calculation_id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${userBToken}` },
      });
      const unauthorizedDelRes = await deleteCalculationByIdRoute(unauthorizedDelReq, {
        params: Promise.resolve({ id: String(calculation_id) }),
      });
      expect(unauthorizedDelRes.status).toBe(403);
    });

    it("ignores forged client-supplied user IDs and binds strictly to authenticated session", async () => {
      const userBToken = await createSessionToken(999);

      // User B attempts to forge user_id: 1 in the payload
      const forgeReq = createNextRequest("http://localhost:3000/api/calculations", {
        method: "POST",
        headers: { authorization: `Bearer ${userBToken}` },
        body: {
          user_id: 1, // Forged client-side ID
          name: "User B Calculation with Forged ID",
          description: "Should be saved under User 999, not User 1",
          items: [{ food_id: 1, quantity_grams: 80 }],
        },
      });
      const forgeRes = await createCalculationRoute(forgeReq);
      expect(forgeRes.status).toBe(200);
      const { calculation_id } = await forgeRes.json();

      // Verify the record was saved under User 999 (User B can access it)
      const verifyReq = createNextRequest(`http://localhost:3000/api/calculations/${calculation_id}`, {
        headers: { authorization: `Bearer ${userBToken}` },
      });
      const verifyRes = await getCalculationByIdRoute(verifyReq, {
        params: Promise.resolve({ id: String(calculation_id) }),
      });
      expect(verifyRes.status).toBe(200);

      // Verify User 1 cannot access it (saved under User 999)
      const userAToken = await createSessionToken(1);
      const crossReq = createNextRequest(`http://localhost:3000/api/calculations/${calculation_id}`, {
        headers: { authorization: `Bearer ${userAToken}` },
      });
      const crossRes = await getCalculationByIdRoute(crossReq, {
        params: Promise.resolve({ id: String(calculation_id) }),
      });
      expect(crossRes.status).toBe(403);
    });
  });

  // Scenario J: Cache & Dynamic Route configuration
  describe("Scenario J: Dynamic route enforcement against cross-user cache leakage", () => {
    it("ensures auth/me and dashboard stats routes are marked force-dynamic", async () => {
      const meRouteModule = await import("../app/api/auth/me/route");
      expect(meRouteModule.dynamic).toBe("force-dynamic");

      const statsRouteModule = await import("../app/api/dashboard/stats/route");
      expect(statsRouteModule.dynamic).toBe("force-dynamic");
    });
  });
});
