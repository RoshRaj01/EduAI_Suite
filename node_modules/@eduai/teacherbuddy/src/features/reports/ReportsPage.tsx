import React from "react";
import { FileSpreadsheet, Download, RefreshCw, Send, Users } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { useTheme } from "../../shared/hooks/useTheme";

const mockReports = [
  { id: 'RC-101', name: 'End Semester Performance - CSE Batch A', type: 'Class Report', date: 'Oct 24, 2026', status: 'ready' },
  { id: 'RS-402', name: 'Parent-Ready Report: Aarav Sharma', type: 'Student Report', date: 'Oct 26, 2026', status: 'generating' },
  { id: 'RC-102', name: 'Risk Analytics Summary - Q3', type: 'Analytics Export', date: 'Oct 28, 2026', status: 'ready' },
];

export const ReportsPage: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>Report Generation Center</h1>
          <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>Automated, AI-filled academic reports ready for parents and administration.</p>
        </div>
        <button className="btn btn-primary shadow-lg flex items-center gap-2">
          <FileSpreadsheet size={16} /> New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
           <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mb-4"><Users size={20}/></div>
           <h3 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Class-Level Reports</h3>
           <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Generate aggregated performance stats.</p>
           <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Generate &rarr;</button>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600 mb-4"><FileSpreadsheet size={20}/></div>
           <h3 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Parent-Ready Auto Reports</h3>
           <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>AI summarizes student strengths & weaknesses.</p>
           <button className="text-sm font-semibold text-green-600 hover:text-green-700">Generate &rarr;</button>
        </GlassCard>

        <GlassCard className="p-6">
           <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 mb-4"><RefreshCw size={20}/></div>
           <h3 className="font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>Scheduled Exports</h3>
           <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Manage automated weekly/monthly exports.</p>
           <button className="text-sm font-semibold text-purple-600 hover:text-purple-700">Configure &rarr;</button>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden mt-6">
        <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>Recent Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead style={{ background: "rgba(0,0,0,0.02)", color: "var(--color-text-secondary)" }}>
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Report Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Generated</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {mockReports.map(rep => (
                <tr key={rep.id} className="hover:bg-black/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{rep.id}</td>
                  <td className="px-6 py-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>
                     <div className="flex items-center gap-2">
                       {rep.status === 'generating' && <RefreshCw size={14} className="animate-spin text-blue-500" />}
                       {rep.name}
                     </div>
                  </td>
                  <td className="px-6 py-4" style={{ color: "var(--color-text-secondary)" }}>{rep.type}</td>
                  <td className="px-6 py-4" style={{ color: "var(--color-text-secondary)" }}>{rep.date}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button disabled={rep.status !== 'ready'} className="text-gray-500 hover:text-blue-600 disabled:opacity-30"><Download size={16}/></button>
                    <button disabled={rep.status !== 'ready'} className="text-gray-500 hover:text-green-600 disabled:opacity-30"><Send size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
