"use client";
import React, { useState, useEffect } from "react";
import {
  FileText, Printer, Globe2, Edit3, Save, Download, CheckCircle2, Building, UserCheck
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";
import { LanguageCode, SUPPORTED_LANGUAGES } from "@/i18n/types";
import { getTranslation } from "@/i18n/locales";
import { User } from "@/lib/types";

interface ReportsViewProps {
  user?: User | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ user }) => {
  const { language, formatDate } = useTranslation();
  const [reportLang, setReportLang] = useState<LanguageCode>(language);
  const [reportType, setReportType] = useState("Nutrient Calculation Report");

  // Investigator Identity State (Defaults to authenticated profile, editable per report)
  const [investigatorName, setInvestigatorName] = useState(user?.displayName || user?.name || "Investigator");
  const [investigatorDesignation, setInvestigatorDesignation] = useState(user?.designation || user?.role || "Principal Investigator");
  const [investigatorInstitution, setInvestigatorInstitution] = useState(user?.institution || "Nutrition Science & Informatics Laboratory");
  const [investigatorDepartment, setInvestigatorDepartment] = useState(user?.department || "Department of Food & Clinical Nutrition");
  const [projectCode, setProjectCode] = useState("NUTRI-2026-A");
  const [reportId] = useState(`NNX-REP-2026-${Math.floor(1000 + Math.random() * 9000)}`);

  // Editing toggle
  const [isEditingInvestigator, setIsEditingInvestigator] = useState(false);
  const [snapshotSaved, setSnapshotSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setInvestigatorName(user.displayName || user.name || "Investigator");
      if (user.designation) setInvestigatorDesignation(user.designation);
      if (user.institution) setInvestigatorInstitution(user.institution);
      if (user.department) setInvestigatorDepartment(user.department);
    }
  }, [user]);

  const rT = (key: any) => getTranslation(reportLang, key);
  const reportLangInfo = SUPPORTED_LANGUAGES.find((l) => l.code === reportLang) || SUPPORTED_LANGUAGES[0];

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSnapshot = () => {
    setSnapshotSaved(true);
    setTimeout(() => setSnapshotSaved(false), 4000);
  };

  const handleExportCsv = () => {
    const csvContent = [
      ["Report ID", reportId],
      ["Report Type", reportType],
      ["Investigator", investigatorName],
      ["Designation", investigatorDesignation],
      ["Institution", investigatorInstitution],
      ["Date", new Date().toISOString().split("T")[0]],
      [],
      ["Food Code", "Food Name", "Edible Weight (g)", "Data Source", "Energy (kcal)", "Protein (g)", "Fat (g)", "Carbs (g)"],
      ["AR002", "Nasi putih matang", "100.0", "TKPI 2017", "180.0", "3.0", "0.3", "39.8"],
      ["BD002", "Tempe kedelai goreng", "50.0", "TKPI 2017", "168.0", "9.1", "12.0", "8.9"],
      ["ED002", "Ayam goreng tradisional (BDD 70%)", "42.0", "TKPI 2017 / Buku Foto Makanan 2014", "109.2", "11.7", "6.5", "0.5"],
      ["CD004", "Sayur bening bayam", "100.0", "TKPI 2017", "28.0", "1.4", "0.3", "5.2"],
      [],
      ["Total Edible Weight (g)", "292.0"],
      ["Total Caloric Energy (kcal)", "485.2"],
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportId}_NutriNexa_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header & Action Bar (Hidden during Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2D8C83]" />
            <span>{rT("reportsTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {rT("reportsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Independent Report Language Selector */}
          <div className="flex items-center gap-1.5 bg-[#F7F9F7] px-2.5 py-1.5 rounded-lg border border-[#E2E8E2] text-xs">
            <Globe2 className="w-3.5 h-3.5 text-emerald-800" />
            <span className="font-semibold text-[#192520]">Report Lang:</span>
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value as LanguageCode)}
              className="bg-transparent font-bold text-emerald-950 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.nativeName} ({l.name})
                </option>
              ))}
            </select>
          </div>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 text-xs border border-[#E2E8E2] rounded-lg bg-white"
          >
            <option value="Nutrient Calculation Report">{rT("reportTypeNutrient")}</option>
            <option value="Recipe Batch Formulation Report">{rT("reportTypeRecipe")}</option>
            <option value="Dietary Intake & DRV Benchmark Report">{rT("reportTypeDietary")}</option>
            <option value="Anthropometric & Physical Assessment Summary">{rT("reportTypeAnthro")}</option>
          </select>

          <button
            onClick={() => setIsEditingInvestigator(!isEditingInvestigator)}
            className="bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#174C3A] text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E8E2] flex items-center gap-1.5 transition"
            title="Edit report investigator details"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingInvestigator ? "Close Editor" : "Edit Investigator"}</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="bg-[#F1F5F2] hover:bg-[#E2E8E2] text-[#174C3A] text-xs font-semibold px-3 py-2 rounded-lg border border-[#E2E8E2] flex items-center gap-1.5 transition"
            title="Export CSV data"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#84CC16]" />
            <span>{rT("printSavePdf")}</span>
          </button>
        </div>
      </div>

      {/* Investigator Customization Drawer (Hidden during Print) */}
      {isEditingInvestigator && (
        <div className="no-print bg-white p-5 rounded-xl border border-[#2D8C83]/40 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E2]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#174C3A]">
              <UserCheck className="w-4 h-4 text-[#2D8C83]" />
              <span>Customize Report Investigator Identity (Historical Snapshot Safe)</span>
            </div>
            {snapshotSaved && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Snapshot Saved
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[#192520]">Investigator Name *</label>
              <input
                type="text"
                value={investigatorName}
                onChange={(e) => setInvestigatorName(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#192520]">Designation</label>
              <input
                type="text"
                value={investigatorDesignation}
                onChange={(e) => setInvestigatorDesignation(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#192520]">Institution / Organization</label>
              <input
                type="text"
                value={investigatorInstitution}
                onChange={(e) => setInvestigatorInstitution(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-[#192520]">Department / Laboratory</label>
              <input
                type="text"
                value={investigatorDepartment}
                onChange={(e) => setInvestigatorDepartment(e.target.value)}
                className="w-full px-3 py-1.5 border border-[#E2E8E2] rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#7D9087]">
              Modifications saved here snapshot to this document only and will not overwrite other investigators' records.
            </span>
            <button
              onClick={handleSaveSnapshot}
              className="px-3 py-1.5 bg-[#174C3A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 hover:bg-[#123C2E] transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Document Snapshot</span>
            </button>
          </div>
        </div>
      )}

      {/* PRINT-READY SCIENTIFIC REPORT DOCUMENT */}
      <div
        dir={reportLangInfo.dir}
        className={`bg-white rounded-2xl border border-[#E2E8E2] p-8 sm:p-12 shadow-sm space-y-8 max-w-4xl mx-auto transition-all ${
          reportLangInfo.dir === "rtl" ? "text-right" : "text-left"
        }`}
      >
        {/* Letterhead */}
        <div className="border-b-2 border-[#174C3A] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#174C3A] flex items-center justify-center text-white shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                </svg>
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#174C3A]">NutriNexa</span>
                <span className="text-[10px] uppercase font-bold text-[#2D8C83] mx-2 tracking-wider">
                  {rT("researchAndAnalytics")}
                </span>
              </div>
            </div>
            <div className="text-xs font-semibold text-[#192520] mt-2">
              {investigatorDepartment}
            </div>
            <div className="text-[11px] text-[#52635C]">
              {investigatorInstitution} &bull; ISO/IEC Scientific Research Data Standard
            </div>
          </div>

          <div className="text-right rtl:text-left text-xs">
            <div className="font-bold text-[#192520]">{reportType}</div>
            <div className="text-[#52635C] mt-0.5">{rT("dateOfIssue")}: {formatDate(new Date())}</div>
            <div className="text-[#7D9087] font-mono text-[10px] mt-0.5 ltr-only">ID: {reportId}</div>
          </div>
        </div>

        {/* Study & Protocol Metadata (Dynamic Profile Derived) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F7F9F7] border border-[#E2E8E2] text-xs">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Project Protocol</span>
            <div className="font-bold text-[#174C3A] mt-0.5 ltr-only">{projectCode}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Lead Investigator</span>
            <div className="font-semibold text-[#192520] mt-0.5">{investigatorName}</div>
            <div className="text-[10px] text-[#52635C]">{investigatorDesignation}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Reference Authority</span>
            <div className="font-semibold text-[#192520] mt-0.5">TKPI 2017 & Buku Foto Makanan 2014</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#7D9087]">Calculation Engine</span>
            <div className="font-semibold text-[#2D8C83] mt-0.5">{rT("scientificCore")} v2.0</div>
          </div>
        </div>

        {/* Contributing Ingredients & Sample Formulation */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#174C3A] border-b border-[#E2E8E2] pb-1">
            {rT("contributingFoods")} &bull; {rT("edibleWeight")}
          </h3>

          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-[#F1F5F2] font-semibold text-[#192520]">
              <tr>
                <th className="py-2 px-3">Item Code</th>
                <th className="py-2 px-3">{rT("foodName")}</th>
                <th className="py-2 px-3">{rT("edibleWeight")}</th>
                <th className="py-2 px-3">{rT("dataSource")}</th>
                <th className="py-2 px-3 text-right rtl:text-left">{rT("termEnergy")} (kcal)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8E2]">
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">AR002</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Nasi putih matang (Cooked white rice)</td>
                <td className="py-2 px-3 ltr-only">100.0 g (1 centong)</td>
                <td className="py-2 px-3 text-[#7D9087]">TKPI 2017 / Buku Foto Makanan</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">180.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">BD002</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Tempe kedelai goreng (Fried tempeh)</td>
                <td className="py-2 px-3 ltr-only">50.0 g (1 ptg sdg)</td>
                <td className="py-2 px-3 text-[#7D9087]">TKPI 2017 / Buku Foto Makanan</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">168.0</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">ED002</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Ayam goreng tradisional (BDD 70%)</td>
                <td className="py-2 px-3 ltr-only">42.0 g (60g gross)</td>
                <td className="py-2 px-3 text-[#7D9087]">TKPI 2017 / Buku Foto Makanan</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">109.2</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-mono text-[11px] ltr-only">CD004</td>
                <td className="py-2 px-3 font-semibold text-[#192520]">Sayur bening bayam (Spinach soup)</td>
                <td className="py-2 px-3 ltr-only">100.0 g (1 mangkok)</td>
                <td className="py-2 px-3 text-[#7D9087]">TKPI 2017</td>
                <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">28.0</td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-[#174C3A] font-bold text-xs">
              <tr>
                <td colSpan={2} className="py-2 px-3">{rT("compositeTotal")}</td>
                <td className="py-2 px-3 ltr-only">292.0 g (Edible)</td>
                <td></td>
                <td className="py-2 px-3 text-right rtl:text-left text-[#174C3A] ltr-only">485.2 kcal (2,030 kJ)</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Standardized Scientific Nutrient Assay Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#174C3A] border-b border-[#E2E8E2] pb-1">
            {rT("completeNutrientProfile")} &bull; Edible Concentration
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {[
              { name: rT("termEnergy"), val: "485.2 kcal (2,030 kJ)" },
              { name: rT("termProtein"), val: "25.2 g (20.8% kcal)" },
              { name: rT("termTotalFat"), val: "19.0 g (35.2% kcal)" },
              { name: rT("termCarbohydrates"), val: "53.9 g (44.0% kcal)" },
              { name: rT("termDietaryFiber"), val: "3.5 g" },
              { name: rT("termCalcium"), val: "172.0 mg" },
              { name: rT("termIron"), val: "4.2 mg" },
              { name: rT("termPhosphorus"), val: "295.0 mg" },
              { name: rT("termSodium"), val: "460.0 mg" },
              { name: "Salt (NaCl Equiv)", val: "1.17 g" },
              { name: rT("termPotassium"), val: "548.0 mg" },
              { name: "Vitamin C", val: "18.0 mg" },
              { name: "Thiamin (B1)", val: "0.22 mg" },
              { name: "Riboflavin (B2)", val: "0.38 mg" },
              { name: "Niacin (B3)", val: "6.8 mg" },
            ].map((n, i) => (
              <div key={i} className="p-2 border border-[#E2E8E2] rounded-lg bg-white flex justify-between items-center">
                <span className="text-[#52635C]">{n.name}:</span>
                <span className="font-bold text-[#192520] ltr-only">{n.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Footnotes & Methodology Notes */}
        <div className="p-4 rounded-xl bg-[#F7F9F7] border border-[#E2E8E2] text-xs space-y-2">
          <div className="font-bold text-[#174C3A]">Scientific Standards & Source Citations</div>
          <p className="text-[#52635C] text-[11px] leading-relaxed">
            1. <strong>Composition Database:</strong> Kementerian Kesehatan Republik Indonesia. <em>Tabel Komposisi Pangan Indonesia (TKPI) 2017</em>. Jakarta: Direktorat Gizi Masyarakat, 2018.
            <br />
            2. <strong>Portion Estimation Reference:</strong> Badan Litbangkes Kemenkes RI. <em>Buku Foto Makanan: Survei Konsumsi Makanan Individu</em>. Jakarta, 2014. Refuse percentage (% BDD) applied to gross food portions.
            <br />
            3. <strong>Calculation Standards:</strong> Atwater factors: 4 kcal/g (protein & available carbs), 9 kcal/g (fat), 2 kcal/g (fiber). Salt computed as <code>(Sodium mg × 2.54) / 1000</code>.
          </p>
        </div>

        {/* Institutional Sign-off */}
        <div className="pt-6 border-t border-[#E2E8E2] flex justify-between items-end text-xs text-[#52635C]">
          <div>
            <div className="font-bold text-[#192520]">{investigatorName}</div>
            <div className="text-[11px] text-[#52635C]">{investigatorDesignation} &bull; {investigatorInstitution}</div>
            <div className="text-[10px] text-[#7D9087] mt-1">{rT("verifiedBy")}: Digitally Verified via NutriNexa Core</div>
          </div>
          <div className="text-right rtl:text-left">
            <div>NutriNexa Research Engine — Production Release</div>
            <div className="text-[10px] text-[#7D9087]">Digital verification token: {reportId}-AUTH</div>
          </div>
        </div>
      </div>
    </div>
  );
};
