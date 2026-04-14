import React from "react";
import { FileSignature, Sparkles, Wand2 } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { useTheme } from "../../shared/hooks/useTheme";

const mockForms = [
  { id: 1, name: "Semester Grade Submission Form", desc: "Auto-fills student names, register numbers, and final AI-confirmed scores." },
  { id: 2, name: "Risk Intervention Approval", desc: "Generates an intervention request pre-filled with the risk analytics data." },
  { id: 3, name: "Syllabus Compliance Report", desc: "Cross-references your lesson planner against the standard syllabus." },
];

export const FormsPage: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>Form Automation</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          Reduce administrative burden. The AI Form Filler extracts data from your classrooms, attendance, and evaluation records to instantly populate standard academic forms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockForms.map(form => (
          <GlassCard key={form.id} className="p-6 flex flex-col items-start gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg">
                <FileSignature size={24} />
             </div>
             <div>
               <h3 className="font-bold text-lg mb-1" style={{ color: "var(--color-text-primary)" }}>{form.name}</h3>
               <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{form.desc}</p>
             </div>
             
             <div className="mt-auto w-full pt-4">
                <button className="w-full btn bg-blue-50/50 hover:bg-blue-100/50 border text-blue-600 border-blue-200/50 flex items-center justify-center gap-2">
                   <Sparkles size={16} /> Auto-Fill
                </button>
             </div>
          </GlassCard>
        ))}

        {/* Custom Form Block */}
        <div className="p-1 rounded-3xl" style={{ background: "linear-gradient(135deg,rgba(208,174,97,0.4),rgba(38,71,150,0.4))" }}>
          <div className="w-full h-full p-6 rounded-[22px] flex flex-col items-center justify-center text-center space-y-4" style={{ background: "var(--color-surface-base)" }}>
             <Wand2 size={40} style={{ color: "var(--color-brand-gold)" }} />
             <div>
               <h3 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>Upload Custom Form</h3>
               <p className="text-sm px-4 mt-1" style={{ color: "var(--color-text-secondary)" }}>Upload a blank PDF and let the AI figure out what to fill based on your context.</p>
             </div>
             <button className="btn btn-primary px-8 shadow-[0_4px_15px_rgba(208,174,97,0.3)]">Upload PDF</button>
          </div>
        </div>
      </div>
    </div>
  );
};
