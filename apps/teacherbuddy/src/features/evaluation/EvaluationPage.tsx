import React, { useState } from "react";
import { CheckSquare, AlertTriangle, CheckCircle2, ChevronRight, Filter } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { motion } from "framer-motion";

const mockEvaluations = [
  { id: 1, student: "Aarav Sharma", regNo: "24CUS101", subj: "Data Structures", score: 85, aiConfidence: 92, status: "pending", snippet: "The time complexity is O(N log N) because we divide the array in half..." },
  { id: 2, student: "Priya Patel", regNo: "24CUS102", subj: "Data Structures", score: 45, aiConfidence: 65, status: "flagged", plagiarism: 85, snippet: "Merge sort is a divide and conquer algorithm that was invented by John von Neumann in 1945..." },
  { id: 3, student: "Rohan Gupta", regNo: "24CUS105", subj: "Data Structures", score: 95, aiConfidence: 98, status: "pending", snippet: "Space complexity of merge sort is O(N) due to the auxiliary array used during the merge step." },
];

export const EvaluationPage: React.FC = () => {
  const [selectedEval, setSelectedEval] = useState<number | null>(1);

  const selected = mockEvaluations.find(e => e.id === selectedEval);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>Bulk Evaluation Desk</h1>
          <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>Review AI-generated scores, check plagiarism, and finalize grades.</p>
        </div>
        <button className="btn btn-primary shadow-lg flex items-center gap-2">
          <CheckSquare size={16} /> Approve All Pending
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
             <h3 className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>Submissions Queue</h3>
             <button className="p-1 rounded hover:bg-black/5"><Filter size={16} style={{ color: "var(--color-text-muted)" }}/></button>
          </div>
          
          {mockEvaluations.map(ev => (
            <GlassCard 
              key={ev.id} 
              className={`p-4 cursor-pointer transition-all ${selectedEval === ev.id ? 'ring-2 ring-blue-500' : 'hover:scale-[1.02]'}`}
              onClick={() => setSelectedEval(ev.id)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--color-text-primary)" }}>{ev.student}</p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{ev.regNo}</p>
                </div>
                {ev.status === 'flagged' ? (
                  <span className="badge badge-red bg-red-50 text-red-600 flex items-center gap-1"><AlertTriangle size={12}/> Flagged</span>
                ) : (
                  <span className="badge badge-blue bg-blue-50 text-blue-600 flex items-center gap-1"><CheckCircle2 size={12}/> AI Scored</span>
                )}
              </div>
              <div className="flex justify-between items-end mt-4">
                <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Assigned: <strong className="text-lg" style={{ color: "var(--color-brand-blue)" }}>{ev.score}</strong>/100</p>
                <ChevronRight size={16} style={{ color: "var(--color-text-muted)" }}/>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-2">
          {selected ? (
            <GlassCard className="h-full flex flex-col overflow-hidden">
               <div className="p-6 border-b" style={{ borderColor: "var(--color-border)" }}>
                 <div className="flex justify-between items-start">
                   <div>
                     <h2 className="text-xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>{selected.student}</h2>
                     <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{selected.regNo} &bull; {selected.subj}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Suggested AI Score</p>
                      <input 
                        type="number" 
                        defaultValue={selected.score} 
                        className="w-20 text-center font-bold text-xl py-1 rounded-lg border focus:ring-2 outline-none"
                        style={{ color: "var(--color-brand-blue)", borderColor: "var(--color-border)" }}
                      />
                   </div>
                 </div>
               </div>

               <div className="p-6 flex-1 overflow-y-auto space-y-6">
                 {/* Plagiarism Alert */}
                 {selected.plagiarism && (
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl flex items-start gap-4 bg-red-50 border border-red-100">
                     <AlertTriangle className="text-red-500 mt-0.5 shrink-0" />
                     <div>
                       <h4 className="font-bold text-red-800 text-sm">Plagiarism Detected ({selected.plagiarism}%)</h4>
                       <p className="text-red-600 text-xs mt-1">Text sequence heavily matches Wikipedia article: "Merge Sort Algorithm History".</p>
                     </div>
                   </motion.div>
                 )}

                 <div>
                   <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Student Answer</h4>
                   <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: "var(--color-surface-base)", color: "var(--color-text-primary)" }}>
                     "{selected.snippet}"
                   </div>
                 </div>

                 <div>
                   <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>AI Evaluation Breakdown</h4>
                   <div className="space-y-3">
                     <div className="flex items-center justify-between text-sm">
                       <span style={{ color: "var(--color-text-secondary)" }}>Semantic Match</span>
                       <span className="font-bold text-green-600">88%</span>
                     </div>
                     <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-green-500 h-full" style={{ width: '88%' }}></div>
                     </div>
                     
                     <div className="flex items-center justify-between text-sm mt-3">
                       <span style={{ color: "var(--color-text-secondary)" }}>Keyword Coverage (Rubric)</span>
                       <span className="font-bold text-blue-600">75%</span>
                     </div>
                     <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-blue-500 h-full" style={{ width: '75%' }}></div>
                     </div>
                   </div>
                 </div>
               </div>

               <div className="p-6 border-t flex justify-end gap-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: "var(--color-border)" }}>
                  <button className="btn text-red-500 bg-red-50 hover:bg-red-100 border-transparent">Request Rewrite</button>
                  <button className="btn btn-primary shadow-md">Confirm Final Score</button>
               </div>
            </GlassCard>
          ) : (
            <div className="h-full flex items-center justify-center p-6 border-2 border-dashed rounded-3xl" style={{ borderColor: 'var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Select a submission to review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
