import React, { useState } from "react";
import { Sparkles, BrainCircuit, Lightbulb, BookOpen, Clock, RefreshCw, CheckCircle } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const tools = [
  { id: 'generator', title: 'Smart Question Generator', desc: 'AI generates MCQs, Case studies, and Coding questions instantly.', icon: BrainCircuit, color: 'text-blue-500', bg: 'bg-blue-100/50' },
  { id: 'planner', title: 'Auto Lesson Planner', desc: 'Input a syllabus topic, get a structured flow with activities and quizzes.', icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-100/50' },
  { id: 'intervention', title: 'Intervention Planner', desc: 'Get AI-suggested actions and extra tasks for at-risk students.', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-100/50' }
];

export const TeacherToolsPage: React.FC = () => {
  const [selectedTool, setSelectedTool] = useState<string>('generator');
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setResult(null);
    setTimeout(() => {
      setIsGenerating(false);
      if (selectedTool === 'generator') {
        setResult("Generated 5 MCQs and 1 Case Study for '" + topic + "'.\n\nQ1: What is the primary advantage of...");
      } else {
        setResult("Lesson Plan for '" + topic + "':\n\n1. Introduction (5m)\n2. Core Concepts (15m)\n3. Activity: Interactive Mentimeter Poll (10m)\n4. Summary & Q&A (10m)");
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>AI Teaching Tools</h1>
        <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>Accelerate your prep time with generative AI.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tools.map(tool => (
           <GlassCard 
             key={tool.id} 
             className={`p-5 cursor-pointer transition-all hover:-translate-y-1 ${selectedTool === tool.id ? 'ring-2 ring-blue-500' : ''}`}
             onClick={() => setSelectedTool(tool.id)}
           >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${tool.bg} ${tool.color}`}>
                 <tool.icon size={20} />
              </div>
              <h3 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>{tool.title}</h3>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{tool.desc}</p>
           </GlassCard>
        ))}
      </div>

      {/* Tool Workspace */}
      <GlassCard className="p-6">
         <h2 className="text-lg font-bold mb-4 font-display" style={{ color: "var(--color-text-primary)" }}>
           {tools.find(t => t.id === selectedTool)?.title} Workspace
         </h2>

         <div className="space-y-4 max-w-2xl">
           <div>
             <label className="text-sm font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Topic or Syllabus Keyword</label>
             <input 
               type="text" 
               className="form-input w-full p-3 rounded-lg"
               placeholder="e.g., Recursion in C++, The French Revolution, Quantum Computing..."
               value={topic}
               onChange={(e) => setTopic(e.target.value)}
               style={{ background: "var(--color-surface-base)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
             />
           </div>

           <button 
             onClick={handleGenerate}
             disabled={!topic || isGenerating}
             className="btn btn-primary shadow flex items-center gap-2"
           >
             {isGenerating ? <Clock size={16} className="animate-spin" /> : <Sparkles size={16} />} 
             {isGenerating ? "Processing via Python AI..." : "Generate Insights"}
           </button>
         </div>

         {result && (
           <div className="mt-6 p-5 rounded-xl border" style={{ background: "var(--color-surface-base)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
              <div className="flex items-center gap-2 mb-3">
                 <BrainCircuit size={18} className="text-blue-500" />
                 <h4 className="font-bold text-sm">AI Output</h4>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {result}
              </pre>
           </div>
         )}
      </GlassCard>

      {/* Academic Bridge - Isolated Sync */}
      <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center text-white shadow-lg">
              <RefreshCw size={24} />
           </div>
           <div>
              <h2 className="text-xl font-black font-display" style={{ color: "var(--color-text-primary)" }}>Academic Bridge</h2>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Securely push interactive session data to TeacherBuddy Admin.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <GlassCard className="p-6 border-l-4 border-l-blue-500">
              <h4 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--color-text-primary)" }}>
                <CheckCircle size={16} className="text-blue-500" /> Ready to Synchronize
              </h4>
              <div className="space-y-3">
                 {[
                   { id: 1, type: "Attendance", source: "Live Quiz #401", students: 42, date: "Today 10:15 AM" },
                   { id: 2, type: "Game Results", source: "Mid-Term Battle", students: 38, date: "Yesterday" }
                 ].map(sync => (
                   <div key={sync.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-grad1)' }}>
                      <div>
                         <p className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>{sync.type}: {sync.source}</p>
                         <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{sync.students} Records &bull; {sync.date}</p>
                      </div>
                      <button className="text-xs font-bold text-blue-600 hover:text-blue-500">Sync &rarr;</button>
                   </div>
                 ))}
              </div>
           </GlassCard>

           <div className="p-6 rounded-3xl bg-slate-50 border border-dashed flex flex-col items-center justify-center text-center space-y-4" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Your administrative portal (TeacherBuddy) is strictly isolated for security. 
                Use this bridge to push attendance and game scores only when you are ready to finalize grades.
              </p>
              <div className="flex gap-4">
                 <button className="btn btn-ghost text-xs">Download CSV Export</button>
                 <button className="btn btn-primary px-8">Sync All Active Records</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
