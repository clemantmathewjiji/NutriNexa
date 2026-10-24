"use client";
import React, { useEffect, useState } from "react";
import { anthropometricsApi } from "@/lib/api";
import { AnthropometricRecord } from "@/lib/types";
import {
  Activity, Save, Info, HeartPulse
} from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

export const AnthropometricsView: React.FC = () => {
  const { t, formatNumber, formatDate } = useTranslation();
  const [records, setRecords] = useState<AnthropometricRecord[]>([]);

  // Calculation inputs
  const [subjectId, setSubjectId] = useState("SUBJ-409");
  const [ageYears, setAgeYears] = useState<number>(23);
  const [sex, setSex] = useState<string>("Male");
  const [assessmentDate, setAssessmentDate] = useState(new Date().toISOString().split("T")[0]);
  const [heightCm, setHeightCm] = useState<number>(178.0);
  const [weightKg, setWeightKg] = useState<number>(72.5);
  const [waistCm, setWaistCm] = useState<number>(81.0);
  const [hipCm, setHipCm] = useState<number>(96.0);
  const [notes, setNotes] = useState("Baseline physical assessment.");

  // Computed results state
  const [computed, setComputed] = useState<any>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadRecords();
    recalculate();
  }, []);

  useEffect(() => {
    recalculate();
  }, [heightCm, weightKg, ageYears, sex, waistCm, hipCm]);

  const loadRecords = async () => {
    try {
      const res = await anthropometricsApi.list();
      setRecords(res.records);
    } catch (err) {
      console.error(err);
    }
  };

  const recalculate = async () => {
    if (heightCm <= 0 || weightKg <= 0) return;
    try {
      const res = await anthropometricsApi.calculate({
        height_cm: heightCm,
        weight_kg: weightKg,
        age_years: ageYears,
        sex,
        waist_cm: waistCm,
        hip_cm: hipCm,
      });
      setComputed(res);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await anthropometricsApi.save({
        subject_identifier: subjectId,
        age_years: ageYears,
        sex,
        assessment_date: assessmentDate,
        height_cm: heightCm,
        weight_kg: weightKg,
        waist_cm: waistCm,
        hip_cm: hipCm,
        notes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadRecords();
    } catch (err) {
      alert("Failed to save anthropometric record.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#2D8C83]" />
            <span>{t("anthroTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {t("anthroSubtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form (1 col) */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E2]">
            <span className="font-bold text-sm text-[#192520]">{t("subjectMeasurements")}</span>
            <span className="text-[10px] text-[#7D9087]">Units: cm &bull; kg</span>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t("subjectId")} *</label>
            <input
              type="text"
              required
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">{t("ageYears")} *</label>
              <input
                type="number"
                min="1"
                max="120"
                value={ageYears}
                onChange={(e) => setAgeYears(parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t("biologicalSex")} *</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">{t("heightCm")} *</label>
              <input
                type="number"
                step="0.5"
                min="40"
                max="250"
                value={heightCm}
                onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t("weightKg")} *</label>
              <input
                type="number"
                step="0.1"
                min="5"
                max="300"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">{t("waistCm")}</label>
              <input
                type="number"
                step="0.5"
                value={waistCm}
                onChange={(e) => setWaistCm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t("hipCm")}</label>
              <input
                type="number"
                step="0.5"
                value={hipCm}
                onChange={(e) => setHipCm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">{t("assessmentDate")} *</label>
            <input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">{t("notes")}</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition"
          >
            <Save className="w-4 h-4 text-[#84CC16]" />
            <span>{savedSuccess ? "Record Saved!" : t("save")}</span>
          </button>
        </form>

        {/* Right Column: Dynamic Indices & Longitudinal History (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {computed && (
            <div className="space-y-4">
              {/* Indices Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BMI Card */}
                <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-[#52635C] uppercase">{t("bmiValue")}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#174C3A]">
                      {computed.who_category}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#174C3A] ltr-only">
                    {formatNumber(computed.bmi, 2)} <span className="text-sm font-normal text-[#52635C]">kg/m²</span>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8E2] text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7D9087]">{t("whoCategory")}:</span>
                      <span className="font-semibold text-[#192520]">{computed.who_category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7D9087]">{t("asianRiskStandard")}:</span>
                      <span className="font-semibold text-[#2D8C83]">{computed.asian_category}</span>
                    </div>
                  </div>
                </div>

                {/* WHtR Card */}
                <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-[#52635C] uppercase">{t("waistToHeightRatio")}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#2D8C83]">
                      {computed.whtr_status}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#2D8C83] ltr-only">
                    {computed.waist_to_height_ratio ? formatNumber(computed.waist_to_height_ratio, 3) : "—"}
                  </div>

                  <div className="pt-2 border-t border-[#E2E8E2] text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7D9087]">{t("cardiometabolicRisk")}:</span>
                      <span className="font-semibold text-[#192520]">{computed.whtr_status}</span>
                    </div>
                    {computed.waist_to_hip_ratio && (
                      <div className="flex justify-between">
                        <span className="text-[#7D9087]">Waist-to-Hip Ratio:</span>
                        <span className="font-semibold text-[#192520] ltr-only">{formatNumber(computed.waist_to_hip_ratio, 2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reference Standards Explanatory Card */}
              <div className="p-4 bg-[#F1F5F2] rounded-xl border border-[#E2E8E2] text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#174C3A]">
                  <HeartPulse className="w-4 h-4 text-[#2D8C83]" />
                  <span>WHO TRS 854 & Asian-Pacific WHO Cutoffs</span>
                </div>
                <p className="text-[#52635C] text-[11px] leading-relaxed">
                  WHO standard defines normal BMI as 18.5 – 24.9 kg/m². For Asian populations, elevated cardiometabolic risk occurs at lower adiposity levels (overweight &ge; 23.0 kg/m²; obesity &ge; 25.0 kg/m²). Waist-to-height ratio values &ge; 0.5 indicate centralized adiposity.
                </p>
                <p className="text-[#7D9087] text-[10px] italic">
                  {t("pediatricNotice")}
                </p>
              </div>
            </div>
          )}

          {/* Historical Assessments Table */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8E2] bg-[#F7F9F7] flex justify-between items-center text-xs">
              <span className="font-bold text-[#174C3A]">{t("recordedAssessments")}</span>
              <span className="text-[#7D9087]">{records.length} records</span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left rtl:text-right">
                <thead className="bg-[#F1F5F2] text-[#192520] font-semibold border-b border-[#E2E8E2]">
                  <tr>
                    <th className="py-2.5 px-3">Subject ID</th>
                    <th className="py-2.5 px-3">{t("date")}</th>
                    <th className="py-2.5 px-3 text-right rtl:text-left">{t("heightCm")}</th>
                    <th className="py-2.5 px-3 text-right rtl:text-left">{t("weightKg")}</th>
                    <th className="py-2.5 px-3 text-right rtl:text-left">BMI</th>
                    <th className="py-2.5 px-3">{t("whoCategory")}</th>
                    <th className="py-2.5 px-3 text-right rtl:text-left">WHtR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F7F9F7]">
                      <td className="py-2 px-3 font-mono font-semibold text-[#174C3A]">{r.subject_identifier}</td>
                      <td className="py-2 px-3 text-[#52635C]">{formatDate(r.assessment_date)}</td>
                      <td className="py-2 px-3 text-right rtl:text-left ltr-only">{formatNumber(r.height_cm)}</td>
                      <td className="py-2 px-3 text-right rtl:text-left ltr-only">{formatNumber(r.weight_kg)}</td>
                      <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#192520] ltr-only">{formatNumber(r.bmi, 2)}</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-[#174C3A] font-medium">
                          {r.bmi_category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right rtl:text-left text-[#52635C] ltr-only">
                        {r.waist_to_height_ratio ? formatNumber(r.waist_to_height_ratio, 3) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
