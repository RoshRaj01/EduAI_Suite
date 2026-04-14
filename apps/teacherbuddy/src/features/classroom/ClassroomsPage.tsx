import React, { useState } from "react";
import {
  BookOpen, Users, Clock, Plus, Search, ChevronRight,
  Bell, Paperclip, FileText, Video, Link as LinkIcon,
  Star, MoreHorizontal, Calendar, CheckSquare,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const courses = [
  {
    id: 1, code: "CSC401", name: "Advanced Neural Networks",   batch: "2026-A", students: 42,
    nextClass: "Today, 2:00 PM", progress: 68, color: "#264796",
    announcements: 3, resources: 12, description: "Deep learning architectures, training techniques, and real-world applications.",
  },
  {
    id: 2, code: "CSC312", name: "Data Structures & Algorithms", batch: "2025-B", students: 38,
    nextClass: "Today, 10:00 AM", progress: 82, color: "#d0ae61",
    announcements: 1, resources: 24, description: "Fundamental data structures, algorithm analysis, and problem-solving paradigms.",
  },
  {
    id: 3, code: "CSC501", name: "Cloud Computing & DevOps",   batch: "2026-A", students: 35,
    nextClass: "Today, 3:30 PM", progress: 45, color: "#7c3aed",
    announcements: 5, resources: 8,  description: "AWS, GCP, containerization with Docker, Kubernetes, and CI/CD pipelines.",
  },
  {
    id: 4, code: "CSC220", name: "Database Management Systems", batch: "2025-C", students: 50,
    nextClass: "Tomorrow, 8:00 AM", progress: 91, color: "#059669",
    announcements: 0, resources: 18, description: "SQL, NoSQL, normalization, transactions, and query optimization.",
  },
];

const resources = [
  { id: 1, name: "Module 7 — Backpropagation Slides",   type: "pdf",   size: "2.4 MB",  date: "Apr 12" },
  { id: 2, name: "Lecture Recording — Week 11",         type: "video", size: "310 MB",  date: "Apr 10" },
  { id: 3, name: "Assignment 4 — Problem Set",          type: "doc",   size: "420 KB",  date: "Apr 8"  },
  { id: 4, name: "Reading List — Transformer Papers",   type: "link",  size: "",        date: "Apr 5"  },
];

const announcements = [
  { id: 1, title: "Mid-Term Exam Rescheduled",       body: "The CSC401 mid-term has been moved to April 20th. Venue: CS-Lab 3.", time: "2h ago",   pinned: true  },
  { id: 2, title: "Assignment 4 Deadline Extended",  body: "Deadline extended to April 18 due to lab maintenance. Submit on the portal.", time: "Yesterday", pinned: false },
  { id: 3, title: "Guest Lecture: Dr. Anand Kumar",  body: "Distinguished lecture on LLM architectures this Friday at 2 PM, Seminar Hall.", time: "Apr 11",   pinned: false },
];

const typeIcon: Record<string, React.ReactNode> = {
  pdf:   <FileText size={16} className="text-red-500" />,
  video: <Video size={16} className="text-blue-500" />,
  doc:   <FileText size={16} className="text-indigo-500" />,
  link:  <LinkIcon size={16} className="text-green-500" />,
};

export const ClassroomsPage: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [activeTab, setActiveTab] = useState<"announcements" | "resources" | "students">("announcements");
  const [search, setSearch] = useState("");

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
            Classrooms
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
            Manage your courses, resources, and student announcements.
          </p>
        </div>
        <button className="btn btn-primary text-sm">
          <Plus size={15} /> New Classroom
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Course List ─────────────────────── */}
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
              onClick={() => setSelectedCourse(c)}
              className={`glass-card p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                selectedCourse.id === c.id ? "border-l-[#264796] shadow-lg shadow-blue-100" : "border-l-transparent hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>{c.code}</span>
                  <p className="font-semibold text-sm mt-0.5 leading-snug" style={{ color: "var(--color-text-primary)" }}>{c.name}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Batch {c.batch} · {c.students} students
                  </p>
                </div>
                <ChevronRight size={16} className={`shrink-0 mt-1 transition-transform ${selectedCourse.id === c.id ? "text-blue-600 rotate-90" : "text-slate-300"}`} />
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${c.progress}%`, background: `linear-gradient(90deg,${c.color},${c.color}bb)` }} />
                </div>
                <div className="flex items-center justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1"><Clock size={10} /> {c.nextClass}</span>
                  <span className="font-semibold" style={{ color: c.color }}>{c.progress}% complete</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Course Detail ───────────────────── */}
        <div className="xl:col-span-2 space-y-4">
          {/* Header Card */}
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${selectedCourse.color} 0%, ${selectedCourse.color}cc 100%)` }}>
            <div className="p-6 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
              <div className="absolute -right-4 bottom-0 w-24 h-24 rounded-full bg-white/5" />
              <div className="flex items-start justify-between relative">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="badge text-[10px] px-2 py-0.5" style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                      {selectedCourse.code}
                    </span>
                    <span className="badge text-[10px] px-2 py-0.5" style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                      Batch {selectedCourse.batch}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold mb-1">{selectedCourse.name}</h2>
                  <p className="text-white/70 text-sm">{selectedCourse.description}</p>
                </div>
                <button className="btn text-white/80 hover:text-white hover:bg-white/10 p-2">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              {/* Stats Row */}
              <div className="flex gap-6 mt-5 pt-4 border-t border-white/15">
                {[
                  { icon: Users, label: `${selectedCourse.students} Students` },
                  { icon: Bell, label: `${selectedCourse.announcements} Announcements` },
                  { icon: Paperclip, label: `${selectedCourse.resources} Resources` },
                  { icon: Calendar, label: selectedCourse.nextClass },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                    <item.icon size={13} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <GlassCard padding="none">
            <div className="flex border-b" style={{ borderColor: "rgba(38,71,150,0.1)" }}>
              {(["announcements", "resources", "students"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3.5 text-sm font-semibold capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-[#264796] text-[#264796]"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-5">
              {/* Announcements */}
              {activeTab === "announcements" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className="btn btn-primary text-xs">
                      <Plus size={13} /> Post Announcement
                    </button>
                  </div>
                  {announcements.map(a => (
                    <div key={a.id} className="p-4 rounded-xl border transition-colors hover:shadow-sm"
                      style={{ borderColor: "rgba(38,71,150,0.12)", background: a.pinned ? "rgba(38,71,150,0.03)" : "transparent" }}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {a.pinned && <Star size={13} className="text-yellow-500 mt-0.5 shrink-0" />}
                          <div>
                            <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{a.title}</p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{a.body}</p>
                          </div>
                        </div>
                        <span className="text-[10px] shrink-0" style={{ color: "var(--color-text-muted)" }}>{a.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resources */}
              {activeTab === "resources" && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className="btn btn-primary text-xs">
                      <Plus size={13} /> Upload Resource
                    </button>
                  </div>
                  {resources.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer hover:shadow-sm transition-all group"
                      style={{ borderColor: "rgba(38,71,150,0.1)" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: "rgba(38,71,150,0.07)" }}>
                        {typeIcon[r.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate group-hover:text-blue-700 transition-colors" style={{ color: "var(--color-text-primary)" }}>
                          {r.name}
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                          {r.size && <>{r.size} · </>}{r.date}
                        </p>
                      </div>
                      <ChevronRight size={15} className="text-slate-300 group-hover:text-blue-500 shrink-0 transition-colors" />
                    </div>
                  ))}
                </div>
              )}

              {/* Students */}
              {activeTab === "students" && (
                <div className="space-y-2">
                  {Array.from({ length: 6 }, (_, i) => ({
                    name: ["Arjun Mehta", "Priya Sharma", "Rohan Verma", "Sneha Patil", "Kiran Nair", "Anjali Singh"][i],
                    roll: `2226CSC${100 + i}`,
                    attendance: [42, 88, 76, 91, 65, 95][i],
                    avgScore: [58, 72, 56, 81, 69, 93][i],
                  })).map(s => (
                    <div key={s.roll} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg,#264796,#3460c4)" }}>
                        {s.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{s.roll}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-center">
                          <p className="font-bold" style={{ color: s.attendance < 75 ? "#dc2626" : "#16a34a" }}>{s.attendance}%</p>
                          <p style={{ color: "var(--color-text-muted)" }}>Attendance</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>{s.avgScore}%</p>
                          <p style={{ color: "var(--color-text-muted)" }}>Avg Score</p>
                        </div>
                      </div>
                      <span className={`badge text-[9px] px-2 ${s.attendance < 75 ? "badge-red" : "badge-green"}`}>
                        {s.attendance < 75 ? "At Risk" : "Good"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
