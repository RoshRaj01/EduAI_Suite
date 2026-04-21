import React, { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Users, Plus, CheckCircle2, AlertCircle,
  Play, ChevronRight, BrainCircuit, Eye, Check, X, Timer,
  FileText, Layers,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { ExamCreator } from "./ExamCreator";

type ExamView = "list" | "take" | "review";

const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
  upcoming:  { color: "#264796", bg: "rgba(38,71,150,0.1)",  label: "Upcoming"  },
  ongoing:   { color: "#d97706", bg: "rgba(217,119,6,0.1)",  label: "Ongoing"   },
  completed: { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  label: "Completed" },
  draft:     { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Draft"    },
};

export const ExamsPage: React.FC = () => {
  const [examsList, setExamsList] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "take" | "review">("overview");
  const [loading, setLoading] = useState(true);
  const [showCreator, setShowCreator] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/exams/");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setExamsList(data);
      if (data.length > 0 && !selectedExam) {
        setSelectedExam(data[0]);
      }
    } catch (err) {
      console.error("Error fetching exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExam = async (examData: any) => {
    try {
      const response = await fetch("http://localhost:8000/exams/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });
      if (response.ok) {
        setShowCreator(false);
        fetchExams();
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Examinations
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Create, manage, review AI evaluations, track student submissions.
          </p>
        </div>
        <button onClick={() => setShowCreator(true)} className="btn btn-primary text-sm">
          <Plus size={15} /> Create Exam
        </button>
      </div>

      {showCreator && (
        <ExamCreator 
          onClose={() => setShowCreator(false)} 
          onSave={handleSaveExam}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Exams",      value: String(examsList.length),  icon: ClipboardList, color: "#264796" },
          { label: "Pending AI Review",value: "0", icon: BrainCircuit,  color: "#d97706" },
          { label: "Submissions Today",value: "0", icon: CheckCircle2,  color: "#16a34a" },
          { label: "Avg Completion",   value: "0%",icon: Users,         color: "#7c3aed" },
        ].map(s => (
          <GlassCard key={s.label} padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${s.color}18` }}>
              <s.icon size={19} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading exams...</div>
          ) : examsList.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No exams found.</div>
          ) : (
            examsList.map(exam => {
              const s = statusStyle[exam.status] || statusStyle.draft;
              return (
                <div
                  key={exam.id}
                  onClick={() => setSelectedExam(exam)}
                  className={`glass-card p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
                    selectedExam?.id === exam.id ? "border-l-[#264796] shadow-lg" : "border-l-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug" style={{ color: "var(--color-text-primary)" }}>{exam.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>Course {exam.course_id}</p>
                    </div>
                    <span className="badge shrink-0 text-[9px] px-2 py-0.5" style={{ color: s.color, background: s.bg }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    <span className="flex items-center gap-1"><Clock size={10} /> {exam.time_limit}m</span>
                    <span className="flex items-center gap-1"><Users size={10} /> {exam.attempts_allowed} attempts</span>
                    <span className="flex items-center gap-1"><Layers size={10} /> MCQ</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Exam Detail */}
        <div className="xl:col-span-2">
          {selectedExam ? (
            <GlassCard padding="none">
              {/* Hero */}
              <div className="gradient-blue rounded-t-2xl p-5 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="badge text-[9px] px-2" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                        MCQ
                      </span>
                      <span className="badge text-[9px] px-2" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                        Course {selectedExam.course_id}
                      </span>
                    </div>
                    <h2 className="text-lg font-bold">{selectedExam.title}</h2>
                    <p className="text-white/70 text-sm mt-1">Created: {new Date(selectedExam.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black">{selectedExam.questions?.reduce((acc: number, q: any) => acc + (q.points || 0), 0) || 0}</p>
                    <p className="text-white/60 text-xs">Total Marks</p>
                  </div>
                </div>
                <div className="flex gap-6 mt-4 pt-4 border-t border-white/15 text-xs text-white/75">
                  <span className="flex items-center gap-1.5"><Timer size={12} /> {selectedExam.time_limit} minutes</span>
                  <span className="flex items-center gap-1.5"><ClipboardList size={12} /> {selectedExam.questions?.length || 0} questions</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: "rgba(38,71,150,0.1)" }}>
                {(["overview", "take", "review"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3.5 text-sm font-semibold capitalize transition-colors flex items-center gap-1.5 ${
                      activeTab === tab ? "border-b-2 border-[#264796] text-[#264796]" : "text-slate-400 hover:text-slate-600"
                    }`}>
                    {tab === "take" && <Play size={13} />}
                    {tab === "review" && <Eye size={13} />}
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {/* Overview */}
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: "Questions", value: `${selectedExam.questions?.length || 0}` },
                        { label: "Status",  value: `${selectedExam.status}` },
                        { label: "Time Limit", value: `${selectedExam.time_limit}m` },
                        { label: "Randomized", value: selectedExam.randomize_questions ? "Yes" : "No" },
                      ].map(item => (
                        <div key={item.label} className="p-3 rounded-xl text-center"
                          style={{ background: "rgba(38,71,150,0.05)", border: "1px solid rgba(38,71,150,0.1)" }}>
                          <p className="text-xl font-bold" style={{ color: "var(--color-brand-blue)" }}>{item.value}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button className="btn btn-primary flex-1 text-sm">
                        <Eye size={14} /> Preview Exam
                      </button>
                      <button className="btn btn-outline text-sm flex-1">
                        <FileText size={14} /> Export Stats
                      </button>
                    </div>
                  </div>
                )}

                {/* Take Exam (Student View) */}
                {activeTab === "take" && (
                  <div className="space-y-5">
                    <div className="p-10 text-center text-slate-400">
                        Take exam preview not yet implemented for teacher view.
                    </div>
                  </div>
                )}

                {/* AI Review */}
                {activeTab === "review" && (
                  <div className="p-10 text-center text-slate-400">
                    AI Review submissions will appear here after students complete the exam.
                  </div>
                )}
              </div>
            </GlassCard>
          ) : (
            <div className="h-full flex items-center justify-center p-12 text-slate-400">
              Select an exam from the list to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
