import React, { useState } from "react";
import { 
  X, Plus, Trash2, Upload, FileText, Settings, 
  CheckCircle2, BrainCircuit, ListOrdered, Shuffle,
  HelpCircle, ChevronDown, ChevronUp, Save
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

interface Choice {
  choice_text: string;
  is_correct: boolean;
}

interface Question {
  question_text: string;
  question_type: string;
  points: number;
  choices: Choice[];
}

interface ExamCreatorProps {
  onClose: () => void;
  onSave: (examData: any) => void;
}

export const ExamCreator: React.FC<ExamCreatorProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState(1);
  const [timeLimit, setTimeLimit] = useState(60);
  const [attempts, setAttempts] = useState(1);
  const [randomize, setRandomize] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: "",
        question_type: "mcq",
        points: 1,
        choices: [
          { choice_text: "", is_correct: false },
          { choice_text: "", is_correct: false },
        ]
      }
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].question_text = text;
    setQuestions(newQuestions);
  };

  const addChoice = (qIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices.push({ choice_text: "", is_correct: false });
    setQuestions(newQuestions);
  };

  const updateChoice = (qIndex: number, cIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices[cIndex].choice_text = text;
    setQuestions(newQuestions);
  };

  const setCorrectChoice = (qIndex: number, cIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].choices.forEach((c, idx) => {
      c.is_correct = (idx === cIndex);
    });
    setQuestions(newQuestions);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/exams/extract", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setQuestions([...questions, ...data]);
      }
    } catch (err) {
      console.error("Extraction failed", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = () => {
    const examData = {
      title,
      description,
      course_id: courseId,
      time_limit: timeLimit,
      attempts_allowed: attempts,
      randomize_questions: randomize,
      status: "published",
      questions
    };
    onSave(examData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--color-brand-blue)" }}>
              <BrainCircuit size={22} /> Create New Online Exam
            </h2>
            <p className="text-sm text-slate-500">Configure exam settings and add questions manually or via upload.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Settings */}
          <div className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Settings size={14} /> Exam Configuration
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-600">Exam Title</label>
                  <input 
                    type="text" 
                    className="form-input text-sm" 
                    placeholder="e.g. Mid-Term Assessment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold mb-1 block text-slate-600">Time Limit (Minutes)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      className="form-input text-sm" 
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                    />
                    <span className="text-xs text-slate-400 shrink-0">mins</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block text-slate-600">Attempts</label>
                    <input 
                      type="number" 
                      className="form-input text-sm" 
                      value={attempts}
                      onChange={(e) => setAttempts(parseInt(e.target.value))}
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500"
                        checked={randomize}
                        onChange={(e) => setRandomize(e.target.checked)}
                      />
                      <span className="text-xs font-semibold text-slate-600">Randomize</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-4 rounded-2xl bg-blue-50 border border-blue-100 space-y-3">
              <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2">
                <Upload size={14} /> Quick Import
              </h4>
              <p className="text-[10px] text-blue-600 leading-relaxed">
                Upload a DOCX or PDF file. Our AI will automatically extract MCQs and correct answers.
              </p>
              <label className="btn btn-primary w-full text-xs py-2 cursor-pointer flex items-center justify-center gap-2">
                <Upload size={12} /> {isExtracting ? "Extracting..." : "Upload & Parse"}
                <input type="file" className="hidden" accept=".pdf,.docx" onChange={handleFileUpload} disabled={isExtracting} />
              </label>
            </section>
          </div>

          {/* Right Column: Questions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                Questions ({questions.length})
              </h3>
              <button 
                onClick={addQuestion}
                className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <Plus size={14} /> Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 bg-slate-50/50">
                <HelpCircle size={40} strokeWidth={1} className="mb-2" />
                <p className="text-sm">No questions added yet.</p>
                <p className="text-xs">Start by adding one manually or uploading a file.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <GlassCard key={qi} padding="md" className="border border-slate-200/50 relative group">
                    <button 
                      onClick={() => removeQuestion(qi)}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="flex gap-4">
                      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {qi + 1}
                      </span>
                      <div className="flex-1 space-y-4">
                        <textarea 
                          className="form-input text-sm w-full min-h-[80px] bg-transparent border-0 border-b rounded-none focus:ring-0 p-0"
                          placeholder="Type your question here..."
                          value={q.question_text}
                          onChange={(e) => updateQuestionText(qi, e.target.value)}
                        />
                        
                        <div className="space-y-2">
                          {q.choices.map((choice, ci) => (
                            <div key={ci} className="flex items-center gap-3">
                              <button 
                                onClick={() => setCorrectChoice(qi, ci)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                                  choice.is_correct ? "bg-green-500 text-white" : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                                }`}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <input 
                                type="text"
                                className={`flex-1 text-xs py-2 px-3 rounded-xl border transition-all ${
                                  choice.is_correct ? "bg-green-50/50 border-green-200 text-green-700" : "bg-slate-50 border-transparent focus:bg-white focus:border-blue-300"
                                }`}
                                placeholder={`Option ${String.fromCharCode(65 + ci)}`}
                                value={choice.choice_text}
                                onChange={(e) => updateChoice(qi, ci, e.target.value)}
                              />
                            </div>
                          ))}
                          <button 
                            onClick={() => addChoice(qi)}
                            className="text-[10px] font-bold text-blue-500 mt-1 hover:underline flex items-center gap-1"
                          >
                            <Plus size={10} /> Add Option
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="btn btn-outline px-6 py-2">Cancel</button>
          <button 
            onClick={handleSubmit}
            className="btn btn-primary px-10 py-2 font-bold flex items-center gap-2"
            disabled={questions.length === 0 || !title}
          >
            <Save size={18} /> Save & Publish Exam
          </button>
        </div>
      </div>
    </div>
  );
};
