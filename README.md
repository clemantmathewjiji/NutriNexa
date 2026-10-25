# NutriNexa — Advanced Nutrition Research & Analytics Platform
## Production Architecture & Operational Manual

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
  <img src="https://img.shields.io/badge/Zero_Python-100%25_Node.js_/_Vercel_Ready-success?style=flat-square" alt="Zero Python" />
</p>

---

## 🔬 1. Project Overview & Architectural Foundation

**NutriNexa** is an academic-grade, browser-based nutrition calculation, food composition analysis, dietary recall modeling, and clinical research platform.

### Architecture Highlights
- **100% Full-Stack Next.js 15 App Router & Node.js Runtime**: Completely eliminated Python backend dependencies (no Flask, Django, FastAPI, or Python scripts). Instant one-click deployment to Vercel, Supabase, or containerized Docker.
- **Supabase PostgreSQL & Drizzle ORM**: Relational schema across 21 modular entities with foreign keys, indexes, timestamps, and Drizzle Kit migration management.
- **Supabase Auth & SSR**: Institutional login, registration with password strength indicators, Google OAuth 2.0 integration, password reset recovery flow, and server-side session checks.
- **Investigator Identity & Document Snapshots**: Every authenticated user displays their own dynamic identity in the dashboard and research reports. Reports snapshot investigator data at time of issue to ensure historical immutability.
- **Indonesian Reference Integration**:
  - **Buku Foto Makanan (2014)**: Photographic food-portion estimation reference with household utensils (centong, potong, piring, mangkok), portion sizes (Kecil/Sedang/Besar), and net edible weight calculations factoring in refuse.
  - **Tabel Komposisi Pangan Indonesia (TKPI 2017)**: Searchable repository of authentic Indonesian food compositions with official Indonesian codes (AR, BD, CD, DD, ED, FD, GD, HD), Indonesian vernacular terminology, and analytical nutrient values per 100g edible portion (% BDD).
- **Scientific Calculation Engine**: Transparent calculation math, Atwater general energy factors (4/4/9/2 kcal/g), recipe yield factor adjustments, missing/trace value tracking, WHO TRS 854 & Asian-Pacific BMI standards, WHtR cardiometabolic evaluation, and sample descriptive statistics ($N$, Mean, SD with $n-1$, Median, IQR, Min, Max).
- **12-Language Multilingual Localization**: Full support for English, Indonesian (Bahasa Indonesia), Malayalam, Russian, Arabic (native RTL layout), Hindi, Tamil, Kannada, Telugu, Bengali, French, and Spanish.

---

## 🗄️ 2. Database Architecture & Schema Entities

Database schemas are organized modularly in [`src/db/schema/`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/):

| Schema Entity File | Table Name | Purpose & Scientific Context |
| :--- | :--- | :--- |
| [`profiles.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/profiles.ts) | `profiles` | Authenticated user profile linked to Supabase Auth UID |
| [`food_sources.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/food_sources.ts) | `food_sources` | Reference authorities (TKPI 2017, Buku Foto Makanan 2014, USDA) |
| [`foods.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/foods.ts) | `foods` | Reference foods, Indonesian codes, BDD % edible portion, refuse |
| [`food_names.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/food_names.ts) | `food_names` | Vernacular names, scientific names, multilingual synonyms |
| [`food_nutrients.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/food_nutrients.ts) | `food_nutrients` | Analytical nutrient values per 100g, missing/trace flags, value types |
| [`food_portions.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/food_portions.ts) | `food_portions` | Buku Foto Makanan portion sizes (K/S/B), household utensils |
| [`recipes.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/recipes.ts) | `recipes` | Standardized batch recipes, yield factors, cooking methods |
| [`recipe_ingredients.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/recipe_ingredients.ts) | `recipe_ingredients` | Recipe ingredients, preparation notes, retention keys |
| [`nutrient_calculations.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/nutrient_calculations.ts) | `nutrient_calculations` | Composite formulations and scaled nutrient totals |
| [`calculation_items.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/calculation_items.ts) | `calculation_items` | Contributed foods and exact gram weights |
| [`dietary_assessments.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/dietary_assessments.ts) | `dietary_assessments` | 24-hour recalls and food diary sessions |
| [`dietary_recall_entries.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/dietary_recall_entries.ts) | `dietary_recall_entries` | Meal-segmented food intake logs with household measures |
| [`anthropometric_records.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/anthropometric_records.ts) | `anthropometric_records` | BMI, WHO TRS 854 & Asian-Pacific standards, WHtR indicators |
| [`research_projects.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/research_projects.ts) | `research_projects` | Cohort protocols, objectives, and methodologies |
| [`research_project_members.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/research_project_members.ts) | `research_project_members` | Collaboration roles (lead, collaborator, viewer) |
| [`research_reports.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/research_reports.ts) | `research_reports` | Generated research reports |
| [`report_snapshots.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/report_snapshots.ts) | `report_snapshots` | Immutable historical investigator identity and calculation snapshots |
| [`reference_documents.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/reference_documents.ts) | `reference_documents` | PDF reference books (TKPI 2017 & Buku Foto Makanan 2014) |
| [`document_food_entries.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/document_food_entries.ts) | `document_food_entries` | PDF extraction tracking and verification status |
| [`user_preferences.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/user_preferences.ts) | `user_preferences` | User language, unit system (metric/imperial), default DRV |
| [`audit_logs.ts`](file:///c:/Users/amalk/Desktop/NUTRITION/NutriNexa-NUTRITION-RESEARCH-ANALYTICS/src/db/schema/audit_logs.ts) | `audit_logs` | Immutable audit trail tracking scientific operations |

---

## 🚀 3. Quick Start & Local Setup Instructions

### Prerequisites
- Node.js version 18.17+ or 20+
- npm or pnpm

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/clemantmathewjiji/NutriNexa-NUTRITION-RESEARCH-ANALYTICS.git
cd NutriNexa-NUTRITION-RESEARCH-ANALYTICS
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Inside `.env.local`, provide your Supabase PostgreSQL connection string and API keys:
```env
# 1. Supabase PostgreSQL Connection String (Transaction Pooler port 6543 recommended)
DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres"

# 2. Supabase API Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# 3. Google OAuth Provider (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 4. Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Step 3: Apply Drizzle Migrations to Supabase
```bash
# Push schema directly to Supabase PostgreSQL
npm run db:push

# Or inspect your database visually via Drizzle Studio
npm run db:studio
```

### Step 4: Safely Seed Reference Data (TKPI 2017 & Buku Foto Makanan 2014)
Run the dedicated administrative reference data import script. This script inserts official food composition tables and portion photos without altering or overwriting existing user data:
```bash
npm run db:seed
```

### Step 5: Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 4. Testing & Verification

Run the automated scientific calculation test suite powered by Vitest:
```bash
npm run test
```

Build the optimized Next.js production bundle:
```bash
npm run build
```

---

## 🔑 5. Google OAuth Setup via Supabase Auth

To enable Google sign-in:

1. **Google Cloud Console**:
   - Navigate to [Google Cloud Console](https://console.cloud.google.com/) -> **APIs & Services** -> **Credentials**.
   - Create an **OAuth 2.0 Client ID** (Web Application).
   - Under **Authorized redirect URIs**, paste your Supabase OAuth callback URL:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - Copy the generated **Client ID** and **Client Secret**.

2. **Supabase Dashboard**:
   - Go to your Supabase Project -> **Authentication** -> **Providers** -> **Google**.
   - Toggle **Enable Google provider**.
   - Paste the **Client ID** and **Client Secret**.
   - Save changes.

3. **Redirect URL Configuration**:
   - In Supabase Dashboard -> **Authentication** -> **URL Configuration**:
     - Site URL: `http://localhost:3000` (development) or `https://your-domain.vercel.app` (production).
     - Redirect URLs: `http://localhost:3000/auth/callback` and `https://your-domain.vercel.app/auth/callback`.

---

## ☁️ 6. Deployment to Vercel

Because NutriNexa has **zero Python dependencies**, deployment is completely turnkey:

1. Push your repository to GitHub.
2. In your [Vercel Dashboard](https://vercel.com), click **Add New Project** and select this repository.
3. In **Environment Variables**, add:
   - `DATABASE_URL`: Your Supabase connection string.
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role secret.
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://nutrinexa.vercel.app`).
4. Click **Deploy**. Vercel will build and serve the application globally with edge caching and serverless route handlers.

---

## 📋 7. Migration Notes from Previous Version

| Previous State | New Architecture | Status |
| :--- | :--- | :--- |
| Seed Supabase DB button in header | Removed completely. Replaced with safe CLI script (`npm run db:seed`) | ✅ Complete |
| Hardcoded investigator name | Replaced with dynamic profile identity & immutable report snapshots | ✅ Complete |
| Monolithic schema in `drizzle/schema.ts` | 21 modular schemas in `src/db/schema/` with UUIDs & indexes | ✅ Complete |
| Mock user authentication | Supabase Auth (Email + Password + Google OAuth + Password Recovery) | ✅ Complete |
| Indonesian references missing | Buku Foto Makanan 2014 & TKPI 2017 fully integrated | ✅ Complete |
| No automated test runner | Vitest test suite (`npm run test`) with 10 passing unit tests | ✅ Complete |
| Zod & React Hook Form | Full integration for server and form validation | ✅ Complete |
| CSV & Print Reports | Scientific letterhead reports with CSV spreadsheet export | ✅ Complete |

---

## 👨‍🔬 Authors & Maintainers

- **Repository:** [https://github.com/clemantmathewjiji/NutriNexa-NUTRITION-RESEARCH-ANALYTICS](https://github.com/clemantmathewjiji/NutriNexa-NUTRITION-RESEARCH-ANALYTICS)
- **License:** MIT Academic Research License
