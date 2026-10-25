export interface ImportedRecordPreview {
  code: string;
  food_name: string;
  source_document: string;
  source_page: string;
  bdd_percentage: number;
  energy_kcal: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  validation_status: "Verified" | "Needs Review" | "Duplicate";
  validation_notes: string[];
}

export interface DocumentImportBatchResult {
  document_code: string;
  document_title: string;
  total_rows_parsed: number;
  verified_count: number;
  review_required_count: number;
  duplicate_count: number;
  records: ImportedRecordPreview[];
  summary: {
    extraction_date: string;
    reviewer: string;
    integrity_score_pct: number;
  };
}

/**
 * Validates and previews food records extracted from reference PDFs (TKPI 2017 & Buku Foto Makanan 2014).
 * Enforces scientific validation rules and duplicate detection.
 */
export function validateAndPreviewImportBatch(
  rawRows: Array<{
    code: string;
    name: string;
    page: string;
    bdd?: number;
    kcal?: number;
    protein?: number;
    fat?: number;
    carbs?: number;
  }>,
  existingCodes: string[] = ["AR001", "BD001", "CD001", "DD001", "ED001"]
): DocumentImportBatchResult {
  const records: ImportedRecordPreview[] = [];
  let verifiedCount = 0;
  let reviewCount = 0;
  let duplicateCount = 0;

  for (const row of rawRows) {
    const notes: string[] = [];
    let status: "Verified" | "Needs Review" | "Duplicate" = "Verified";

    // 1. Duplicate Detection
    if (existingCodes.includes(row.code.toUpperCase())) {
      status = "Duplicate";
      notes.push(`Food code ${row.code} already exists in database registry.`);
      duplicateCount++;
    } else {
      // 2. Data Validation
      if (!row.name || row.name.trim().length < 2) {
        status = "Needs Review";
        notes.push("Missing or incomplete food name.");
      }

      if (row.bdd !== undefined && (row.bdd < 10 || row.bdd > 100)) {
        status = "Needs Review";
        notes.push(`Abnormal % BDD value (${row.bdd}%). Standard range: 10% - 100%.`);
      }

      if (row.kcal !== undefined && row.kcal < 0) {
        status = "Needs Review";
        notes.push("Negative caloric value detected.");
      }

      // Atwater cross-check: 4*P + 4*C + 9*F should roughly approximate stated kcal
      if (row.kcal && row.protein !== undefined && row.fat !== undefined && row.carbs !== undefined) {
        const estKcal = row.protein * 4.0 + row.carbs * 4.0 + row.fat * 9.0;
        const diff = Math.abs(estKcal - row.kcal);
        if (diff > 50 && row.kcal > 100) {
          notes.push(`Atwater energy variance discrepancy: calculated ${estKcal.toFixed(0)} kcal vs reported ${row.kcal} kcal (Difference: ${diff.toFixed(0)} kcal).`);
        }
      }

      if (status === "Verified") {
        verifiedCount++;
      } else {
        reviewCount++;
      }
    }

    records.push({
      code: row.code,
      food_name: row.name,
      source_document: "Tabel Komposisi Pangan Indonesia (TKPI) 2017",
      source_page: row.page || "Page Ref Required",
      bdd_percentage: row.bdd ?? 100,
      energy_kcal: row.kcal ?? 0,
      protein_g: row.protein ?? 0,
      fat_g: row.fat ?? 0,
      carbs_g: row.carbs ?? 0,
      validation_status: status,
      validation_notes: notes,
    });
  }

  const integrityScore = rawRows.length > 0 ? Number(((verifiedCount / rawRows.length) * 100.0).toFixed(1)) : 100.0;

  return {
    document_code: "DOC-TKPI-2017",
    document_title: "Tabel Komposisi Pangan Indonesia 2017",
    total_rows_parsed: rawRows.length,
    verified_count: verifiedCount,
    review_required_count: reviewCount,
    duplicate_count: duplicateCount,
    records,
    summary: {
      extraction_date: new Date().toISOString().split("T")[0],
      reviewer: "Institutional Informatics Reviewer",
      integrity_score_pct: integrityScore,
    },
  };
}
