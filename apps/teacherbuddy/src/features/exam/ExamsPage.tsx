import React, { useState, useEffect } from "react";
import {
  ClipboardList, Clock, Users, Plus, CheckCircle2, AlertCircle,
  Play, ChevronRight, BrainCircuit, Eye, Check, X, Timer,
  FileText, Layers, Trash2, PlusCircle, FileUp, Save
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const API_URL = "http://localhost:8000";

interface Option {
  option_text: string;
  is_correct: bool;
  id?: number;
}

interface Question {
  id?: number;
  question_text: string;
  points: number;
  options: Option[];
}

interface Exam {
  id: number;
  course_id: number;
  title: string;
  description: string;
  time_limit: number;
  max_attempts: number;
  randomize_questions: boolean;
  created_at: string;
  questions?: Question[];
}

export const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "results">("overview");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Create Exam Form State
  const [examForm, setExamForm] = useState({
    title: "",
    course_id: 0,
    description: "",
    time_limit: 60,
    max_attempts: 1,
    randomize_questions: false,
    questions: [] as Question[]
  });

  const fetchExams = async () => {
    try {
      const res = await fetch(`${API_URL}/courses/`);
      const courseData = await res.json();
      setCourses(courseData);
      
      if (courseData.length > 0) {
        const examRes = await fetch(`${API_URL}/exams/course/${courseData[0].id}`);
        const examData = await examRes.json();
        setExams(examData);
        if (examData.length > 0) {
          fetchExamDetail(examData[0].id);
        }
      }
    } catch (err) {
      setErrorMsg("Failed to fetch data from server.");
    }
  };

  const fetchExamDetail = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/exams/${id}`);
      const data = await res.json();
      setSelectedExam(data);
      setSelectedId(id);
    } catch (err) {
      console.error("Failed to fetch exam detail");
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.course_id) {
        setErrorMsg("Please select a course");
        return;
    }
    if (examForm.questions.length === 0) {
        setErrorMsg("Please add at least one question");
        return;
    }

    try {
      const res = await fetch(`${API_URL}/exams/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(examForm)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setExamForm({
            title: "", course_id: 0, description: "", time_limit: 60, max_attempts: 1, randomize_questions: false, questions: []
        });
        fetchExams();
      } else {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to create exam");
      }
    } catch (err) {
      setErrorMsg("Server error during exam creation");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/exams/extract-questions`, {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setExamForm(prev => ({
          ...prev,
          questions: [...prev.questions, ...data.questions]
        }));
      }
    } catch (err) {
      console.error("Extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const addQuestion = () => {
    const newQ: Question = {
      question_text: "",
      points: 1,
      options: [
        { option_text: "", is_correct: true },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false },
        { option_text: "", is_correct: false }
      ]
    };
    setExamForm(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
  };

  const updateQuestion = (index: number, text: string) => {
    const qs = [...examForm.questions];
    qs[index].question_text = text;
    setExamForm({ ...examForm, questions: qs });
  };

  const updateOption = (qIndex: number, oIndex: number, text: string) => {
    const qs = [...examForm.questions];
    qs[qIndex].options[oIndex].option_text = text;
    setExamForm({ ...examForm, questions: qs });
  };

  const setCorrectOption = (qIndex: number, oIndex: number) => {
    const qs = [...examForm.questions];
    qs[qIndex].options = qs[qIndex].options.map((opt, i) => ({
      ...opt,
      is_correct: i === oIndex
    }));
    setExamForm({ ...examForm, questions: qs });
  };

  const removeQuestion = (index: number) => {
    const qs = [...examForm.questions];
    qs.splice(index, 1);
    setExamForm({ ...examForm, questions: qs });
  };

  const statusStyle: Record<string, { color: string; bg: string; label: string }> = {
    upcoming:  { color: "#264796", bg: "rgba(38,71,150,0.1)",  label: "Upcoming"  },
    ongoing:   { color: "#d97706", bg: "rgba(217,119,6,0.1)",  label: "Ongoing"   },
    completed: { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  label: "Completed" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Examinations Control
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Design MCQ quizzes, set time limits, and automate student evaluations.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary text-sm flex items-center gap-2">
          <Plus size={15} /> Create Exam
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
            <button className="ml-auto" onClick={() => setErrorMsg(null)}><X size={14}/></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 pl-1">Recent Exams</h3>
          {exams.length === 0 ? (
            <p className="text-sm text-slate-400 p-8 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">No exams created yet.</p>
          ) : (
            exams.map(exam => (
              <div
                key={exam.id}
                onClick={() => fetchExamDetail(exam.id)}
                className={`glass-card p-4 cursor-pointer transition-all hover:shadow-md border-l-4 ${
                  selectedId === exam.id ? "border-l-[#264796] shadow-lg bg-blue-50/30" : "border-l-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm leading-snug" style={{ color: "var(--color-text-primary)" }}>{exam.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{exam.description?.substring(0, 50)}...</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Clock size={10} /> {exam.time_limit}m</span>
                  <span className="flex items-center gap-1"><Users size={10} /> {exam.max_attempts} Attempt(s)</span>
                  <span className="flex items-center gap-1"><Layers size={10} /> MCQ</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Exam Detail */}
        <div className="xl:col-span-2">
          {selectedExam ? (
            <GlassCard padding="none" className="overflow-hidden">
                <div className="gradient-blue p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">{selectedExam.title}</h2>
                            <p className="text-white/70 text-sm mt-1">{selectedExam.description}</p>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-black">{selectedExam.time_limit}</div>
                             <div className="text-[10px] uppercase font-bold text-white/50">Minutes</div>
                        </div>
                    </div>
                    <div className="flex gap-4 mt-6">
                        <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                            {selectedExam.randomize_questions ? "Randomized" : "Sequential Order"}
                        </div>
                        <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                            {selectedExam.max_attempts} Allowed Attempts
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-slate-100">
                    {["overview", "questions", "results"].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                                activeTab === tab ? "border-brand-blue text-brand-blue" : "border-transparent text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === "overview" && (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <p className="text-3xl font-black text-brand-blue">{selectedExam.questions?.length || 0}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Questions</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <p className="text-3xl font-black text-brand-blue">0</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Submissions</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                <p className="text-3xl font-black text-brand-blue">--</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Avg Score</p>
                            </div>
                        </div>
                    )}

                    {activeTab === "questions" && (
                        <div className="space-y-6">
                            {selectedExam.questions?.map((q, idx) => (
                                <div key={q.id} className="pb-6 border-b border-slate-100 last:border-0">
                                    <p className="font-bold text-slate-800 mb-3 flex items-start gap-3">
                                        <span className="w-6 h-6 bg-blue-100 text-brand-blue rounded flex items-center justify-center shrink-0 text-xs">{idx + 1}</span>
                                        {q.question_text}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-9">
                                        {q.options.map((opt, oidx) => (
                                            <div key={opt.id} className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                                                opt.is_correct ? "bg-green-50 border-green-200 text-green-700" : "bg-white border-slate-200 text-slate-600"
                                            }`}>
                                                <span className="flex items-center gap-2">
                                                    <span className="font-bold">{String.fromCharCode(65 + oidx)}.</span>
                                                    {opt.option_text}
                                                </span>
                                                {opt.is_correct && <Check size={14} />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </GlassCard>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200 opacity-50">
                <ClipboardList size={48} className="text-slate-300 mb-4" />
                <p className="font-bold text-slate-400">Select an exam to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE EXAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                  <h3 className="text-xl font-bold text-slate-800">Compose New Examination</h3>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                  <form className="space-y-8">
                      {/* Basic Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Exam Title</label>
                                    <input type="text" className="form-input" placeholder="e.g. Unit 3 Quiz" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Course</label>
                                    <select className="form-input" value={examForm.course_id} onChange={e => setExamForm({...examForm, course_id: parseInt(e.target.value)})}>
                                        <option value={0}>Select Course</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                                    </select>
                                </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Time Limit (Min)</label>
                                    <input type="number" className="form-input" value={examForm.time_limit} onChange={e => setExamForm({...examForm, time_limit: parseInt(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Attempts</label>
                                    <input type="number" className="form-input" value={examForm.max_attempts} onChange={e => setExamForm({...examForm, max_attempts: parseInt(e.target.value)})} />
                                </div>
                                <div className="col-span-2 flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <input type="checkbox" id="rand" checked={examForm.randomize_questions} onChange={e => setExamForm({...examForm, randomize_questions: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-brand-blue" />
                                    <label htmlFor="rand" className="text-sm font-bold text-slate-700 cursor-pointer">Randomize Question Order for Students</label>
                                </div>
                           </div>
                      </div>

                      <hr className="border-slate-100"/>

                      {/* Question Section */}
                      <div className="space-y-6">
                           <div className="flex items-center justify-between">
                                <h4 className="font-extrabold text-blue-900 border-l-4 border-brand-blue pl-3">Question Bank</h4>
                                <div className="flex gap-2">
                                     <label className="btn btn-outline btn-sm cursor-pointer flex items-center gap-2">
                                         <FileUp size={14}/> {isExtracting ? "Extracting..." : "AI Import (PDF/DOCX)"}
                                         <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isExtracting} />
                                     </label>
                                     <button type="button" onClick={addQuestion} className="btn btn-primary btn-sm flex items-center gap-2">
                                         <PlusCircle size={14}/> Add Manually
                                     </button>
                                </div>
                           </div>

                           <div className="space-y-4">
                                {examForm.questions.map((q, qidx) => (
                                    <div key={qidx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200 relative group animate-fade-in">
                                        <button type="button" onClick={() => removeQuestion(qidx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                                        
                                        <div className="mb-4">
                                             <label className="text-[10px] font-bold text-blue-500 uppercase mb-1 block">Question {qidx + 1}</label>
                                             <input 
                                                type="text" 
                                                className="form-input font-semibold" 
                                                placeholder="Enter question text here..."
                                                value={q.question_text}
                                                onChange={e => updateQuestion(qidx, e.target.value)}
                                             />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map((opt, oidx) => (
                                                <div key={oidx} className="flex items-center gap-2">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setCorrectOption(qidx, oidx)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold transition-all ${
                                                            opt.is_correct ? "bg-green-500 text-white shadow-lg" : "bg-white text-slate-300 border border-slate-200 hover:border-green-300"
                                                        }`}
                                                    >
                                                        {opt.is_correct ? <Check size={16}/> : String.fromCharCode(65 + oidx)}
                                                    </button>
                                                    <input 
                                                        type="text" 
                                                        className={`flex-1 text-sm p-3 rounded-xl border transition-all ${
                                                            opt.is_correct ? "bg-green-50 border-green-200 text-green-800 font-medium" : "bg-white border-slate-200 text-slate-600 focus:border-brand-blue"
                                                        }`}
                                                        placeholder={`Option ${String.fromCharCode(65 + oidx)}`}
                                                        value={opt.option_text}
                                                        onChange={e => updateOption(qidx, oidx, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {examForm.questions.length === 0 && (
                                    <div className="py-20 text-center bg-blue-50/30 rounded-3xl border-2 border-dashed border-blue-100">
                                         <BrainCircuit size={40} className="text-blue-200 mx-auto mb-3" />
                                         <p className="text-blue-400 font-medium font-display">Click 'Add Manually' or use'AI Import' to populate questions</p>
                                    </div>
                                )}
                           </div>
                      </div>
                  </form>
              </div>

              <div className="p-6 border-t bg-white flex justify-end gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                  <button onClick={() => setShowCreateModal(false)} className="btn btn-outline px-8">Discard</button>
                  <button onClick={handleCreateExam} className="btn btn-primary px-10 shadow-lg shadow-blue-500/30"><Save size={18} className="mr-2"/> Deploy Examination</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
