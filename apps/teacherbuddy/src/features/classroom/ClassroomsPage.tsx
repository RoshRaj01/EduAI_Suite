import React, { useState, useEffect } from "react";
import { Users, Clock, Plus } from "lucide-react";

export const ClassroomsPage: React.FC = () => {

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // 🔥 Tabs
  const [activeTab, setActiveTab] = useState<"home" | "announcements" | "students">("home");

  useEffect(() => {
    fetch("http://localhost:8000/courses")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClassrooms(data);
          setSelectedId(data[0].id);
        } else {
          setClassrooms([]);
          setSelectedId(null);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    fetch(`http://localhost:8000/announcements/${selectedId}`)
      .then(res => res.json())
      .then(data => setAssignments(Array.isArray(data) ? data : []));

    fetch(`http://localhost:8000/students/${selectedId}`)
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []));

  }, [selectedId]);

  const selected = classrooms.find(c => c.id === selectedId);

  return (
    <div className="space-y-4">

      {/* 🔥 HEADER ROW (TITLE + SEARCH SIDE BY SIDE) */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Classroom Management</h1>
        <input
          className="form-input w-72"
          placeholder="Search for a classroom..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* 🔥 MAIN GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* LEFT SIDEBAR (COURSES LIST) */}
        <div className="space-y-2">
          {classrooms
            .filter(c =>
              c.name.toLowerCase().includes(search.toLowerCase()) ||
              c.code.toLowerCase().includes(search.toLowerCase())
            )
            .map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`glass-card p-4 cursor-pointer card-interactive ${selectedId === c.id ? 'ring-2 ring-brand-blue ring-offset-2' : ''}`}
                style={{ background: selectedId === c.id ? 'var(--color-brand-blue-pale)' : 'var(--color-surface-card)' }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-brand-gold-dark)" }}>{c.code}</p>
                <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{c.name}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <Clock size={12} style={{ color: "var(--color-text-muted)" }} />
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{c.next_class}</p>
                </div>
              </div>
            ))}
        </div>

        {/* RIGHT CONTENT (FULL WIDTH AREA) */}
        <div className="xl:col-span-3 space-y-4">

          {!selected ? (
            <div>No data from backend</div>
          ) : (
            <>
              {/* COURSE HEADER */}
              <div className="p-6 rounded-2xl relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, var(--color-brand-blue), var(--color-brand-blue-mid))", color: "white" }}>
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold tracking-tight">{selected.name}</h2>
                  <p className="text-blue-100/90 text-sm mt-1 max-w-2xl">{selected.description}</p>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              </div>

              {/* 🔥 CENTERED TABS */}
              <div className="flex justify-center gap-6 border-b pb-2">
                {["home", "announcements", "students"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`text-sm font-semibold capitalize pt-4 pb-2 transition-all relative ${activeTab === tab ? "text-brand-blue" : "text-text-muted hover:text-text-secondary"
                      }`}
                    style={{ color: activeTab === tab ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}
                  >
                    {tab}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue rounded-full animate-fade-in"
                        style={{ backgroundColor: "var(--color-brand-blue)" }} />
                    )}
                  </button>
                ))}
              </div>

              {/* 🔥 FULL WIDTH CONTENT (CHANGES PER TAB) */}
              <div className="p-4">

                {activeTab === "home" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                    <div className="glass-card p-4">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Students Enrolled</p>
                      <div className="flex items-center gap-3">
                        <Users size={20} style={{ color: "var(--color-brand-blue)" }} />
                        <p className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{selected.students}</p>
                      </div>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Next Session</p>
                      <div className="flex items-center gap-3">
                        <Clock size={20} style={{ color: "var(--color-brand-blue)" }} />
                        <p className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>{selected.next_class}</p>
                      </div>
                    </div>
                    <div className="glass-card p-4">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Course Progress</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>{selected.progress}%</p>
                        </div>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${selected.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "announcements" && (
                  <div className="space-y-2">
                    {assignments.length === 0 ? (
                      <p>No announcements</p>
                    ) : (
                      assignments.map((a: any) => (
                        <div key={a.id} className="p-3 border rounded">
                          <p className="font-semibold">{a.title}</p>
                          <p className="text-sm">{a.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "students" && (
                  <div className="space-y-3">
                    {students.length === 0 ? (
                      <div className="text-center py-10">
                        <p style={{ color: "var(--color-text-muted)" }}>No students found in this classroom.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {students.map((s: any) => (
                          <div key={s.id} className="p-4 glass-card flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                              style={{ background: "linear-gradient(135deg, var(--color-brand-blue), var(--color-brand-blue-light))" }}>
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Roll No: {s.roll}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
