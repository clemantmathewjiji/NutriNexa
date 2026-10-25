import { NextRequest, NextResponse } from "next/server";
import { validateAndPreviewImportBatch } from "@/services/pdfImportService";

export async function GET() {
  return NextResponse.json({
    documents: [
      {
        code: "DOC-TKPI-2017",
        title: "Tabel Komposisi Pangan Indonesia (TKPI) 2017",
        authors: "Direktorat Gizi Masyarakat, Kemenkes RI",
        publication_year: 2018,
        status: "Verified & Integrated",
        total_records: 1120,
        purpose: "Standard reference for nutrient values per 100g edible portion (BDD)",
      },
      {
        code: "DOC-BUKU-FOTO-2014",
        title: "Buku Foto Makanan: Survei Konsumsi Makanan Individu 2014",
        authors: "Badan Litbangkes, Kemenkes RI",
        publication_year: 2014,
        status: "Verified & Integrated",
        total_records: 380,
        purpose: "Photographic portion estimation reference with household measures and edible weights",
      },
    ],
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { raw_rows, existing_codes } = body;

    if (!Array.isArray(raw_rows)) {
      return NextResponse.json({ detail: "raw_rows array is required for import preview." }, { status: 400 });
    }

    const preview = validateAndPreviewImportBatch(raw_rows, existing_codes || []);
    return NextResponse.json({ preview });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to parse import batch." }, { status: 500 });
  }
}
