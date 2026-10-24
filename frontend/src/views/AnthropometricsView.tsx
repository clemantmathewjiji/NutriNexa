import React, { useEffect, useState } from "react";
import { anthropometricsApi } from "../api";
import { AnthropometricRecord } from "../types";
import {
  Activity, Plus, Save, Scale, AlertCircle,
  CheckCircle2, Info, User, HeartPulse, History
} from "lucide-react";

export const AnthropometricsView: React.FC = () => {
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
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#2D8C83]" />
            <span>Anthropometric Assessment & Body Composition</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            Calculates BMI, WHO & Asian-Pacific classification standards, and Waist-to-Height Ratio (WHtR).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Form (1 col) */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8E2]">
            <span className="font-bold text-sm text-[#192520]">Subject Measurements</span>
            <span className="text-[10px] text-[#7D9087]">Units: cm &bull; kg</span>
          </div>

          <div>
            <label className="block font-semibold mb-1">Subject ID / Research Code *</label>
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
              <label className="block font-semibold mb-1">Age (Years) *</label>
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
              <label className="block font-semibold mb-1">Biological Sex *</label>
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
              <label className="block font-semibold mb-1">Height (cm) *</label>
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
              <label className="block font-semibold mb-1">Weight (kg) *</label>
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
              <label className="block font-semibold mb-1">Waist Circumference (cm)</label>
              <input
                type="number"
                step="0.5"
                value={waistCm}
                onChange={(e) => setWaistCm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Hip Circumference (cm)</label>
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
            <label className="block font-semibold mb-1">Assessment Date *</label>
            <input
              type="date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Clinical / Research Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#174C3A] hover:bg-[#123C2E] text-white font-bold rounded-lg shadow-xs flex items-center justify-center space-x-1.5 transition"
          >
            <Save className="w-4 h-4 text-[#84CC16]" />
            <span>{savedSuccess ? "Record Saved!" : "Save Physical Record"}</span>
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
                    <span className="text-[11px] font-semibold text-[#52635C] uppercase">Body Mass Index (BMI)</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#174C3A]">
                      {computed.who_category}
                    </span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#174C3A]">
                    {computed.bmi} <span className="text-sm font-normal text-[#52635C]">kg/m²</span>
                  </div>

                  <div className="pt-2 border-t border-[#E2E8E2] text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7D9087]">Asian Risk Standard:</span>
                      <span className="font-semibold text-[#192520]">{computed.asian_category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7D9087]">Standard Method:</span>
                      <span className="text-[#52635C]">WHO TRS 854</span>
                    </div>
                  </div>
                </div>

                {/* Waist-to-Height Ratio Card */}
                <div className="bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-semibold text-[#52635C] uppercase">Waist-to-Height Ratio</span>
                    {computed.waist_to_height_ratio && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-[#2D8C83]">
                        {computed.waist_to_height_ratio < 0.5 ? "Healthy (<0.5)" : "Elevated Risk"}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-extrabold text-[#2D8C83]">
                    {computed.waist_to_height_ratio || "N/A"}
                  </div>

                  <div className="pt-2 border-t border-[#E2E8E2] text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#7D9087]">Cardiometabolic Risk:</span>
                      <span className="font-semibold text-[#192520]">
                        {computed.waist_to_height_status || "Waist circumference required"}
                      </span>
                    </div>
                    {computed.waist_hip_ratio && (
                      <div className="flex justify-between">
                        <span className="text-[#7D9087]">Waist-to-Hip Ratio:</span>
                        <span className="font-semibold text-[#192520]">{computed.waist_hip_ratio}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pediatric Warning Alert */}
              {computed.is_pediatric && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Pediatric Assessment Notice:</strong> For children and adolescents under 18 years, adult BMI categories are not clinically valid. Interpretation requires age-and-sex-specific WHO Growth Reference Z-Scores (percentiles).
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Longitudinal History Table */}
          <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#174C3A]">Recorded Physical Assessments</h3>
              <span className="text-xs text-[#7D9087]">{records.length} records</span>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#F1F5F2] text-[#192520] font-semibold border-b border-[#E2E8E2]">
                  <tr>
                    <th className="py-2.5 px-4">Subject</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Age / Sex</th>
                    <th className="py-2.5 px-4">Ht / Wt</th>
                    <th className="py-2.5 px-4">BMI</th>
                    <th className="py-2.5 px-4">WHO Classification</th>
                    <th className="py-2.5 px-4">WHtR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E2]">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F7F9F7]">
                      <td className="py-2.5 px-4 font-mono font-bold text-[#174C3A]">{r.subject_identifier}</td>
                      <td className="py-2.5 px-4 text-[#52635C]">{r.assessment_date}</td>
                      <td className="py-2.5 px-4 text-[#7D9087]">{r.age_years}y &bull; {r.sex}</td>
                      <td className="py-2.5 px-4 text-[#192520]">{r.height_cm}cm &bull; {r.weight_kg}kg</td>
                      <td className="py-2.5 px-4 font-bold text-[#192520]">{r.bmi}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                          {r.bmi_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[#2D8C83] font-semibold">{r.waist_to_height_ratio || "—"}</td>
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
