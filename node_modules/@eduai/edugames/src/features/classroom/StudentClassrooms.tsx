import React from "react";
import { BookOpen, Clock, Download, ChevronRight, CheckCircle2 } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const myClasses = [
  { code: "CSC401", name: "Advanced Neural Networks", prof: "Prof. John Doe", progress: 68, color: "#264796" },
  { code: "CSC312", name: "Data Structures & Alg.", prof: "Dr. Smith", progress: 82, color: "#d0ae61" },
];

const myAssignments = [
  { class: "CSC401", name: "Lab 4: Backpropagation", due: "Tonight, 11:59PM", status: "pending" },
  { class: "CSC312", name: "Assignment 2", due: "Tomorrow", status: "submitted" },
];

export const StudentClassrooms: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>My Classrooms</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Access your course materials and track your progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {myClasses.map(cls => (
          <GlassCard key={cls.code} className="p-6 flex flex-col justify-between hover:-translate-y-1 transition-transform cursor-pointer">
            <div>
              <div className="flex justify-between items-start mb-4">
                 <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: cls.color }}>
                    <BookOpen size={20} />
                 </div>
                 <ChevronRight className="opacity-50" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: cls.color }}>{cls.code}</p>
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{cls.name}</h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{cls.prof}</p>
            </div>
            
            <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--color-border)" }}>
               <div className="flex justify-between text-xs mb-1 font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                  <span>Course Progress</span>
                  <span style={{ color: cls.color }}>{cls.progress}%</span>
               </div>
               <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cls.progress}%`, background: cls.color }}></div>
               </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4 font-display" style={{ color: "var(--color-text-primary)" }}>My Assignments</h2>
      <div className="space-y-3">
        {myAssignments.map((ass, i) => (
           <GlassCard key={i} className="p-4 flex items-center justify-between border-l-4" style={{ borderLeftColor: ass.status === 'pending' ? '#ef4444' : '#10b981' }}>
             <div className="flex items-center gap-4">
               {ass.status === 'pending' ? <Clock className="text-red-500" /> : <CheckCircle2 className="text-green-500" />}
               <div>
                  <h4 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>{ass.name}</h4>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>{ass.class} &bull; Due: {ass.due}</p>
               </div>
             </div>
             <button className={`btn text-xs px-4 ${ass.status === 'pending' ? 'btn-primary' : 'bg-green-50 text-green-700 pointer-events-none'}`}>
                {ass.status === 'pending' ? 'Submit Now' : 'Submitted'}
             </button>
           </GlassCard>
        ))}
      </div>
    </div>
  );
};
