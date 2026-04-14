import React, { useState } from "react";
import {
  BarChart3, TrendingUp, AlertTriangle, Users, Download,
  ChevronDown, Filter, RefreshCw, Activity, ArrowUp, ArrowDown,
  BrainCircuit, Eye, Info,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

/* ─── Mock Data ──────────────────────────────────────── */
const classrooms = ["CSC401 — Neural Networks", "CSC312 — DSA", "CSC501 — Cloud DevOps", "CSC220 — DBMS"];

const performanceTrend = [
  { month: "Nov", avg: 62 }, { month: "Dec", avg: 58 }, { month: "Jan", avg: 65 },
  { month: "Feb", avg: 70 }, { month: "Mar", avg: 74 }, { month: "Apr", avg: 78 },
];

const riskStudents = [
  { id: "S4121", name: "Arjun Mehta",    attendance: 42, avgScore: 48, assignments: 60, risk: 82, level: "high"     },
  { id: "S4122", name: "Priya Sharma",   attendance: 55, avgScore: 52, assignments: 70, risk: 74, level: "high"     },
  { id: "S4109", name: "Rohan Verma",    attendance: 68, avgScore: 61, assignments: 55, risk: 58, level: "moderate" },
  { id: "S4135", name: "Sneha Patil",    attendance: 71, avgScore: 65, assignments: 75, risk: 51, level: "moderate" },
  { id: "S4140", name: "Kiran Nair",     attendance: 80, avgScore: 72, assignments: 85, risk: 28, level: "low"      },
  { id: "S4147", name: "Anjali Singh",   attendance: 95, avgScore: 88, assignments: 100,risk: 8,  level: "low"      },
];

const subjectBreakdown = [
  { subject: "Neural Networks", avg: 71, highest: 95, lowest: 38, submitted: 42 },
  { subject: "DSA",             avg: 76, highest: 98, lowest: 42, submitted: 38 },
  { subject: "Cloud DevOps",    avg: 68, highest: 91, lowest: 31, submitted: 30 },
  { subject: "DBMS",            avg: 82, highest: 100,lowest: 55, submitted: 50 },
];

/* ─── Mini Bar Chart ─────────────────────────────────── */
const MiniBar: React.FC<{ data: { month: string; avg: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map(d => d.avg));
  return (
    <div className="flex items-end gap-2 h-28 pt-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md transition-all duration-700"
            style={{
              height: `${(d.avg / max) * 100}%`,
              background: i === data.length - 1
                ? "linear-gradient(180deg,#264796,#3460c4)"
                : "rgba(38,71,150,0.2)",
            }}
            title={`${d.avg}%`}
          />
          <span className="text-[10px] font-medium" style={{ color: "var(--color-text-muted)" }}>{d.month}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── Risk Heatmap Cell ──────────────────────────────── */
const RiskCell: React.FC<{ value: number; label: string }> = ({ value, label }) => {
  const color = value >= 75 ? "#dc2626" : value >= 50 ? "#d97706" : "#16a34a";
  const bg    = value >= 75 ? "rgba(220,38,38,0.09)" : value >= 50 ? "rgba(217,119,6,0.09)" : "rgba(22,163,74,0.09)";
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110 cursor-pointer"
        style={{ background: bg, color, border: `1.5px solid ${color}30` }}
        title={`${label}: ${value}`}
      >
        {value}
      </div>
      <span className="text-[9px] text-center leading-tight" style={{ color: "var(--color-text-muted)", maxWidth: 36 }}>{label}</span>
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState(classrooms[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "risk" | "subjects">("overview");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2200);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Analytics & Risk Intelligence
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            AI-powered student performance insights and early-warning risk detection.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <select
              className="form-input text-sm pr-8 appearance-none cursor-pointer bg-white"
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
            >
              {classrooms.map(c => <option key={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
          </div>
          <button className="btn btn-outline text-sm gap-1.5">
            <Filter size={13} /> Filter
          </button>
          <button className="btn btn-primary text-sm gap-1.5" onClick={handleGenerate} disabled={generating}>
            {generating
              ? <><RefreshCw size={13} className="animate-spin" /> Generating…</>
              : <><Download size={13} /> Export Report</>
            }
          </button>
        </div>
      </div>

      {generated && (
        <div className="p-3 rounded-xl flex items-center gap-2 animate-fade-in"
          style={{ background: "rgba(22,163,74,0.1)", border: "1px solid rgba(22,163,74,0.2)" }}>
          <Activity size={14} className="text-green-600" />
          <p className="text-sm text-green-700 font-semibold">Report generated! Download started for <strong>{selectedClass}</strong>.</p>
        </div>
      )}

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Class Average",     value: "74%",  delta: "+4%", up: true,  color: "#264796" },
          { label: "Attendance Rate",   value: "81%",  delta: "+2%", up: true,  color: "#16a34a" },
          { label: "At-Risk Students",  value: "4",    delta: "+1",  up: false, color: "#dc2626" },
          { label: "AI Confidence Avg", value: "82%",  delta: "+6%", up: true,  color: "#d0ae61" },
        ].map(kpi => (
          <GlassCard key={kpi.label} padding="sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>{kpi.label}</p>
              <span className={`badge text-[9px] px-1.5 py-0.5 flex items-center gap-0.5 ${kpi.up ? "badge-green" : "badge-red"}`}>
                {kpi.up ? <ArrowUp size={8} /> : <ArrowDown size={8} />}
                {kpi.delta}
              </span>
            </div>
            <p className="text-2xl font-black" style={{ color: kpi.color, fontFamily: "var(--font-display)" }}>{kpi.value}</p>
          </GlassCard>
        ))}
      </div>

      {/* Tabs */}
      <GlassCard padding="none">
        <div className="flex border-b" style={{ borderColor: "rgba(38,71,150,0.1)" }}>
          {(["overview", "risk", "subjects"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3.5 text-sm font-semibold capitalize transition-colors ${
                activeTab === tab ? "border-b-2 border-[#264796] text-[#264796]" : "text-slate-400 hover:text-slate-600"
              }`}>
              {tab === "risk" ? "Risk Heatmap" : tab === "subjects" ? "Subject Breakdown" : "Overview"}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>Score Trend (6 Months)</p>
                    <span className="badge badge-blue text-[10px]">+14% improvement</span>
                  </div>
                  <MiniBar data={performanceTrend} />
                </div>

                {/* Distribution Donut (CSS-only approximation) */}
                <div>
                  <p className="font-semibold text-sm mb-3" style={{ color: "var(--color-text-primary)" }}>Grade Distribution</p>
                  <div className="space-y-2.5">
                    {[
                      { grade: "O (90–100%)", pct: 12, color: "#264796" },
                      { grade: "A+ (80–89%)", pct: 28, color: "#3460c4" },
                      { grade: "A (70–79%)",  pct: 31, color: "#d0ae61" },
                      { grade: "B+ (60–69%)", pct: 18, color: "#d97706" },
                      { grade: "Below 60%",   pct: 11, color: "#dc2626" },
                    ].map(g => (
                      <div key={g.grade} className="flex items-center gap-3">
                        <span className="text-xs w-28 shrink-0" style={{ color: "var(--color-text-secondary)" }}>{g.grade}</span>
                        <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: "rgba(38,71,150,0.07)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                            style={{ width: `${g.pct}%`, background: g.color }}
                          >
                            <span className="text-[9px] text-white font-bold">{g.pct}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Assignments Submitted", value: "87%", color: "#264796" },
                  { label: "Quiz Participation",    value: "92%", color: "#16a34a" },
                  { label: "Resource Downloads",    value: "634", color: "#d0ae61" },
                ].map(m => (
                  <div key={m.label} className="p-4 rounded-xl text-center"
                    style={{ background: "rgba(38,71,150,0.04)", border: "1px solid rgba(38,71,150,0.1)" }}>
                    <p className="text-2xl font-black mb-1" style={{ color: m.color, fontFamily: "var(--font-display)" }}>{m.value}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Risk Heatmap Tab ── */}
          {activeTab === "risk" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                style={{ background: "rgba(38,71,150,0.05)", border: "1px solid rgba(38,71,150,0.12)" }}>
                <Info size={14} style={{ color: "var(--color-brand-blue)", flexShrink: 0 }} />
                <p style={{ color: "var(--color-text-secondary)" }}>
                  Risk scores are computed daily at 02:00 AM using AI-weighted factors: attendance, marks, and assignment completion.
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                {[{ l: "Low (0–49)", c: "#16a34a", bg: "rgba(22,163,74,0.1)" },
                  { l: "Moderate (50–74)", c: "#d97706", bg: "rgba(217,119,6,0.1)" },
                  { l: "High (75–100)", c: "#dc2626", bg: "rgba(220,38,38,0.1)" }].map(x => (
                  <span key={x.l} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: x.c }} />
                    <span style={{ color: "var(--color-text-secondary)" }}>{x.l}</span>
                  </span>
                ))}
              </div>

              {/* Student Risk Rows */}
              <div className="space-y-2">
                {riskStudents.map(s => (
                  <div key={s.id}>
                    <div
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:shadow-sm transition-all"
                      style={{ border: "1px solid rgba(38,71,150,0.1)", background: "rgba(255,255,255,0.6)" }}
                      onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}
                    >
                      {/* Avatar */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        s.level === "high" ? "bg-red-100 text-red-700" :
                        s.level === "moderate" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{s.id}</p>
                      </div>
                      {/* Heatmap Cells */}
                      <div className="flex gap-2">
                        <RiskCell value={100 - s.attendance} label="Absent" />
                        <RiskCell value={100 - s.avgScore}   label="Marks"  />
                        <RiskCell value={100 - s.assignments} label="Assign" />
                      </div>
                      {/* Overall Risk */}
                      <div className="text-center w-16 shrink-0">
                        <p className={`text-lg font-black ${
                          s.level === "high" ? "text-red-600" : s.level === "moderate" ? "text-orange-600" : "text-green-600"
                        }`} style={{ fontFamily: "var(--font-display)" }}>
                          {s.risk}
                        </p>
                        <span className={`badge text-[9px] px-1.5 ${
                          s.level === "high" ? "badge-red" : s.level === "moderate" ? "badge-orange" : "badge-green"
                        }`}>
                          {s.level}
                        </span>
                      </div>
                      <Eye size={15} className="text-slate-300 shrink-0" />
                    </div>

                    {/* Drill-down */}
                    {expandedStudent === s.id && (
                      <div className="ml-12 p-4 rounded-xl mt-1 animate-fade-in space-y-3"
                        style={{ background: "rgba(38,71,150,0.04)", border: "1px solid rgba(38,71,150,0.1)" }}>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          {[
                            { l: "Attendance", v: `${s.attendance}%`, ok: s.attendance >= 75 },
                            { l: "Avg Score",  v: `${s.avgScore}%`,   ok: s.avgScore >= 50  },
                            { l: "Assignments",v: `${s.assignments}%`, ok: s.assignments >= 70},
                          ].map(item => (
                            <div key={item.l} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.7)" }}>
                              <p className="text-lg font-bold" style={{ color: item.ok ? "#16a34a" : "#dc2626", fontFamily: "var(--font-display)" }}>{item.v}</p>
                              <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{item.l}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button className="btn btn-primary text-xs flex-1">Contact Student</button>
                          <button className="btn btn-outline text-xs flex-1">Schedule Meeting</button>
                          <button className="btn btn-ghost text-xs flex-1">View Full Profile</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button className="btn btn-gold w-full text-sm py-3 font-bold" onClick={handleGenerate} disabled={generating}>
                <BrainCircuit size={15} />
                {generating ? "Running AI Analysis…" : "Run Global AI Risk Analysis"}
              </button>
            </div>
          )}

          {/* ── Subject Breakdown Tab ── */}
          {activeTab === "subjects" && (
            <div className="space-y-4">
              {subjectBreakdown.map(sub => (
                <div key={sub.subject} className="p-4 rounded-xl"
                  style={{ border: "1px solid rgba(38,71,150,0.1)", background: "rgba(255,255,255,0.6)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{sub.subject}</p>
                    <span className="badge badge-blue text-xs">Avg: {sub.avg}%</span>
                  </div>
                  <div className="relative h-6 rounded-full overflow-hidden mb-2"
                    style={{ background: "rgba(38,71,150,0.08)" }}>
                    {/* Range bar */}
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left: `${sub.lowest}%`,
                        width: `${sub.highest - sub.lowest}%`,
                        background: "linear-gradient(90deg,rgba(220,38,38,0.3),rgba(38,71,150,0.5),rgba(22,163,74,0.3))",
                      }}
                    />
                    {/* Avg marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#264796]"
                      style={{ left: `${sub.avg}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    <span>Lowest: <strong style={{ color: "#dc2626" }}>{sub.lowest}%</strong></span>
                    <span>Students: <strong>{sub.submitted}</strong></span>
                    <span>Highest: <strong style={{ color: "#16a34a" }}>{sub.highest}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};
