import React from "react";
import { Clock, CheckCircle2, PlayCircle, AlertCircle, FileText } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const myExams = [
  { id: 1, title: "Neural Networks Mid-Term", course: "CSC401", date: "Apr 20, 2026", time: "10:00 AM", duration: 90, status: "upcoming" },
  { id: 2, title: "Database Systems Quiz 1", course: "CSC220", date: "Apr 14, 2026", time: "9:00 AM", duration: 30, status: "completed", score: "28/30" },
  { id: 3, title: "Cloud Deployment Lab", course: "CSC501", date: "Apr 16, 2026", time: "2:00 PM", duration: 120, status: "pending_review" },
];

export const StudentExams: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>My Exams & Quizzes</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Take online exams and view your AI-evaluated results.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {myExams.map(exam => (
          <GlassCard key={exam.id} className="p-0 overflow-hidden flex flex-col justify-between">
             <div className="p-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
                 <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-500">{exam.course}</p>
                    {exam.status === 'upcoming' && <span className="badge badge-blue text-[10px]">Upcoming</span>}
                    {exam.status === 'completed' && <span className="badge badge-green text-[10px]">Evaluated</span>}
                    {exam.status === 'pending_review' && <span className="badge badge-orange text-[10px]">Awaiting Marks</span>}
                 </div>
                 <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{exam.title}</h2>
             </div>
             
             <div className="p-5 flex justify-between items-center bg-black/5">
                <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                   <p><Clock className="inline mr-1" size={14}/> {exam.date} at {exam.time}</p>
                   <p className="mt-1"><FileText className="inline mr-1" size={14}/> {exam.duration} Minutes</p>
                </div>
                
                <div className="text-right">
                  {exam.status === 'upcoming' && <button className="btn btn-primary text-xs px-5 shadow-lg"><PlayCircle size={16} className="mr-1"/> Take Exam</button>}
                  {exam.status === 'completed' && <div><p className="text-xs text-green-600 font-semibold mb-1">Final Score</p><p className="text-2xl font-black text-green-700">{exam.score}</p></div>}
                  {exam.status === 'pending_review' && <p className="text-xs text-orange-600 font-semibold flex items-center"><AlertCircle size={14} className="mr-1"/> Under AI Review</p>}
                </div>
             </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
