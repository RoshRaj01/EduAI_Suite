import React, { useState, useEffect, useRef } from "react";
import { 
  Timer, ChevronRight, ChevronLeft, CheckCircle2, 
  AlertTriangle, ArrowRight, Home
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

interface Choice {
  id: int;
  choice_text: string;
}

interface Question {
  id: int;
  question_text: string;
  choices: Choice[];
}

interface Exam {
  id: int;
  title: string;
  time_limit: number;
  questions: Question[];
}

interface ExamPlayerProps {
  exam: Exam;
  onComplete: (results: any) => void;
  onClose: () => void;
}

export const ExamPlayer: React.FC<ExamPlayerProps> = ({ exam, onComplete, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(exam.time_limit * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAutoSubmit = () => {
    if (!isSubmitted) {
      submitExam("time_up");
    }
  };

  const submitExam = async (status: "submitted" | "time_up" = "submitted") => {
    if (isSubmitted) return;
    
    // In a real app we'd create an attempt first and then submit to it
    // Here we'll simulate the submission to the mock or specific endpoint
    const submissionData = {
      answers: Object.entries(answers).map(([qId, cId]) => ({
        question_id: parseInt(qId),
        selected_choice_id: cId
      }))
    };

    try {
      // Mocking the attempt submission for now as we don't have the attempt ID here yet
      // In real implementation, we'd have passed down an attempt_id
      setIsSubmitted(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Simulate API call and evaluation
      const score = Math.floor(Math.random() * 100); // Mock score
      setResults({
        score,
        total: exam.questions.length,
        status
      });
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = exam.questions[currentIdx];
  const progress = ((currentIdx + 1) / exam.questions.length) * 100;
  const timerColor = timeLeft < 300 ? "text-red-500 animate-pulse" : "text-blue-600";

  if (isSubmitted && results) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center p-4 animate-fade-in">
        <GlassCard className="max-w-md w-full text-center p-10 space-y-6">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Exam Submitted!</h2>
            <p className="text-slate-500 mt-2">
              {results.status === "time_up" ? "Time ran out, but your answers were saved." : "You have successfully completed the exam."}
            </p>
          </div>
          
          <div className="py-6 border-y border-slate-100">
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Your Score</p>
             <p className="text-5xl font-black text-blue-600 mt-2">{results.score}%</p>
          </div>

          <button onClick={onClose} className="btn btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Home size={18} /> Back to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
      {/* Top Bar */}
      <div className="h-16 border-b px-6 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
             <Home size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h2 className="font-bold text-slate-700 truncate max-w-[200px] md:max-w-md">{exam.title}</h2>
        </div>

        <div className={`flex items-center gap-2 font-mono font-bold text-lg ${timerColor}`}>
          <Timer size={20} />
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="max-w-3xl mx-auto py-10 px-6 space-y-8">
          {/* Progress */}
          <div className="space-y-2">
             <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Question {currentIdx + 1} of {exam.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
             </div>
             <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                ></div>
             </div>
          </div>

          {/* Question Card */}
          <GlassCard padding="lg" className="shadow-xl border-0">
             <p className="text-lg font-medium text-slate-800 leading-relaxed mb-8">
                {currentQuestion.question_text}
             </p>

             <div className="space-y-3">
                {currentQuestion.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => setAnswers({...answers, [currentQuestion.id]: choice.id})}
                    className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                      answers[currentQuestion.id] === choice.id
                        ? "border-blue-500 bg-blue-50/50 text-blue-700 shadow-md"
                        : "border-slate-100 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-medium">{choice.choice_text}</span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      answers[currentQuestion.id] === choice.id ? "border-blue-500 bg-blue-500" : "border-slate-300 group-hover:border-blue-300"
                    }`}>
                      {answers[currentQuestion.id] === choice.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                  </button>
                ))}
             </div>
          </GlassCard>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
             <button 
               onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
               disabled={currentIdx === 0}
               className="btn btn-outline px-6 py-2.5 flex items-center gap-2 disabled:opacity-30"
             >
                <ChevronLeft size={18} /> Previous
             </button>

             {currentIdx === exam.questions.length - 1 ? (
               <button 
                 onClick={() => submitExam()}
                 className="btn btn-primary px-10 py-2.5 flex items-center gap-2 font-bold shadow-lg"
               >
                  <CheckCircle2 size={18} /> Finish Exam
               </button>
             ) : (
               <button 
                 onClick={() => setCurrentIdx(currentIdx + 1)}
                 className="btn btn-primary px-8 py-2.5 flex items-center gap-2"
               >
                  Next <ChevronRight size={18} />
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};
