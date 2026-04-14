import React, { useState } from "react";
import {
  Users, Clock, Plus, Search, ChevronRight, BookOpen,
  FileText, BarChart2, CheckCircle2, AlertCircle,
  Calendar, MoreVertical, TrendingUp, X, ClipboardList,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

/* ─── Mock Data (mirrors edugames StudentClassrooms) ─────────────────── */

const classrooms = [
  {
    id: "csc401",
    code: "CSC401",
    name: "Advanced Neural Networks",
    batch: "Batch 2026-A",
    students: 42,
    nextClass: "Today, 2:00 PM",
    progress: 68,
    color: "#264796",
    description: "Deep learning architectures, backpropagation, CNNs, RNNs, and transformer models.",
  },
  {
    id: "csc312",
    code: "CSC312",
    name: "Data Structures & Algorithms",
    batch: "Batch 2025-B",
    students: 38,
    nextClass: "Tomorrow, 10:00 AM",
    progress: 82,
    color: "#d0ae61",
    description: "Fundamental and advanced data structures, algorithm design, and complexity analysis.",
  },
  {
    id: "csc501",
    code: "CSC501",
    name: "Cloud Computing & DevOps",
    batch: "Batch 2026-A",
    students: 35,
    nextClass: "Wed, 3:30 PM",
    progress: 45,
    color: "#16a34a",
    description: "Cloud service models, containerization, CI/CD pipelines, and infrastructure as code.",
  },
  {
    id: "csc220",
    code: "CSC220",
    name: "Database Management Systems",
    batch: "Batch 2025-C",
    students: 50,
    nextClass: "Thu, 8:00 AM",
    progress: 91,
    color: "#7c3aed",
    description: "Relational databases, SQL, normalization, indexing, and distributed databases.",
  },
];

const assignments = [
  { id: 1, classCode: "CSC401", name: "Lab 4: Backpropagation",            due: "Tonight, 11:59 PM", submitted: 28, total: 42, status: "active"   },
  { id: 2, classCode: "CSC312", name: "Assignment 2: AVL Trees",           due: "Tomorrow",          submitted: 38, total: 38, status: "completed"},
  { id: 3, classCode: "CSC501", name: "Docker Compose Lab",                due: "Apr 18, 2026",      submitted: 12, total: 35, status: "active"   },
  { id: 4, classCode: "CSC401", name: "Mid-Term: Neural Networks",         due: "Apr 10, 2026",      submitted: 42, total: 42, status: "graded"   },
  { id: 5, classCode: "CSC220", name: "Normalization Exercise",            due: "Apr 20, 2026",      submitted: 0,  total: 50, status: "upcoming" },
];

const topStudents = [
  { name: "Arjun Mehta",   roll: "S4121", avg: 94, attendance: 97, trend: "up"   },
  { name: "Sneha Patil",   roll: "S4135", avg: 91, attendance: 95, trend: "up"   },
  { name: "Priya Sharma",  roll: "S4122", avg: 88, attendance: 89, trend: "down" },
  { name: "Rohan Verma",   roll: "S4109", avg: 85, attendance: 78, trend: "up"   },
  { name: "Kavya Nair",    roll: "S4140", avg: 82, attendance: 92, trend: "up"   },
];

/* ─── Component ──────────────────────────────────────────────────────── */

export const ClassroomsPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState(classrooms[0].id);
  const [search, setSearch] = useState("");
  const [showNewClassroom, setShowNewClassroom] = useState(false);
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [activeTab, setActiveTab] = useState<"assignments" | "students" | "analytics">("assignments");

  const selected = classrooms.find(c => c.id === selectedId)!;
  const filtered = classrooms.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) ||
         c.code.toLowerCase().includes(search.toLowerCase()),
  );
  const classAssignments = assignments.filter(a => a.classCode === selected.code);

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    active:    { bg: "rgba(37,99,235,0.1)",  text: "#2563eb", label: "Active"    },
    completed: { bg: "rgba(22,163,74,0.1)",  text: "#16a34a", label: "Completed" },
    graded:    { bg: "rgba(124,58,237,0.1)", text: "#7c3aed", label: "Graded"    },
    upcoming:  { bg: "rgba(208,174,97,0.12)", text: "#d0ae61", label: "Upcoming"  },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
          >
            Classroom Management
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Manage courses, assignments, and monitor student progress across all your classrooms.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-outline text-xs"
            onClick={() => setShowNewAssignment(true)}
          >
            <ClipboardList size={14} /> Add Assignment
          </button>
          <button
            className="btn btn-primary text-xs"
            onClick={() => setShowNewClassroom(true)}
          >
            <Plus size={14} /> Create Classroom
          </button>
        </div>
      </div>

      {/* ── Summary Stats ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Classrooms", value: classrooms.length, icon: BookOpen, color: "#264796", bg: "rgba(38,71,150,0.1)" },
          { label: "Total Students",   value: classrooms.reduce((s, c) => s + c.students, 0), icon: Users, color: "#d0ae61", bg: "rgba(208,174,97,0.12)" },
          { label: "Active Assignments", value: assignments.filter(a => a.status === "active").length, icon: ClipboardList, color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
          { label: "Avg. Progress",    value: `${Math.round(classrooms.reduce((s, c) => s + c.progress, 0) / classrooms.length)}%`, icon: TrendingUp, color: "#16a34a", bg: "rgba(22,163,74,0.1)" },
        ].map(stat => (
          <GlassCard key={stat.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon size={18} style={{ color: stat.color }} />
              </div>
            </div>
            <p className="stat-number text-xl">{stat.value}</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* ── Main Content Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left — Course List */}
        <div className="space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-9 text-sm"
              placeholder="Search courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`glass-card p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                selectedId === c.id
                  ? "shadow-lg"
                  : "border-l-transparent hover:shadow-md"
              }`}
              style={{
                borderLeftColor: selectedId === c.id ? c.color : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: c.color }}>{c.code}</span>
                  <p className="font-semibold text-sm mt-0.5" style={{ color: "var(--color-text-primary)" }}>{c.name}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    {c.batch} · {c.students} students
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className={`mt-1 transition-transform ${selectedId === c.id ? "rotate-90" : ""}`}
                  style={{ color: selectedId === c.id ? c.color : "var(--color-text-muted)" }}
                />
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${c.progress}%`,
                      background: `linear-gradient(90deg,${c.color},${c.color}bb)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Clock size={10} /> {c.nextClass}</span>
                  <span className="font-semibold" style={{ color: c.color }}>{c.progress}% complete</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right — Course Detail */}
        <div className="xl:col-span-2 space-y-4">

          {/* Detail Header */}
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${selected.color} 0%, ${selected.color}cc 100%)` }}
          >
            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
            <div className="absolute -right-4 -bottom-10 w-28 h-28 rounded-full bg-white/5" />
            <div className="p-6 text-white relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{selected.code}</span>
                  <h2 className="text-xl font-bold mt-0.5">{selected.name}</h2>
                  <p className="text-sm opacity-80 mt-1 max-w-lg">{selected.description}</p>
                </div>
                <button className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-5 mt-5 text-xs">
                <div className="flex items-center gap-1.5"><Users size={14} /> {selected.students} Students</div>
                <div className="flex items-center gap-1.5"><ClipboardList size={14} /> {classAssignments.length} Assignments</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} /> {selected.nextClass}</div>
                <div className="flex items-center gap-1.5"><BarChart2 size={14} /> {selected.progress}% Progress</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <GlassCard padding="none">
            <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
              {(["assignments", "students", "analytics"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2"
                      : ""
                  }`}
                  style={{
                    borderColor: activeTab === tab ? selected.color : "transparent",
                    color: activeTab === tab ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5">

              {/* Assignments Tab */}
              {activeTab === "assignments" && (
                <div className="space-y-3">
                  {classAssignments.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList size={40} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
                      <p className="font-semibold" style={{ color: "var(--color-text-secondary)" }}>No assignments yet</p>
                      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                        Click "Add Assignment" to create one for this class.
                      </p>
                    </div>
                  ) : (
                    classAssignments.map(a => {
                      const sc = statusColors[a.status];
                      const pct = Math.round((a.submitted / a.total) * 100);
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-4 p-4 rounded-xl border transition-colors cursor-pointer"
                          style={{ borderColor: "var(--color-border)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-grad1)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: sc.bg }}>
                            {a.status === "completed" || a.status === "graded"
                              ? <CheckCircle2 size={18} style={{ color: sc.text }} />
                              : a.status === "upcoming"
                                ? <Calendar size={18} style={{ color: sc.text }} />
                                : <FileText size={18} style={{ color: sc.text }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{a.name}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                              Due: {a.due} · {a.submitted}/{a.total} submitted ({pct}%)
                            </p>
                            <div className="progress-bar mt-2">
                              <div className="progress-fill" style={{ width: `${pct}%`, background: sc.text }} />
                            </div>
                          </div>
                          <span
                            className="badge text-[10px] px-2.5 py-1 rounded-full font-bold shrink-0"
                            style={{ background: sc.bg, color: sc.text }}
                          >
                            {sc.label}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Students Tab */}
              {activeTab === "students" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                      Showing top performers in {selected.code}
                    </p>
                    <span className="badge badge-blue text-[10px]">{selected.students} enrolled</span>
                  </div>
                  {topStudents.map((s, i) => (
                    <div
                      key={s.roll}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-colors"
                      style={{ borderColor: "var(--color-border)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--color-bg-grad1)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: `linear-gradient(135deg,${selected.color},${selected.color}bb)` }}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.roll} · Attendance: {s.attendance}%</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm" style={{ color: selected.color }}>{s.avg}%</p>
                        <div className="flex items-center gap-0.5 justify-end">
                          <TrendingUp
                            size={11}
                            style={{
                              color: s.trend === "up" ? "#16a34a" : "#dc2626",
                              transform: s.trend === "down" ? "scaleY(-1)" : undefined,
                            }}
                          />
                          <span className="text-[9px] font-semibold" style={{ color: s.trend === "up" ? "#16a34a" : "#dc2626" }}>
                            {s.trend === "up" ? "Rising" : "Falling"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-5">
                  {/* Progress overview */}
                  <div>
                    <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-muted)" }}>Course Completion by Section</p>
                    <div className="space-y-3">
                      {[
                        { section: "Lectures Delivered",      pct: selected.progress, color: selected.color },
                        { section: "Assignments Completed",   pct: Math.min(selected.progress + 10, 100), color: "#2563eb" },
                        { section: "Lab Sessions Completed",  pct: Math.max(selected.progress - 15, 20), color: "#d0ae61" },
                        { section: "Students Above 75%",      pct: 72, color: "#16a34a" },
                      ].map(row => (
                        <div key={row.section}>
                          <div className="flex justify-between text-xs mb-1">
                            <span style={{ color: "var(--color-text-secondary)" }}>{row.section}</span>
                            <span className="font-bold" style={{ color: row.color }}>{row.pct}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${row.pct}%`, background: row.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Avg. Score", value: "78%", icon: BarChart2, color: selected.color },
                      { label: "At-Risk",    value: "4",   icon: AlertCircle, color: "#dc2626" },
                      { label: "Attendance", value: "89%", icon: Users, color: "#16a34a" },
                    ].map(q => (
                      <div
                        key={q.label}
                        className="p-3 rounded-xl border text-center"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <q.icon size={18} className="mx-auto mb-1.5" style={{ color: q.color }} />
                        <p className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>{q.value}</p>
                        <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{q.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Create Classroom Modal ───────────────────────────── */}
      {showNewClassroom && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in">
          <GlassCard className="w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowNewClassroom(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
              Create New Classroom
            </h3>
            <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
              Fill in the details to set up a new course.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Course Code</label>
                <input className="form-input text-sm" placeholder="e.g. CSC601" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Course Name</label>
                <input className="form-input text-sm" placeholder="e.g. Machine Learning Fundamentals" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Batch</label>
                  <input className="form-input text-sm" placeholder="e.g. 2026-A" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Max Students</label>
                  <input className="form-input text-sm" type="number" placeholder="50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Description</label>
                <textarea className="form-input text-sm" rows={3} placeholder="Brief course description..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button className="btn btn-outline text-xs" onClick={() => setShowNewClassroom(false)}>Cancel</button>
              <button className="btn btn-primary text-xs" onClick={() => setShowNewClassroom(false)}>
                <Plus size={14} /> Create Classroom
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ── Add Assignment Modal ─────────────────────────────── */}
      {showNewAssignment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 animate-fade-in">
          <GlassCard className="w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowNewAssignment(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
              Add New Assignment
            </h3>
            <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
              Create and assign work to a specific classroom.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Classroom</label>
                <select className="form-input text-sm">
                  {classrooms.map(c => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Assignment Title</label>
                <input className="form-input text-sm" placeholder="e.g. Lab 5: Convolutional Networks" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Due Date</label>
                  <input className="form-input text-sm" type="date" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Max Marks</label>
                  <input className="form-input text-sm" type="number" placeholder="100" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1 block" style={{ color: "var(--color-text-secondary)" }}>Instructions</label>
                <textarea className="form-input text-sm" rows={3} placeholder="Assignment instructions and guidelines..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button className="btn btn-outline text-xs" onClick={() => setShowNewAssignment(false)}>Cancel</button>
              <button className="btn btn-primary text-xs" onClick={() => setShowNewAssignment(false)}>
                <ClipboardList size={14} /> Create Assignment
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};