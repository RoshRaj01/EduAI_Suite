import React, { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Users, Plus, CheckCircle2, AlertCircle,
  Play, ChevronRight, BrainCircuit, Eye, Check, X, Timer,
  FileText, Layers,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { ExamCreator } from "./ExamCreator";

type ExamView = "list" | "take" | "review";

const exams = [
  {
    id: 1, title: "Neural Networks Mid-Term",          course: "CSC401", type: "HYBRID",
    date: "Apr 20, 2026", time: "10:00 AM", duration: 90, totalMarks: 100,
    submissions: 38, total: 42, status: "upcoming", pendingReview: 0,
  },
  {
    id: 2, title: "DSA Internal Assessment II",        course: "CSC312", type: "MCQ",
    date: "Apr 15, 2026", time: "9:00 AM",  duration: 60, totalMarks: 50,
    submissions: 38, total: 38, status: "completed", pendingReview: 0,
  },
  {
    id: 3, title: "Cloud Computing Assignment Exam",   course: "CSC501", type: "SUBJECTIVE",
    date: "Apr 14, 2026", time: "2:00 PM",  duration: 120, totalMarks: 75,
    submissions: 30, total: 35, status: "ongoing", pendingReview: 24,
  },
  {
    id: 4, title: "DBMS End Semester Examination",     course: "CSC220", type: "HYBRID",
    date: "May 5, 2026",  time: "9:00 AM",  duration: 180, totalMarks: 100,
    submissions: 0,  total: 50, status: "draft", pendingReview: 0,
  },
];

const mcqQuestions = [
  {
    id: 1,
    q: "In a neural network, which activation function is most commonly used in hidden layers for deep learning models?",
    opts: ["Sigmoid", "Tanh", "ReLU", "Softmax"],
    correct: 2,
  },
  {
    id: 2,
    q: "What is the primary purpose of dropout regularization in neural networks?",
    opts: ["Speed up training", "Prevent overfitting", "Increase model accuracy", "Reduce memory usage"],
    correct: 1,
  },
  {
    id: 3,
    q: "During backpropagation, which algorithm is most commonly used to update weights?",
    opts: ["Gradient Descent", "Genetic Algorithm", "Simulated Annealing", "A* Search"],
    correct: 0,
  },
];

const pendingReviews = [
  {
    id: "sub-001", student: "Arjun Mehta", roll: "2226CSC100",
    question: "Explain the vanishing gradient problem in deep neural networks and describe two techniques used to mitigate it.",
    answer: "The vanishing gradient problem occurs when the gradients of the loss function become extremely small as they propagate backward through many layers. This causes early layers to learn very slowly or not at all. Two techniques to mitigate this are: (1) Using ReLU activation functions instead of sigmoid/tanh, since ReLU has a gradient of 1 for positive inputs, preventing gradient decay. (2) Batch Normalization, which normalizes layer inputs and helps maintain healthy gradient magnitudes throughout training.",
    aiScore: 78, confidence: 0.85, rubricMatched: ["vanishing gradient definition", "ReLU mention", "batch normalization"],
    maxScore: 100, status: "pending",
  },
  {
    id: "sub-002", student: "Priya Sharma", roll: "2226CSC101",
    question: "Explain the vanishing gradient problem in deep neural networks and describe two techniques used to mitigate it.",
    answer: "Vanishing gradient is when gradients get very small during backpropagation. We can fix this using LSTM networks for sequence models and residual connections (skip connections) in architectures like ResNet to allow gradients to flow directly.",
    aiScore: 62, confidence: 0.72, rubricMatched: ["vanishing gradient definition", "LSTM mention"],
    maxScore: 100, status: "pending",
  },
];

const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
  upcoming:  { color: "#264796", bg: "rgba(38,71,150,0.1)",  label: "Upcoming"  },
  ongoing:   { color: "#d97706", bg: "rgba(217,119,6,0.1)",  label: "Ongoing"   },
  completed: { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  label: "Completed" },
  draft:     { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Draft"    },
};

export const ExamsPage: React.FC = () => {
  const [view, setView] = useState<ExamView>("list");
  const [selectedExam, setSelectedExam] = useState(exams[2]);
  const [activeTab, setActiveTab] = useState<"overview" | "take" | "review">("overview");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [currentReview, setCurrentReview] = useState(pendingReviews[0]);
  const [scoreInput, setScoreInput] = useState<Record<string, string>>({});
  const [reviewDone, setReviewDone] = useState<Record<string, boolean>>({});
  const [showCreator, setShowCreator] = useState(false);

  const handleSaveExam = async (examData: any) => {
    try {
      const response = await fetch("http://localhost:8000/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examData),
      });
      if (response.ok) {
        setShowCreator(false);
        // In a real app we'd refresh the list
      }
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  useEffect(() => {
    if (activeTab !== "take") return;
    const t = setInterval(() => setTimeLeft(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [activeTab]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const timerColor = timeLeft < 600 ? "#dc2626" : timeLeft < 1800 ? "#d97706" : "#264796";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Examinations
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Create, manage, review AI evaluations, and track student submissions.
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
          { label: "Total Exams",      value: "4",  icon: ClipboardList, color: "#264796" },
          { label: "Pending AI Review",value: "24", icon: BrainCircuit,  color: "#d97706" },
          { label: "Submissions Today",value: "30", icon: CheckCircle2,  color: "#16a34a" },
          { label: "Avg Completion",   value: "91%",icon: Users,         color: "#7c3aed" },
        ].map(s => (
          <GlassCard key={s.label} padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${s.color}18` }}>
              <s.icon size={19} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>{s.value}</p>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="space-y-3">
          {exams.map(exam => {
            const s = statusStyle[exam.status];
            return (
              <div
                key={exam.id}
                onClick={() => setSelectedExam(exam)}
                className={`glass-card p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
                  selectedExam.id === exam.id ? "border-l-[#264796] shadow-lg" : "border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug" style={{ color: "var(--color-text-primary)" }}>{exam.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{exam.course}</p>
                  </div>
                  <span className="badge shrink-0 text-[9px] px-2 py-0.5" style={{ color: s.color, background: s.bg }}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Clock size={10} /> {exam.duration}m</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {exam.submissions}/{exam.total}</span>
                  <span className="flex items-center gap-1"><Layers size={10} /> {exam.type}</span>
                </div>
                {exam.pendingReview > 0 && (
                  <div className="mt-2">
                    <span className="badge badge-orange text-[9px]">
                      <AlertCircle size={9} /> {exam.pendingReview} pending AI review
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Exam Detail */}
        <div className="xl:col-span-2">
          <GlassCard padding="none">
            {/* Hero */}
            <div className="gradient-blue rounded-t-2xl p-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge text-[9px] px-2" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                      {selectedExam.type}
                    </span>
                    <span className="badge text-[9px] px-2" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                      {selectedExam.course}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold">{selectedExam.title}</h2>
                  <p className="text-white/70 text-sm mt-1">{selectedExam.date} · {selectedExam.time}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black">{selectedExam.totalMarks}</p>
                  <p className="text-white/60 text-xs">Total Marks</p>
                </div>
              </div>
              <div className="flex gap-6 mt-4 pt-4 border-t border-white/15 text-xs text-white/75">
                <span className="flex items-center gap-1.5"><Timer size={12} /> {selectedExam.duration} minutes</span>
                <span className="flex items-center gap-1.5"><Users size={12} /> {selectedExam.submissions}/{selectedExam.total} submitted</span>
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
                  {tab} {tab === "review" && selectedExam.pendingReview > 0 && (
                    <span className="badge badge-orange text-[9px] px-1.5">{selectedExam.pendingReview}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Overview */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Submission Rate", value: `${Math.round((selectedExam.submissions / selectedExam.total) * 100)}%` },
                      { label: "Pending Review",  value: `${selectedExam.pendingReview}` },
                      { label: "Avg. Time Taken", value: "72 min" },
                      { label: "Avg. Score",      value: "68/100" },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl text-center"
                        style={{ background: "rgba(38,71,150,0.05)", border: "1px solid rgba(38,71,150,0.1)" }}>
                        <p className="text-xl font-bold" style={{ color: "var(--color-brand-blue)" }}>{item.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{item.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setActiveTab("review")} className="btn btn-primary flex-1 text-sm">
                      <BrainCircuit size={14} /> Review AI Evaluations ({selectedExam.pendingReview})
                    </button>
                    <button className="btn btn-outline text-sm flex-1">
                      <FileText size={14} /> Export Results
                    </button>
                  </div>
                </div>
              )}

              {/* Take Exam (Student View) */}
              {activeTab === "take" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: `${timerColor}12`, border: `1.5px solid ${timerColor}30` }}>
                    <span className="text-sm font-semibold" style={{ color: timerColor }}>Time Remaining</span>
                    <span className="timer-display" style={{ color: timerColor }}>{fmt(timeLeft)}</span>
                  </div>
                  {mcqQuestions.map((q, qi) => (
                    <div key={q.id} className="space-y-3">
                      <p className="font-semibold text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>
                        Q{qi + 1}. {q.q}
                      </p>
                      <div className="space-y-2">
                        {q.opts.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setAnswers(a => ({ ...a, [q.id]: oi }))}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                              answers[q.id] === oi
                                ? "border-[#264796] bg-blue-50 text-[#264796] font-semibold"
                                : "border-slate-200 hover:border-blue-200 hover:bg-blue-50/50"
                            }`}
                          >
                            <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-gold w-full text-sm font-bold py-3">
                    <CheckCircle2 size={15} /> Submit Exam Answers
                  </button>
                </div>
              )}

              {/* AI Review */}
              {activeTab === "review" && pendingReviews.length > 0 && (
                <div className="space-y-5">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pendingReviews.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setCurrentReview(r)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                          currentReview.id === r.id
                            ? "bg-[#264796] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {r.student}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl" style={{ background: "rgba(38,71,150,0.05)", border: "1px solid rgba(38,71,150,0.12)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>QUESTION</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-primary)" }}>{currentReview.question}</p>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(38,71,150,0.1)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>STUDENT ANSWER — {currentReview.student}</p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{currentReview.answer}</p>
                    </div>

                    <div className="p-4 rounded-xl" style={{ background: "rgba(208,174,97,0.1)", border: "1px solid rgba(208,174,97,0.25)" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <BrainCircuit size={16} style={{ color: "var(--color-brand-gold-dark)" }} />
                          <span className="text-sm font-bold" style={{ color: "var(--color-brand-gold-dark)" }}>AI Evaluation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                            Confidence: {Math.round(currentReview.confidence * 100)}%
                          </span>
                          <span className="badge badge-gold text-xs">AI Score: {currentReview.aiScore}/{currentReview.maxScore}</span>
                        </div>
                      </div>
                      <p className="text-xs font-medium mb-2" style={{ color: "var(--color-text-secondary)" }}>Rubric Items Matched:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentReview.rubricMatched.map(r => (
                          <span key={r} className="badge badge-green text-[10px]">
                            <Check size={9} /> {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                          Final Score (/{currentReview.maxScore})
                        </label>
                        <input
                          type="number"
                          className="form-input text-sm"
                          placeholder={`${currentReview.aiScore}`}
                          value={scoreInput[currentReview.id] || ""}
                          onChange={e => setScoreInput(s => ({ ...s, [currentReview.id]: e.target.value }))}
                          min="0" max={currentReview.maxScore}
                        />
                      </div>
                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={() => setReviewDone(s => ({ ...s, [currentReview.id]: true }))}
                          className="btn btn-primary text-sm"
                        >
                          <Check size={14} /> Confirm
                        </button>
                        <button className="btn btn-danger text-sm">
                          <X size={14} /> Reject
                        </button>
                      </div>
                    </div>

                    {reviewDone[currentReview.id] && (
                      <div className="p-3 rounded-xl flex items-center gap-2 animate-fade-in"
                        style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
                        <CheckCircle2 size={15} className="text-green-600" />
                        <p className="text-sm text-green-700 font-semibold">Score confirmed and saved. Student will be notified.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
