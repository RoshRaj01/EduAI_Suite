import React from "react";
import { BookOpen, Clock, Target, PlayCircle, Award, Calendar, ChevronRight } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { Link } from "react-router-dom";

const enrolledCourses = [
  { code: "CSC401", name: "Advanced Neural Networks", assignments: 2, nextClass: "Tomorrow 2:00 PM" },
  { code: "CSC312", name: "Data Structures & Algorithms", assignments: 0, nextClass: "Today 10:00 AM" },
];

export const StudentDashboard: React.FC = () => {
  return (
    <div className="space-y-7 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>
            Welcome back, Aarav 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
            You have 2 pending assignments and 1 live game session.
          </p>
        </div>
        <div className="hidden sm:flex gap-4 p-3 rounded-2xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-card)' }}>
           <div className="text-center">
              <p className="text-xs uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>GPA Level</p>
              <p className="text-lg font-black text-green-600">3.8</p>
           </div>
           <div className="w-px bg-slate-200" />
           <div className="text-center">
              <p className="text-xs uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>Experience</p>
              <p className="text-lg font-black text-blue-600">Lvl 12</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          
          {/* Active Live Game CTA */}
          <GlassCard className="p-6 overflow-hidden relative cursor-pointer group" style={{ background: "linear-gradient(135deg, #1e3a8a, #312e81)" }}>
             <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
             <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4">
                <div className="text-white">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                      <p className="text-xs font-bold uppercase tracking-wider text-red-300">Live Session Active</p>
                  </div>
                  <h2 className="text-2xl font-black font-display mb-1">Neural Networks Quiz Battle</h2>
                  <p className="opacity-80 text-sm max-w-sm">Join Prof. Doe's live strategic quiz module. Earn up to 500 XP and climb the classroom leaderboard!</p>
                </div>
                <Link to="/games" className="btn bg-white text-blue-900 border-none font-black px-6 hover:scale-105 active:scale-95 transition-transform flex gap-2 items-center w-full sm:w-auto mt-4 sm:mt-0">
                  <PlayCircle size={18} /> Join Now
                </Link>
             </div>
          </GlassCard>

          {/* Enrolled Courses */}
          <div>
            <h3 className="section-title text-sm mb-3">My Classrooms</h3>
            <div className="grid sm:grid-cols-2 gap-4">
               {enrolledCourses.map(course => (
                 <GlassCard key={course.code} className="p-5 hover:border-blue-500/30 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <BookOpen size={20} />
                       </div>
                       <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" style={{ color: 'var(--color-brand-blue)' }}/>
                    </div>
                    <p className="text-[10px] font-bold text-blue-500">{course.code}</p>
                    <h4 className="font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>{course.name}</h4>
                    
                    <div className="pt-3 border-t flex justify-between items-center" style={{ borderColor: 'var(--color-border)' }}>
                       <p className="text-xs font-semibold" style={{ color: course.assignments > 0 ? '#ef4444' : 'var(--color-text-muted)' }}>
                         {course.assignments} Due Assignment{course.assignments !== 1 ? 's' : ''}
                       </p>
                    </div>
                 </GlassCard>
               ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <GlassCard className="p-5">
             <h3 className="section-title text-sm flex items-center gap-2 mb-4"><Calendar size={16} className="text-blue-500"/> Upcoming Deadlines</h3>
             <div className="space-y-3">
               <div className="flex border-l-2 pl-3 py-1" style={{ borderColor: '#ef4444' }}>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Mid-Term Assignment</h4>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>CSC401 &bull; Due Today, 11:59 PM</p>
                  </div>
               </div>
               <div className="flex border-l-2 border-blue-500 pl-3 py-1">
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Lab Record Submission</h4>
                    <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>CSC312 &bull; Due Tue, 5:00 PM</p>
                  </div>
               </div>
             </div>
          </GlassCard>

          <GlassCard className="p-5 text-center bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
             <Award size={40} className="mx-auto text-yellow-500 mb-2"/>
             <h3 className="font-black text-yellow-800">Top 10%</h3>
             <p className="text-xs text-yellow-700 mt-1">You are currently ranked #4 in the CSC401 leaderboard.</p>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
