# NutriNexa — Nutrition Research & Analytics

<p align="center">
  <img src="https://img.shields.io/badge/NutriNexa-Research%20Platform-174C3A?style=for-the-badge&logo=leaf&logoColor=84CC16" alt="NutriNexa Logo" />
</p>

<p align="center">
  <strong>Connecting Food Science with Better Insights.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5+-black?style=flat-square&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-v0.39-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM" />
  <img src="https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Localization-12_Languages-174C3A?style=flat-square" alt="Multilingual" />
  <img src="https://img.shields.io/badge/Hosting-Zero_Python_/_100%25_Vercel_Ready-success?style=flat-square" alt="Vercel Ready" />
</p>

---

## 🔬 1. Project Overview

**NutriNexa** is an academic-grade, browser-based nutrition calculation, food composition analysis, and dietary research platform. Built for dietitians, nutrition students, food scientists, and academic researchers, NutriNexa has been transformed into a **100% full-stack Next.js application** powered by **Drizzle ORM** and **Supabase PostgreSQL**, completely eliminating Python dependencies for instant one-click hosting on platforms like Vercel, Supabase, or Docker.

- **Nutrient Formulations:** Scaled compound nutrient modeling with mathematical transparency.
- **Batch Recipe Modeling:** Cooked yield factors, per-serving portions, and allergen labeling.
- **Dietary Recalls (24h/3-Day):** Benchmark patient and subject food intakes against **US DRI** and **ICMR-NIN 2020** Dietary Reference Values.
- **Anthropometric Indices:** Real-time BMI (WHO TRS 854 & Asian-Pacific standards) and Waist-to-Height Ratio (WHtR) cardiometabolic evaluation.
- **Research Workspace:** Cohort dataset management and real descriptive statistical calculations (Mean, Median, SD, Min, Max, Sample Size N).
- **Publication Reports:** Institutional letterhead reports with print-to-PDF formatting and CSV exports.
- **Multilingual Support:** Complete localization across 12 languages with native RTL support for Arabic.

---

## 🚀 2. Quick Setup & Supabase Configuration

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/clemantmathewjiji/NutriNexa-NUTRITION-RESEARCH-ANALYTICS.git
cd NutriNexa-NUTRITION-RESEARCH-ANALYTICS
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local` and paste your Supabase connection string and project credentials:

```bash
cp .env.example .env.local
```

Inside `.env.local`:
```env
# 1. Supabase PostgreSQL Connection String (Transaction Pooler: port 6543 or Session: port 5432)
# Found in: Supabase Dashboard -> Project Settings -> Database -> Connection String -> URI
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres"

# 2. Supabase API Credentials (Optional)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"

# 3. Security Signing Secret
JWT_SECRET="nutrinexa-scientific-research-secure-key-2026-v2"
```

> **Note:** NutriNexa includes an automatic in-memory research store fallback, meaning the platform functions seamlessly even before pasting credentials. As soon as you add your `DATABASE_URL`, Drizzle ORM immediately establishes an active cloud connection!

### Step 3: Run Database Migration & Master Seed
You can migrate and seed your Supabase database in either of two ways:

**Option A (One-Click from Browser):**
Click the **"Seed Supabase DB"** button in the top status bar of the application, or send a POST request to `/api/seed`.

**Option B (CLI with Drizzle Kit):**
```bash
npm run db:push
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ 3. Drizzle ORM Schema & Supabase Architecture

NutriNexa uses **Drizzle ORM** with a fully normalized 18-table relational PostgreSQL schema defined in [`drizzle/schema.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/drizzle/schema.ts):

| Table | Purpose |
| :--- | :--- |
| `users` | Academic credentials, hashed passwords (PBKDF2-HMAC-SHA256), and institutional roles |
| `auth_tokens` | Secure user session management |
| `projects` | Scientific research projects, cohort objectives, and methodological notes |
| `nutrients` | 30 standard nutrients with measurement units and energy factors (kcal/g) |
| `foods` | Reference food composition items (USDA SR Legacy + custom researcher foods) |
| `food_nutrients` | Nutrient values per 100g edible portion (with trace & missing flags) |
| `portion_units` | Standard household portion measures (cups, slices, grams, fillets) |
| `dietary_reference_profiles` | Reference standards (US DRI / IOM and ICMR-NIN 2020) |
| `dietary_reference_values` | Target nutrient values, RDA, AI, EAR, and Tolerable Upper Intake Levels (UL) |
| `calculations` | User saved nutrient formulations and composite recipes |
| `calculation_items` | Contributed foods and exact gram weights per calculation |
| `recipes` | Batch recipes with yield factors and cooking instructions |
| `recipe_ingredients` | Recipe ingredients with preparation notes and portions |
| `food_diaries` | Patient/subject dietary recalls (24-hour recalls & food logs) |
| `diary_entries` | Meal-segmented food and recipe consumption logs |
| `meal_plans` | Structured meal plans with target caloric boundaries |
| `meal_plan_items` | Scheduled items by day-of-week and meal type |
| `anthropometrics` | BMI, WHO classifications, Asian-Pacific classifications, and WHtR cardiometabolic indicators |
| `project_datasets` | Cohort survey records and descriptive statistics JSON matrices |
| `reports` | Formal publication summaries and audit reports |
| `auditLogs` | Immutable research audit trail tracking every scientific operation |

---

## 🌐 4. 12-Language Multilingual Localization

NutriNexa provides full internationalization across **12 languages** with instant switching and persistent user preferences:

1. **English** (`en`)
2. **മലയാളം / Malayalam** (`ml`)
3. **Bahasa Indonesia** (`id`)
4. **Русский / Russian** (`ru`)
5. **العربية / Arabic** (`ar`) — *Full Right-to-Left (RTL) Layout*
6. **हिन्दी / Hindi** (`hi`)
7. **தமிழ் / Tamil** (`ta`)
8. **ಕನ್ನಡ / Kannada** (`kn`)
9. **తెలుగు / Telugu** (`te`)
10. **বাংলা / Bengali** (`bn`)
11. **Français / French** (`fr`)
12. **Español / Spanish** (`es`)

### Multilingual Food Search
Researchers can query foods using vernacular and native terms across all 12 languages (e.g., searching `ഓട്സ്`, `الشوفان`, `Овсянка`, `दूध`, `Susu`, `Apple`).

---

## ☁️ 5. Deployment & Hosting (Vercel / Cloud)

Because NutriNexa has **zero Python dependencies**, deployment to Vercel is seamless:

1. Push your repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com).
3. Set the Environment Variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string.
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `JWT_SECRET`: Random secure string.
4. Deploy! Vercel will automatically build and host the Next.js full-stack platform.

---

## 🧪 6. Testing & Build Verification

```bash
# Verify TypeScript types and production build
npm run build

# Push database schema to Supabase
npm run db:push

# Open Drizzle Studio to inspect live Supabase database tables
npm run db:studio
```

---

## ⚖️ 7. Scientific Standards & Citations

- **Food Composition Data:** USDA Agricultural Research Service, FoodData Central Standard Reference (SR) Legacy (2019).
- **Dietary Reference Values:** Institute of Medicine (US) Dietary Reference Intakes (DRI) & ICMR - National Institute of Nutrition (NIN) Nutrient Requirements for Indians (2020).
- **Body Mass Index & WHtR:** WHO Technical Report Series 854 (1995) & WHO Expert Consultation on Asian Populations (Lancet 2004).
- **Atwater General Factors:** 4.0 kcal/g (Protein), 4.0 kcal/g (Available Carbohydrates), 9.0 kcal/g (Lipids), 2.0 kcal/g (Dietary Fiber).

---

## 👨‍🔬 Authors & Maintainers

- **Principal Investigator:** Dr. Clemant Mathew Jiji
- **Affiliation:** SJCET Palai Nutrition Science & Computational Lab
- **Repository:** [https://github.com/clemantmathewjiji/NutriNexa-NUTRITION-RESEARCH-ANALYTICS](https://github.com/clemantmathewjiji/NutriNexa-NUTRITION-RESEARCH-ANALYTICS)
