CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"display_name" text,
	"designation" text,
	"institution" text,
	"department" text,
	"email" text NOT NULL,
	"preferred_language" text DEFAULT 'en' NOT NULL,
	"avatar_url" text,
	"role" text DEFAULT 'Researcher' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"short_title" text NOT NULL,
	"citation" text NOT NULL,
	"publication_year" integer,
	"country" text DEFAULT 'ID',
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "food_sources_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer,
	"food_code" text NOT NULL,
	"primary_name" text NOT NULL,
	"scientific_name" text,
	"food_group" text NOT NULL,
	"preparation_state" text DEFAULT 'Raw / Unprepared' NOT NULL,
	"edible_portion_factor" double precision DEFAULT 1 NOT NULL,
	"edible_percentage" double precision DEFAULT 100 NOT NULL,
	"refuse_description" text,
	"source_page" text,
	"data_quality_grade" text DEFAULT 'Validated',
	"is_custom" boolean DEFAULT false NOT NULL,
	"user_id" uuid,
	"is_verified" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "foods_food_code_unique" UNIQUE("food_code")
);
--> statement-breakpoint
CREATE TABLE "food_names" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"name" text NOT NULL,
	"language_code" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"name_type" text DEFAULT 'vernacular' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_nutrients" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"nutrient_code" text NOT NULL,
	"amount_per_100g" double precision,
	"unit" text NOT NULL,
	"is_missing" boolean DEFAULT false NOT NULL,
	"is_trace" boolean DEFAULT false NOT NULL,
	"value_type" text DEFAULT 'analytical' NOT NULL,
	"method_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_portions" (
	"id" serial PRIMARY KEY NOT NULL,
	"food_id" integer NOT NULL,
	"portion_name" text NOT NULL,
	"portion_size_category" text DEFAULT 'Sedang',
	"gram_weight" double precision NOT NULL,
	"household_measure" text,
	"source_document" text DEFAULT 'Buku Foto Makanan 2014',
	"source_page" text,
	"photo_reference" text,
	"edible_weight_grams" double precision,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" integer,
	"name" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'Entrée' NOT NULL,
	"servings" double precision DEFAULT 1 NOT NULL,
	"raw_weight_grams" double precision DEFAULT 0 NOT NULL,
	"cooked_weight_grams" double precision,
	"yield_factor" double precision DEFAULT 1 NOT NULL,
	"cooking_method" text,
	"cooking_instructions" text,
	"allergens" text DEFAULT 'None' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"food_id" integer NOT NULL,
	"quantity_grams" double precision NOT NULL,
	"portion_unit_name" text DEFAULT 'grams' NOT NULL,
	"preparation_note" text,
	"retention_factor_key" text,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nutrient_calculations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" integer,
	"name" text NOT NULL,
	"description" text,
	"total_weight_grams" double precision DEFAULT 0 NOT NULL,
	"notes" text,
	"calculated_totals_json" text DEFAULT '{}' NOT NULL,
	"macro_distribution_json" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "calculation_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"calculation_id" integer NOT NULL,
	"food_id" integer NOT NULL,
	"quantity_grams" double precision NOT NULL,
	"portion_unit_name" text DEFAULT 'grams' NOT NULL,
	"serving_multiplier" double precision DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dietary_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" integer,
	"subject_identifier" text NOT NULL,
	"assessment_date" text NOT NULL,
	"assessment_type" text DEFAULT '24-Hour Recall' NOT NULL,
	"reference_profile_code" text DEFAULT 'US_DRI_ADULT_MALE' NOT NULL,
	"total_energy_kcal" double precision,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dietary_recall_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"meal_type" text NOT NULL,
	"item_type" text DEFAULT 'food' NOT NULL,
	"food_id" integer,
	"recipe_id" integer,
	"quantity_grams" double precision NOT NULL,
	"household_measure" text,
	"photo_reference" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "anthropometric_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" integer,
	"subject_identifier" text NOT NULL,
	"assessment_date" text NOT NULL,
	"age_years" integer NOT NULL,
	"sex" text NOT NULL,
	"height_cm" double precision NOT NULL,
	"weight_kg" double precision NOT NULL,
	"waist_cm" double precision,
	"hip_cm" double precision,
	"bmi" double precision NOT NULL,
	"who_category" text NOT NULL,
	"asian_category" text NOT NULL,
	"waist_to_height_ratio" double precision,
	"waist_to_height_status" text,
	"waist_hip_ratio" double precision,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"objectives" text,
	"methodology_notes" text,
	"status" text DEFAULT 'Active' NOT NULL,
	"tags" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_projects_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "research_project_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'collaborator' NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" integer,
	"report_identifier" text NOT NULL,
	"report_type" text NOT NULL,
	"title" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "research_reports_report_identifier_unique" UNIQUE("report_identifier")
);
--> statement-breakpoint
CREATE TABLE "report_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_id" integer NOT NULL,
	"investigator_name" text NOT NULL,
	"investigator_designation" text,
	"investigator_institution" text,
	"investigator_department" text,
	"issued_date" text NOT NULL,
	"parameters_json" text DEFAULT '{}' NOT NULL,
	"results_json" text DEFAULT '{}' NOT NULL,
	"citation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_code" text NOT NULL,
	"title" text NOT NULL,
	"authors" text,
	"publisher" text,
	"publication_year" integer,
	"page_count" integer,
	"extraction_status" text DEFAULT 'verified' NOT NULL,
	"file_path" text,
	"summary" text,
	"verified_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reference_documents_document_code_unique" UNIQUE("document_code")
);
--> statement-breakpoint
CREATE TABLE "document_food_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"food_id" integer,
	"raw_page_number" integer,
	"raw_table_identifier" text,
	"raw_row_data_json" text,
	"validation_status" text DEFAULT 'validated' NOT NULL,
	"validation_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"default_language" text DEFAULT 'en' NOT NULL,
	"default_unit_system" text DEFAULT 'metric' NOT NULL,
	"default_reference_profile" text DEFAULT 'US_DRI_ADULT_MALE' NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_source_id_food_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."food_sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_names" ADD CONSTRAINT "food_names_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_portions" ADD CONSTRAINT "food_portions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nutrient_calculations" ADD CONSTRAINT "nutrient_calculations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_items" ADD CONSTRAINT "calculation_items_calculation_id_nutrient_calculations_id_fk" FOREIGN KEY ("calculation_id") REFERENCES "public"."nutrient_calculations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calculation_items" ADD CONSTRAINT "calculation_items_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_assessments" ADD CONSTRAINT "dietary_assessments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_recall_entries" ADD CONSTRAINT "dietary_recall_entries_assessment_id_dietary_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."dietary_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_recall_entries" ADD CONSTRAINT "dietary_recall_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dietary_recall_entries" ADD CONSTRAINT "dietary_recall_entries_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anthropometric_records" ADD CONSTRAINT "anthropometric_records_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_projects" ADD CONSTRAINT "research_projects_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_project_members" ADD CONSTRAINT "research_project_members_project_id_research_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."research_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_project_members" ADD CONSTRAINT "research_project_members_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "research_reports" ADD CONSTRAINT "research_reports_project_id_research_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."research_projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_report_id_research_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."research_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_documents" ADD CONSTRAINT "reference_documents_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_food_entries" ADD CONSTRAINT "document_food_entries_document_id_reference_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."reference_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_food_entries" ADD CONSTRAINT "document_food_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;