import React, { useState, useEffect } from "react";
import { Clock, PlayCircle, AlertCircle, FileText, CheckCircle } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:8000";

interface Exam {
  id: number;
  course_id: number;
  title: string;
  description: string;
  time_limit: number;
  max_attempts: number;
  created_at: string;
  status?: string; // local logic
  score?: string; // local logic
}

export const StudentExams: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        // In a real app, we'd fetch based on student's enrolled courses
        // For now, listing all and maybe filtering by user.id if backend supported it
        const res = await fetch(`${API_URL}/courses/`);
        const courses = await res.json();
        
        let allExams: Exam[] = [];
        for (const course of courses) {
            const examRes = await fetch(`${API_URL}/exams/course/${course.id}`);
            const examData = await examRes.json();
            allExams = [...allExams, ...examData.map((e: any) => ({ ...e, course_code: course.code }))];
        }
        setExams(allExams);
      } catch (err) {
        console.error("Failed to fetch exams");
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>My Exams & Quizzes</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Take online exams and view your AI-evaluated results.</p>
      </div>

      {loading ? (
          <div className="p-20 text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400 font-bold">Synchronizing Examinations...</p>
          </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exams.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 opacity-60">
                    <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="font-bold text-slate-400">No examinations active at the moment.</p>
                </div>
            )}
            {exams.map(exam => (
            <GlassCard key={exam.id} className="p-0 overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-transform shadow-sm hover:shadow-xl group">
                <div className="p-6 border-b" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                    <div className="flex justify-between items-start mb-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">{(exam as any).course_code}</p>
                        <span className="badge badge-blue text-[9px] px-2">Active</span>
                    </div>
                    <h2 className="text-xl font-extrabold group-hover:text-blue-700 transition-colors" style={{ color: "var(--color-text-primary)" }}>{exam.title}</h2>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{exam.description}</p>
                </div>
                
                <div className="p-5 flex justify-between items-center bg-black/5 backdrop-blur-sm">
                    <div className="flex gap-4">
                        <div className="text-center">
                            <p className="text-sm font-black text-slate-800">{exam.time_limit}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Minutes</p>
                        </div>
                        <div className="text-center border-l pl-4 border-slate-200">
                            <p className="text-sm font-black text-slate-800">{exam.max_attempts}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attempts</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate(`/exams/${exam.id}`)}
                        className="btn btn-primary text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30 flex items-center gap-2 font-bold hover:-translate-y-0.5 transition-all"
                    >
                        <PlayCircle size={16}/> Start Exam
                    </button>
                </div>
            </GlassCard>
            ))}
        </div>
      )}
    </div>
  );
};
