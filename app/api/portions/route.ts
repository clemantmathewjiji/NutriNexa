import { NextRequest, NextResponse } from "next/server";
import { BUKU_FOTO_MAKANAN_CATALOG } from "@/data/bukuFotoMakanan2014";
import { estimateConsumedPortion } from "@/services/portionEstimator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("query")?.toLowerCase();

    let list = [...BUKU_FOTO_MAKANAN_CATALOG];

    if (category && category !== "All Categories") {
      list = list.filter((p) => p.category === category);
    }

    if (query) {
      list = list.filter(
        (p) =>
          p.food_name_id.toLowerCase().includes(query) ||
          p.food_name_en.toLowerCase().includes(query) ||
          p.household_utensil.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      total: list.length,
      portions: list,
      categories: Array.from(new Set(BUKU_FOTO_MAKANAN_CATALOG.map((p) => p.category))),
    });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to list portions." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { item_id, portion_size, portion_count } = body;

    if (!item_id || !portion_size) {
      return NextResponse.json({ detail: "item_id and portion_size (kecil/sedang/besar) are required." }, { status: 400 });
    }

    const result = estimateConsumedPortion(item_id, portion_size, portion_count || 1.0);
    return NextResponse.json({ result });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Failed to estimate portion." }, { status: 500 });
  }
}
