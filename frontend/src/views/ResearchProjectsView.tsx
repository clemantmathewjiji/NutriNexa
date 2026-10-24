import React, { useEffect, useState } from "react";
import { projectsApi } from "../api";
import { ProjectRecord } from "../types";
import {
  FlaskConical, Plus, Upload,
  BarChart2, X
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export const ResearchProjectsView: React.FC = () => {
  const { t, formatNumber, formatDate } = useTranslation();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);

  // New Project Form Modal
  const [showNewProjModal, setShowNewProjModal] = useState(false);
  const [title, setTitle] = useState("");
  const [code, setCode] = useState("");
  const [objectives, setObjectives] = useState("");
  const [methodology, setMethodology] = useState("");
  const [tags, setTags] = useState("");

  // Dataset Upload Modal
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [datasetName, setDatasetName] = useState("Subject_Dietary_Biomarkers_2026");
  const [datasetDesc, setDatasetDesc] = useState("Nutrient biomarker intake panel for 25 study participants.");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectsApi.list();
      setProjects(res.projects);
      if (res.projects.length > 0 && !selectedProjectId) {
        handleSelectProject(res.projects[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectProject = async (id: number) => {
    setSelectedProjectId(id);
    try {
      const data = await projectsApi.get(id);
      setProjectDetail(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await projectsApi.create({
        title,
        code,
        objectives,
        methodology_notes: methodology,
        tags,
      });
      setShowNewProjModal(false);
      loadProjects();
      handleSelectProject(res.project_id);
    } catch (err) {
      alert("Failed to create project.");
    }
  };

  const handleSimulateDatasetUpload = async () => {
    if (!selectedProjectId) return;
    const mockData = [
      { subject: "S01", energy_kcal: 2150, protein_g: 72.5, fiber_g: 22.0, bmi: 23.4 },
      { subject: "S02", energy_kcal: 1890, protein_g: 65.0, fiber_g: 18.5, bmi: 21.8 },
      { subject: "S03", energy_kcal: 2640, protein_g: 94.0, fiber_g: 31.0, bmi: 26.2 },
      { subject: "S04", energy_kcal: 2020, protein_g: 68.0, fiber_g: 20.4, bmi: 22.1 },
      { subject: "S05", energy_kcal: 2310, protein_g: 81.5, fiber_g: 25.8, bmi: 24.5 },
      { subject: "S06", energy_kcal: 1780, protein_g: 58.0, fiber_g: 16.2, bmi: 20.5 },
      { subject: "S07", energy_kcal: 2450, protein_g: 88.0, fiber_g: 29.5, bmi: 25.1 },
      { subject: "S08", energy_kcal: 2200, protein_g: 76.0, fiber_g: 24.0, bmi: 23.9 },
      { subject: "S09", energy_kcal: 1950, protein_g: 63.5, fiber_g: 19.8, bmi: 22.7 },
      { subject: "S10", energy_kcal: 2750, protein_g: 102.0, fiber_g: 34.0, bmi: 27.0 },
    ];

    try {
      await projectsApi.addDataset(selectedProjectId, {
        dataset_name: datasetName,
        description: datasetDesc,
        raw_data: mockData,
      });
      setShowDatasetModal(false);
      handleSelectProject(selectedProjectId);
    } catch (err) {
      alert("Failed to upload dataset.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E2E8E2] shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-[#2D8C83]" />
            <span>{t("projectsTitle")}</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            {t("projectsSubtitle")}
          </p>
        </div>

        <button
          onClick={() => setShowNewProjModal(true)}
          className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{t("newResearchProject")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Project Selector List */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#7D9087] pb-2 border-b border-[#E2E8E2]">
            {t("academicProjects")} ({projects.length})
          </div>

          <div className="space-y-2">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedProjectId === p.id
                    ? "bg-[#174C3A] text-white border-[#174C3A] shadow-xs"
                    : "bg-[#F7F9F7] text-[#192520] border-[#E2E8E2] hover:border-[#2D8C83]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">{p.code}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      selectedProjectId === p.id ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="text-xs font-semibold mt-1 line-clamp-1">{p.title}</div>
                <div
                  className={`text-[11px] mt-1 line-clamp-1 ${
                    selectedProjectId === p.id ? "text-white/80" : "text-[#7D9087]"
                  }`}
                >
                  PI: {p.lead_researcher || "Lead Investigator"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Project Workspace Details */}
        <div className="lg:col-span-2 space-y-6">
          {projectDetail ? (
            <div className="space-y-6">
              {/* Project Meta Card */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-[#174C3A] bg-[#174C3A]/10 px-2.5 py-1 rounded">
                    Protocol: {projectDetail.project.code}
                  </span>
                  <button
                    onClick={() => setShowDatasetModal(true)}
                    className="bg-[#2D8C83] hover:bg-[#237069] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t("importDataset")}</span>
                  </button>
                </div>

                <h2 className="text-base font-bold text-[#192520]">{projectDetail.project.title}</h2>

                <div className="text-xs space-y-2 text-[#52635C]">
                  <div>
                    <strong>{t("scientificObjectives")}:</strong> {projectDetail.project.objectives || "Not specified"}
                  </div>
                  <div>
                    <strong>{t("methodologyNotes")}:</strong> {projectDetail.project.methodology_notes || "Standardized dietary assessments"}
                  </div>
                </div>
              </div>

              {/* Research Datasets & Descriptive Statistics */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#174C3A] flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-[#2D8C83]" />
                      <span>{t("quantitativeDatasets")}</span>
                    </h3>
                    <p className="text-xs text-[#52635C]">
                      {t("descriptiveStatsSubtitle")}
                    </p>
                  </div>
                  <span className="text-xs text-[#7D9087]">
                    {projectDetail.datasets.length} dataset(s)
                  </span>
                </div>

                {projectDetail.datasets.length > 0 ? (
                  <div className="p-5 space-y-6">
                    {projectDetail.datasets.map((ds: any) => (
                      <div key={ds.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-bold text-xs text-[#192520]">{ds.dataset_name}</span>
                            <span className="text-[11px] text-[#7D9087] mx-2">
                              ({t("sampleSizeN")} = {ds.row_count} observations)
                            </span>
                          </div>
                          <span className="text-[10px] text-[#7D9087]">
                            Uploaded {formatDate(ds.uploaded_at)}
                          </span>
                        </div>

                        {/* Descriptive Statistics Table */}
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left rtl:text-right border border-[#E2E8E2] rounded-lg overflow-hidden">
                            <thead className="bg-[#F1F5F2] font-semibold text-[#192520]">
                              <tr>
                                <th className="py-2 px-3">Variable</th>
                                <th className="py-2 px-3 text-right rtl:text-left">{t("sampleSizeN")}</th>
                                <th className="py-2 px-3 text-right rtl:text-left">{t("mean")}</th>
                                <th className="py-2 px-3 text-right rtl:text-left">{t("median")}</th>
                                <th className="py-2 px-3 text-right rtl:text-left">{t("stdDev")}</th>
                                <th className="py-2 px-3 text-right rtl:text-left">{t("minVal")}</th>
                                <th className="py-2 px-3 text-right rtl:text-left">{t("maxVal")}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8E2]">
                              {ds.descriptive_stats?.map((stat: any) => (
                                <tr key={stat.variable} className="hover:bg-[#F7F9F7]">
                                  <td className="py-2 px-3 font-semibold text-[#192520] capitalize">
                                    {stat.variable.replace(/_/g, " ")}
                                  </td>
                                  <td className="py-2 px-3 text-right rtl:text-left text-[#52635C] ltr-only">{stat.n}</td>
                                  <td className="py-2 px-3 text-right rtl:text-left font-bold text-[#174C3A] ltr-only">
                                    {formatNumber(stat.mean, 2)}
                                  </td>
                                  <td className="py-2 px-3 text-right rtl:text-left font-medium text-[#2D8C83] ltr-only">
                                    {formatNumber(stat.median, 2)}
                                  </td>
                                  <td className="py-2 px-3 text-right rtl:text-left text-[#52635C] ltr-only">
                                    &plusmn;{formatNumber(stat.std_dev, 2)}
                                  </td>
                                  <td className="py-2 px-3 text-right rtl:text-left text-[#7D9087] ltr-only">{formatNumber(stat.min, 1)}</td>
                                  <td className="py-2 px-3 text-right rtl:text-left text-[#7D9087] ltr-only">{formatNumber(stat.max, 1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-[#7D9087]">
                    No quantitative dataset uploaded yet. Click "Import Research Dataset" to import observations.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-12 text-center text-[#7D9087] text-xs">
              Select an academic project from the left or create a new study protocol.
            </div>
          )}
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E2E8E2] p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#174C3A]">{t("newResearchProject")}</h3>
              <button onClick={() => setShowNewProjModal(false)} className="text-[#7D9087] hover:text-[#192520]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">{t("studyTitle")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bioavailability of Plant Micronutrients in Young Adults"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("protocolCode")} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BIO-2026-B"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("scientificObjectives")}</label>
                <textarea
                  rows={2}
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Primary and secondary study hypotheses..."
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("methodologyNotes")}</label>
                <textarea
                  rows={2}
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Sampling protocol, analytical procedures..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174C3A] text-white rounded-lg font-bold"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT DATASET MODAL */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#174C3A]">{t("importDataset")}</h3>
              <button onClick={() => setShowDatasetModal(false)} className="text-[#7D9087] hover:text-[#192520]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Dataset Matrix Name</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">{t("description")}</label>
                <input
                  type="text"
                  value={datasetDesc}
                  onChange={(e) => setDatasetDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="p-3 bg-[#F7F9F7] border border-[#E2E8E2] rounded-lg text-[11px] text-[#52635C]">
                Ready to parse CSV array (Energy, Protein, Fiber, BMI) across 10 subject records.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDatasetModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateDatasetUpload}
                  className="px-4 py-1.5 bg-[#2D8C83] text-white rounded-lg font-bold"
                >
                  Confirm & Calculate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
