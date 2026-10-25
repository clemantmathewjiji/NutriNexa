/**
 * Buku Foto Makanan — 2014 (Survey Konsumsi Makanan Individu)
 * Badan Penelitian dan Pengembangan Kesehatan (Balitbangkes)
 * Kementerian Kesehatan Republik Indonesia
 * 
 * Visual Food Portion Estimation Reference for 24-Hour Recalls & Dietary Surveys
 */

export interface PhotoPortionItem {
  id: string;
  food_code_ref: string; // References TKPI 2017 code
  food_name_id: string;
  food_name_en: string;
  category: "Nasi & Serealia" | "Lauk Pauk Hewani" | "Lauk Pauk Nabati" | "Sayuran" | "Buah-buahan" | "Makanan Selingan";
  source_page: string; // e.g. "Buku Foto Makanan 2014, Hal. 12"
  household_utensil: string; // e.g. "Centong plastik mejikom", "Sendok makan", "Piring datar", "Mangkok sedang"
  bdd_percentage: number; // % Bagian Dapat Dimakan
  refuse_note?: string; // e.g. "Tulang ayam tidak dimakan", "Kulit dan biji dibuang"
  photo_badge: string; // Short code for UI display e.g. "BFM-01"
  portions: {
    kecil: {
      label_id: string;
      label_en: string;
      household_desc: string;
      raw_weight_grams: number;
      edible_weight_grams: number;
    };
    sedang: {
      label_id: string;
      label_en: string;
      household_desc: string;
      raw_weight_grams: number;
      edible_weight_grams: number;
    };
    besar: {
      label_id: string;
      label_en: string;
      household_desc: string;
      raw_weight_grams: number;
      edible_weight_grams: number;
    };
  };
}

export const BUKU_FOTO_MAKANAN_CATALOG: PhotoPortionItem[] = [
  // 1. NASI PUTIH (Cooked Rice)
  {
    id: "BFM-NASI-01",
    food_code_ref: "AR002",
    food_name_id: "Nasi Putih",
    food_name_en: "Cooked White Rice",
    category: "Nasi & Serealia",
    source_page: "Buku Foto Makanan 2014, Hal. 14",
    household_utensil: "Centong plastik / Piring ceper",
    bdd_percentage: 100,
    photo_badge: "BFM-NASI",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "¾ centong plastik peres",
        raw_weight_grams: 75,
        edible_weight_grams: 75,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 centong plastik munjung",
        raw_weight_grams: 100,
        edible_weight_grams: 100,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "2 centong plastik munjung",
        raw_weight_grams: 200,
        edible_weight_grams: 200,
      },
    },
  },

  // 2. TEMPE GORENG (Fried Tempeh)
  {
    id: "BFM-TEMPE-02",
    food_code_ref: "BD002",
    food_name_id: "Tempe Kedelai Goreng",
    food_name_en: "Fried Tempeh",
    category: "Lauk Pauk Nabati",
    source_page: "Buku Foto Makanan 2014, Hal. 38",
    household_utensil: "Piring ceper sedang",
    bdd_percentage: 100,
    photo_badge: "BFM-TEMPE",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "1 potong kecil tipis (4x3x1 cm)",
        raw_weight_grams: 25,
        edible_weight_grams: 25,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 potong sedang (5x4x1 cm)",
        raw_weight_grams: 50,
        edible_weight_grams: 50,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "2 potong sedang tebal (6x5x1.5 cm)",
        raw_weight_grams: 80,
        edible_weight_grams: 80,
      },
    },
  },

  // 3. TAHU GORENG (Fried Tofu)
  {
    id: "BFM-TAHU-03",
    food_code_ref: "BD004",
    food_name_id: "Tahu Goreng",
    food_name_en: "Fried Tofu",
    category: "Lauk Pauk Nabati",
    source_page: "Buku Foto Makanan 2014, Hal. 42",
    household_utensil: "Piring ceper sedang",
    bdd_percentage: 100,
    photo_badge: "BFM-TAHU",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "1 potong kecil segitiga",
        raw_weight_grams: 30,
        edible_weight_grams: 30,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 potong kotak sedang (4x4 cm)",
        raw_weight_grams: 50,
        edible_weight_grams: 50,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "2 potong kotak sedang (tahu sumedang)",
        raw_weight_grams: 90,
        edible_weight_grams: 90,
      },
    },
  },

  // 4. AYAM GORENG (Fried Chicken)
  {
    id: "BFM-AYAM-04",
    food_code_ref: "ED002",
    food_name_id: "Ayam Goreng Tradisional",
    food_name_en: "Indonesian Fried Chicken",
    category: "Lauk Pauk Hewani",
    source_page: "Buku Foto Makanan 2014, Hal. 56",
    household_utensil: "Piring makan / piring datar",
    bdd_percentage: 70, // 30% tulang ayam
    refuse_note: "Tulang ayam tidak dikonsumsi (30% refuse weight)",
    photo_badge: "BFM-AYAM",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion (Sayap)",
        household_desc: "1 sayap ayam goreng (dengan tulang)",
        raw_weight_grams: 45,
        edible_weight_grams: 31.5,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Paha bawah / Dada kecil)",
        household_desc: "1 paha bawah ayam goreng (dengan tulang)",
        raw_weight_grams: 60,
        edible_weight_grams: 42.0,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion (Dada besar / Paha atas)",
        household_desc: "1 dada ayam goreng utuh (dengan tulang)",
        raw_weight_grams: 90,
        edible_weight_grams: 63.0,
      },
    },
  },

  // 5. TELUR AYAM REBUS / DADAR (Eggs)
  {
    id: "BFM-TELUR-05",
    food_code_ref: "FD002",
    food_name_id: "Telur Ayam Rebus / Ceplok",
    food_name_en: "Hard Boiled / Fried Egg",
    category: "Lauk Pauk Hewani",
    source_page: "Buku Foto Makanan 2014, Hal. 64",
    household_utensil: "Piring datar kecil",
    bdd_percentage: 100, // as served without shell
    photo_badge: "BFM-TELUR",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "½ butir telur ayam rebus",
        raw_weight_grams: 28,
        edible_weight_grams: 28,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 butir telur ayam rebus utuh",
        raw_weight_grams: 55,
        edible_weight_grams: 55,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "1 butir telur dadar tebal (dengan minyak)",
        raw_weight_grams: 70,
        edible_weight_grams: 70,
      },
    },
  },

  // 6. IKAN LELE GORENG (Fried Catfish)
  {
    id: "BFM-LELE-06",
    food_code_ref: "DD003",
    food_name_id: "Ikan Lele Goreng",
    food_name_en: "Fried Catfish (Pecel Lele)",
    category: "Lauk Pauk Hewani",
    source_page: "Buku Foto Makanan 2014, Hal. 72",
    household_utensil: "Piring ceper lonjong",
    bdd_percentage: 80, // 20% tulang & duri
    refuse_note: "Kepala dan duri utama tidak dimakan",
    photo_badge: "BFM-LELE",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "1 ekor lele kecil goreng (panjang 15 cm)",
        raw_weight_grams: 65,
        edible_weight_grams: 52.0,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 ekor lele sedang goreng (panjang 18 cm)",
        raw_weight_grams: 95,
        edible_weight_grams: 76.0,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "1 ekor lele besar goreng (panjang 22 cm)",
        raw_weight_grams: 130,
        edible_weight_grams: 104.0,
      },
    },
  },

  // 7. SAYUR BENING BAYAM / TUMIS KANGKUNG (Cooked Vegetables)
  {
    id: "BFM-SAYUR-07",
    food_code_ref: "CD004",
    food_name_id: "Sayur Bening Bayam / Kangkung",
    food_name_en: "Clear Spinach Soup / Cooked Greens",
    category: "Sayuran",
    source_page: "Buku Foto Makanan 2014, Hal. 88",
    household_utensil: "Mangkok sup sedang / Sendok sayur",
    bdd_percentage: 100,
    photo_badge: "BFM-SAYUR",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "½ mangkok sedang sayur (tiris)",
        raw_weight_grams: 50,
        edible_weight_grams: 50,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 mangkok sedang sayur (tiris kuah)",
        raw_weight_grams: 100,
        edible_weight_grams: 100,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "1 mangkok besar sayur penuh (1.5 cup)",
        raw_weight_grams: 150,
        edible_weight_grams: 150,
      },
    },
  },

  // 8. PISANG AMBON (Banana)
  {
    id: "BFM-PISANG-08",
    food_code_ref: "GD001",
    food_name_id: "Pisang Ambon",
    food_name_en: "Ambon Banana",
    category: "Buah-buahan",
    source_page: "Buku Foto Makanan 2014, Hal. 104",
    household_utensil: "Buah utuh",
    bdd_percentage: 75,
    refuse_note: "Kulit pisang dibuang (25% refuse)",
    photo_badge: "BFM-PISANG",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "1 buah kecil (panjang 12 cm)",
        raw_weight_grams: 75,
        edible_weight_grams: 56.25,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 buah sedang (panjang 15 cm)",
        raw_weight_grams: 110,
        edible_weight_grams: 82.5,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "1 buah besar montok (panjang 18 cm)",
        raw_weight_grams: 150,
        edible_weight_grams: 112.5,
      },
    },
  },

  // 9. RENDANG SAPI (Beef Rendang)
  {
    id: "BFM-RENDANG-09",
    food_code_ref: "ED004",
    food_name_id: "Rendang Daging Sapi",
    food_name_en: "Beef Rendang",
    category: "Lauk Pauk Hewani",
    source_page: "Buku Foto Makanan 2014, Hal. 60",
    household_utensil: "Piring makan / piring ceper",
    bdd_percentage: 100,
    photo_badge: "BFM-RENDANG",
    portions: {
      kecil: {
        label_id: "Porsi Kecil (P)",
        label_en: "Small Portion",
        household_desc: "1 potong kecil (3x3x2 cm)",
        raw_weight_grams: 35,
        edible_weight_grams: 35,
      },
      sedang: {
        label_id: "Porsi Sedang (S)",
        label_en: "Medium Portion (Standard)",
        household_desc: "1 potong sedang (4x4x2 cm)",
        raw_weight_grams: 50,
        edible_weight_grams: 50,
      },
      besar: {
        label_id: "Porsi Besar (B)",
        label_en: "Large Portion",
        household_desc: "2 potong sedang tebal dengan bumbu pekat",
        raw_weight_grams: 90,
        edible_weight_grams: 90,
      },
    },
  },
];
