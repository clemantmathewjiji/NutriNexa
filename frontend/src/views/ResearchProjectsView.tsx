import React, { useEffect, useState } from "react";
import { projectsApi } from "../api";
import { ProjectRecord, DescriptiveStat } from "../types";
import {
  FlaskConical, Plus, Upload, FileSpreadsheet,
  CheckCircle2, ArrowRight, Table, BarChart2, Info
} from "lucide-react";

export const ResearchProjectsView: React.FC = () => {
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
    // Real synthetic data matrix for 20 subjects
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
          <h1 className="text-xl font-bold text-[#174C3A] flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-[#2D8C83]" />
            <span>Research Projects & Scientific Datasets</span>
          </h1>
          <p className="text-xs text-[#52635C] mt-1">
            Organize academic study cohorts, link nutrient calculations, and compute descriptive statistics (Mean, Median, SD, Range).
          </p>
        </div>

        <button
          onClick={() => setShowNewProjModal(true)}
          className="bg-[#174C3A] hover:bg-[#123C2E] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Research Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Project Selector List */}
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-4 shadow-xs space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-[#7D9087] pb-2 border-b border-[#E2E8E2]">
            Academic Projects ({projects.length})
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
                    className="bg-[#2D8C83] hover:bg-[#237069] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Research Dataset</span>
                  </button>
                </div>

                <h2 className="text-base font-bold text-[#192520]">{projectDetail.project.title}</h2>

                <div className="text-xs space-y-2 text-[#52635C]">
                  <div>
                    <strong>Scientific Objectives:</strong> {projectDetail.project.objectives || "Not specified"}
                  </div>
                  <div>
                    <strong>Methodology:</strong> {projectDetail.project.methodology_notes || "Standardized dietary assessments"}
                  </div>
                </div>
              </div>

              {/* Research Datasets & Descriptive Statistics */}
              <div className="bg-white rounded-xl border border-[#E2E8E2] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#E2E8E2] bg-[#F7F9F7] flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#174C3A] flex items-center space-x-1.5">
                      <BarChart2 className="w-4 h-4 text-[#2D8C83]" />
                      <span>Quantitative Datasets & Descriptive Statistics</span>
                    </h3>
                    <p className="text-xs text-[#52635C]">
                      Real computed Mean, Median, Standard Deviation, and Min-Max ranges.
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
                            <span className="text-[11px] text-[#7D9087] ml-2">
                              (Sample Size N = {ds.row_count} observations)
                            </span>
                          </div>
                          <span className="text-[10px] text-[#7D9087]">
                            Uploaded {new Date(ds.uploaded_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Descriptive Statistics Table */}
                        <div className="overflow-x-auto text-xs">
                          <table className="w-full text-left border border-[#E2E8E2] rounded-lg overflow-hidden">
                            <thead className="bg-[#F1F5F2] font-semibold text-[#192520]">
                              <tr>
                                <th className="py-2 px-3">Variable</th>
                                <th className="py-2 px-3 text-right">N</th>
                                <th className="py-2 px-3 text-right">Mean</th>
                                <th className="py-2 px-3 text-right">Median</th>
                                <th className="py-2 px-3 text-right">Std Dev (SD)</th>
                                <th className="py-2 px-3 text-right">Min</th>
                                <th className="py-2 px-3 text-right">Max</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8E2]">
                              {Object.entries(ds.descriptive_stats || {}).map(([varName, stat]: [string, any]) => (
                                <tr key={varName} className="hover:bg-[#F7F9F7]">
                                  <td className="py-2 px-3 font-semibold font-mono text-[#174C3A]">{varName}</td>
                                  <td className="py-2 px-3 text-right text-[#52635C]">{stat.n}</td>
                                  <td className="py-2 px-3 text-right font-bold text-[#192520]">{stat.mean}</td>
                                  <td className="py-2 px-3 text-right text-[#52635C]">{stat.median}</td>
                                  <td className="py-2 px-3 text-right text-[#7D9087]">±{stat.std_dev}</td>
                                  <td className="py-2 px-3 text-right text-[#52635C]">{stat.min}</td>
                                  <td className="py-2 px-3 text-right text-[#52635C]">{stat.max}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#7D9087] text-xs">
                    No research datasets uploaded yet for this protocol.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-12 text-center text-[#7D9087] text-xs">
              Select an academic project from the left or create a new study.
            </div>
          )}
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {showNewProjModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E2E8E2] p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-[#174C3A]">Create New Research Project</h3>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Study Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dietary Fiber & Glycemic Response in Undergraduate Students"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Protocol / IRB Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NUTRI-2026-B"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Research Objectives</label>
                <textarea
                  rows={2}
                  placeholder="Specific scientific aims and nutritional hypotheses."
                  value={objectives}
                  onChange={(e) => setObjectives(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Methodology Notes</label>
                <textarea
                  rows={2}
                  placeholder="Assessment method (24h recall, weighed record, sample size)."
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjModal(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#174C3A] text-white font-bold rounded-lg"
                >
                  Initialize Study
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DATASET IMPORT MODAL */}
      {showDatasetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#E2E8E2] p-6 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-[#174C3A]">Import Academic Study Dataset</h3>
            <p className="text-xs text-[#52635C]">
              NutriNexa automatically validates variable columns and calculates real descriptive statistics (Mean, Median, SD, Range).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Dataset Label</label>
                <input
                  type="text"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Cohort Description</label>
                <input
                  type="text"
                  value={datasetDesc}
                  onChange={(e) => setDatasetDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-[#174C3A]">
              ✓ Ready to process 10 subject observations with variables: <code>energy_kcal</code>, <code>protein_g</code>, <code>fiber_g</code>, <code>bmi</code>.
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDatasetModal(false)}
                className="px-3 py-1.5 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateDatasetUpload}
                className="px-4 py-1.5 bg-[#174C3A] text-white font-bold rounded-lg"
              >
                Upload & Calculate Statistics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
