import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Timer, CheckCircle, AlertCircle, ChevronRight, ChevronLeft, Save } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const API_URL = "http://localhost:8000";

export const ExamTaker: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState<any>(null);
    const [attemptId, setAttemptId] = useState<number | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState<any>(null);

    const fetchExamAndStartAttempt = useCallback(async () => {
        try {
            // 1. Fetch Exam
            const examRes = await fetch(`${API_URL}/exams/${id}`);
            const examData = await examRes.json();
            setExam(examData);
            setTimeLeft(examData.time_limit * 60);

            // 2. Start Attempt
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                navigate("/login");
                return;
            }
            const user = JSON.parse(storedUser);

            const attemptRes = await fetch(`${API_URL}/exams/attempts`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    // If your backend needs user info from token, add Authorization here
                },
                body: JSON.stringify({ exam_id: parseInt(id!) })
            });

            // Mock logic if auth is not fully working in my environment
            // but standard is to send student_id or use token
            const attemptData = await attemptRes.json();
            if (attemptRes.ok) {
                setAttemptId(attemptData.id);
            } else {
                alert(attemptData.detail || "Cannot start exam");
                navigate("/exams");
            }

        } catch (err) {
            console.error("Failed to initialize exam");
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchExamAndStartAttempt();
    }, [fetchExamAndStartAttempt]);

    // Timer Logic
    useEffect(() => {
        if (timeLeft === null || isFinished) return;
        
        if (timeLeft <= 0) {
            handleAutoSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev !== null ? prev - 1 : null));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isFinished]);

    const handleSelectOption = (questionId: number, optionId: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const submitExam = async () => {
        if (!attemptId || isSubmitting) return;
        setIsSubmitting(true);

        const responses = Object.entries(answers).map(([qId, oId]) => ({
            question_id: parseInt(qId),
            selected_option_id: oId
        }));

        try {
            const res = await fetch(`${API_URL}/exams/attempts/${attemptId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ responses })
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setIsFinished(true);
            }
        } catch (err) {
            console.error("Submission failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAutoSubmit = () => {
        console.log("Time is up! Auto-submitting...");
        submitExam();
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    if (!exam || timeLeft === null) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (isFinished) {
        return (
            <div className="max-w-2xl mx-auto py-12 animate-fade-in">
                <GlassCard className="text-center p-12 space-y-6">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-800">Exam Completed!</h2>
                    <p className="text-slate-500">Your results have been evaluated by the AI.</p>
                    
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-2">Final Score</p>
                        <p className="text-6xl font-black text-brand-blue">{result?.score || 0}</p>
                        <p className="text-xs font-bold text-slate-500 mt-2">Well done! Your feedback will be available soon.</p>
                    </div>

                    <button onClick={() => navigate("/exams")} className="btn btn-primary w-full py-4 text-sm font-bold shadow-lg shadow-blue-500/20">
                        Return to Examination Lobby
                    </button>
                </GlassCard>
            </div>
        );
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    const timerColor = timeLeft < 60 ? "#dc2626" : timeLeft < 300 ? "#d97706" : "#264796";

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
            {/* Header / Timer */}
            <div className="sticky top-4 z-40">
                <GlassCard className="flex items-center justify-between p-4 px-6 border-2" style={{ borderColor: `${timerColor}30` }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ background: `${timerColor}15` }}>
                            <Timer size={20} style={{ color: timerColor }} />
                        </div>
                        <span className="font-extrabold text-lg tracking-tight" style={{ color: timerColor }}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-2">
                        {exam.questions.map((_: any, idx: number) => (
                            <div 
                                key={idx} 
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx === currentQuestionIndex ? "w-6 bg-blue-600" : 
                                    answers[exam.questions[idx].id] ? "bg-green-400" : "bg-slate-200"
                                }`}
                            />
                        ))}
                    </div>

                    <button 
                        onClick={submitExam}
                        disabled={isSubmitting}
                        className="btn btn-primary btn-sm flex items-center gap-2 shadow-lg shadow-blue-600/30"
                    >
                       <Save size={14}/> {isSubmitting ? "Submitting..." : "Submit Exam"}
                    </button>
                </GlassCard>
            </div>

            {/* Question UI */}
            <GlassCard className="p-0 overflow-hidden shadow-2xl">
                <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Question {currentQuestionIndex + 1} of {exam.questions.length}
                    </span>
                    <span className="badge badge-gold text-[10px]">{currentQuestion.points} Point(s)</span>
                </div>

                <div className="p-8 space-y-8">
                    <h3 className="text-xl font-bold text-slate-800 leading-relaxed">
                        {currentQuestion.question_text}
                    </h3>

                    <div className="grid grid-cols-1 gap-4">
                        {currentQuestion.options.map((opt: any, oidx: number) => (
                            <button
                                key={opt.id}
                                onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                                className={`group text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                    answers[currentQuestion.id] === opt.id 
                                    ? "border-blue-500 bg-blue-50/50 shadow-md translate-x-2" 
                                    : "border-slate-100 hover:border-slate-300 bg-white"
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black transition-all ${
                                    answers[currentQuestion.id] === opt.id 
                                    ? "bg-blue-600 text-white shadow-lg" 
                                    : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-500"
                                }`}>
                                    {String.fromCharCode(65 + oidx)}
                                </div>
                                <span className={`text-base font-semibold ${
                                    answers[currentQuestion.id] === opt.id ? "text-blue-900" : "text-slate-600"
                                }`}>
                                    {opt.option_text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex items-center justify-between">
                    <button 
                        onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="btn btn-outline btn-sm flex items-center gap-2 px-6 disabled:opacity-30"
                    >
                        <ChevronLeft size={16}/> Previous
                    </button>
                    
                    {currentQuestionIndex < exam.questions.length - 1 ? (
                        <button 
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            className="btn btn-primary btn-sm flex items-center gap-2 px-6 shadow-md"
                        >
                            Next Question <ChevronRight size={16}/>
                        </button>
                    ) : (
                        <button 
                            onClick={submitExam}
                            disabled={isSubmitting}
                            className="btn btn-gold btn-sm flex items-center gap-2 px-8 shadow-lg shadow-yellow-500/20"
                        >
                            Finish & Submit <CheckCircle size={16}/>
                        </button>
                    )}
                </div>
            </GlassCard>

            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                 <AlertCircle size={20} className="text-orange-500 shrink-0" />
                 <p className="text-xs font-bold text-orange-700">
                     Warning: Leaving this page or refreshing will not pause the timer. Auto-submit is active.
                 </p>
            </div>
        </div>
    );
};
