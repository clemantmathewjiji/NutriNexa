export type LanguageCode =
  | "en"
  | "ml"
  | "id"
  | "ru"
  | "ar"
  | "hi"
  | "ta"
  | "kn"
  | "te"
  | "bn"
  | "fr"
  | "es";

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  locale: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr", locale: "en-US" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", dir: "ltr", locale: "ml-IN" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", locale: "id-ID" },
  { code: "ru", name: "Russian", nativeName: "Русский", dir: "ltr", locale: "ru-RU" },
  { code: "ar", name: "Arabic", nativeName: "العربية", dir: "rtl", locale: "ar-SA" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", dir: "ltr", locale: "hi-IN" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", dir: "ltr", locale: "ta-IN" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", locale: "kn-IN" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", dir: "ltr", locale: "te-IN" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", dir: "ltr", locale: "bn-BD" },
  { code: "fr", name: "French", nativeName: "Français", dir: "ltr", locale: "fr-FR" },
  { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", locale: "es-ES" },
];

export interface TranslationDictionary {
  // Brand & Common
  brandName: string;
  brandTagline: string;
  researchAndAnalytics: string;
  academicModules: string;
  scientificCore: string;
  newAnalysis: string;
  signIn: string;
  signOut: string;
  searchPlaceholder: string;
  close: string;
  save: string;
  cancel: string;
  delete: string;
  export: string;
  print: string;
  edit: string;
  compare: string;
  actions: string;
  notes: string;
  description: string;
  name: string;
  status: string;
  date: string;
  all: string;
  grams: string;
  total: string;
  done: string;
  loading: string;

  // Nav Items
  navDashboard: string;
  navFoods: string;
  navPortions?: string;
  navCalculator: string;
  navRecipes: string;
  navDietary: string;
  navMealPlanner: string;
  navAnthropometrics: string;
  navProjects: string;
  navReports: string;
  navMyFoods: string;
  navSettings: string;
  navHelp: string;

  // Dashboard
  dashWelcomeTitle: string;
  dashWelcomeSubtitle: string;
  dashOpenCalc: string;
  dashExploreFoods: string;
  dashResearchProj: string;
  statTotalFoods: string;
  statCalculations: string;
  statRecipes: string;
  statFoodRecalls: string;
  statPhysicalData: string;
  statProjects: string;
  dashRecentCalcs: string;
  dashRecentCalcsDesc: string;
  dashActiveProjects: string;
  dashActiveProjectsDesc: string;
  dashQuickActions: string;
  dashAuditTrail: string;
  dashProvenanceLog: string;
  dashAcademicNoticeTitle: string;
  dashAcademicNoticeText: string;

  // Foods DB
  foodsTitle: string;
  foodsSubtitle: string;
  compareSelected: string;
  exportCsv: string;
  addCustomFood: string;
  allGroups: string;
  allSources: string;
  foodName: string;
  foodGroup: string;
  category: string;
  dataSource: string;
  viewProfile: string;
  foodDetailTitle: string;
  standardPortion: string;
  nutrientsPer100g: string;
  householdPortions: string;
  comparisonMatrixTitle: string;
  comparisonMatrixSubtitle: string;

  // Nutrient Calculator
  calcTitle: string;
  calcSubtitle: string;
  savedCalculations: string;
  saveCalculation: string;
  calcSavedSuccess: string;
  batchName: string;
  researchProtocolNotes: string;
  contributingFoods: string;
  edibleWeight: string;
  addAnotherFood: string;
  totalEdibleMass: string;
  totalEnergy: string;
  totalProtein: string;
  totalDietaryFiber: string;
  atwaterTitle: string;
  completeNutrientProfile: string;
  mixtureValuesSubtitle: string;
  compositeTotal: string;
  per100gMixture: string;
  dataQualityNotes: string;

  // Recipe Analysis
  recipeTitle: string;
  recipeSubtitle: string;
  newRecipe: string;
  standardizedRecipes: string;
  recipeFormTitle: string;
  recipeName: string;
  servingsCount: string;
  cookedYieldWeight: string;
  allergensLabel: string;
  ingredientsLabel: string;
  addIngredient: string;
  analyzeSaveRecipe: string;
  perServing: string;
  per100gCooked: string;
  preparationProtocol: string;

  // Dietary Assessment
  dietaryTitle: string;
  dietarySubtitle: string;
  newAssessment: string;
  dietaryRecords: string;
  subjectRecord: string;
  dailyEnergyIntake: string;
  addItemToMeal: string;
  drvIntakeVsReference: string;
  drvShortfallNotice: string;
  targetMet: string;
  adequateRange: string;
  potentialShortfall: string;
  excessAboveUl: string;
  targetPercentage: string;

  // Meal Planner
  plannerTitle: string;
  plannerSubtitle: string;
  calorieTarget: string;
  dailyEnergyBalance: string;
  macroDistribution: string;
  academicDraftNotice: string;

  // Anthropometrics
  anthroTitle: string;
  anthroSubtitle: string;
  subjectMeasurements: string;
  subjectId: string;
  ageYears: string;
  biologicalSex: string;
  heightCm: string;
  weightKg: string;
  waistCm: string;
  hipCm: string;
  assessmentDate: string;
  bmiValue: string;
  whoCategory: string;
  asianRiskStandard: string;
  waistToHeightRatio: string;
  cardiometabolicRisk: string;
  pediatricNotice: string;
  recordedAssessments: string;

  // Research Projects
  projectsTitle: string;
  projectsSubtitle: string;
  newResearchProject: string;
  academicProjects: string;
  studyTitle: string;
  protocolCode: string;
  scientificObjectives: string;
  methodologyNotes: string;
  importDataset: string;
  quantitativeDatasets: string;
  descriptiveStatsSubtitle: string;
  mean: string;
  median: string;
  stdDev: string;
  minVal: string;
  maxVal: string;
  sampleSizeN: string;

  // Scientific Glossary Terms
  termEnergy: string;
  termProtein: string;
  termTotalFat: string;
  termSaturatedFat: string;
  termMonounsaturatedFat: string;
  termPolyunsaturatedFat: string;
  termCholesterol: string;
  termCarbohydrates: string;
  termDietaryFiber: string;
  termSugars: string;
  termSodium: string;
  termSalt: string;
  termCalcium: string;
  termIron: string;
  termMagnesium: string;
  termPotassium: string;
  termZinc: string;
  termVitaminA: string;
  termVitaminC: string;
  termVitaminD: string;
  termVitaminE: string;
  termVitaminB12: string;
  termFolate: string;
  termServingSize: string;
  termEdiblePortion: string;

  // Reports
  reportsTitle: string;
  reportsSubtitle: string;
  printSavePdf: string;
  reportTypeNutrient: string;
  reportTypeRecipe: string;
  reportTypeDietary: string;
  reportTypeAnthro: string;
  dateOfIssue: string;
  verifiedBy: string;
  leadEvaluator: string;

  // Help & Documentation
  helpTitle: string;
  helpSubtitle: string;
  coreFormulas: string;
  formulaScalingText: string;
  energyConversionsText: string;
  sodiumSaltText: string;
  anthroIndicesText: string;
  missingDataPolicyTitle: string;
  missingDataPolicyText: string;

  // Settings & Auth
  settingsTitle: string;
  settingsSubtitle: string;
  userProfile: string;
  academicRole: string;
  institution: string;
  configuredDrvStandards: string;
  languageSelection: string;
  currentLanguage: string;
  selectLanguagePrompt: string;
  searchLanguage: string;
  authSignInTitle: string;
  authRegisterTitle: string;
  academicEmail: string;
  password: string;
  quickDemoLogin: string;
}
