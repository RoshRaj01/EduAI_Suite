import React, { useState, useEffect } from "react";
import {
  Users, Clock, Plus, Search, ChevronRight,
  Bell, Paperclip, FileText, Video, Link as LinkIcon,
  Star, MoreHorizontal, Calendar,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const typeIcon: Record<string, React.ReactNode> = {
  pdf:   <FileText size={16} className="text-red-500" />,
  video: <Video size={16} className="text-blue-500" />,
  doc:   <FileText size={16} className="text-indigo-500" />,
  link:  <LinkIcon size={16} className="text-green-500" />,
};

export const ClassroomsPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"announcements" | "resources" | "students">("announcements");
  const [search, setSearch] = useState("");

  // 🔹 Fetch courses
  useEffect(() => {
    fetch("http://localhost:8000/courses")
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        if (data.length > 0) setSelectedCourse(data[0]);
      });
  }, []);

  // 🔹 Fetch related data when course changes
  useEffect(() => {
    if (!selectedCourse) return;

    fetch(`http://localhost:8000/announcements/${selectedCourse.id}`)
      .then(res => res.json())
      .then(setAnnouncements);

    fetch(`http://localhost:8000/resources/${selectedCourse.id}`)
      .then(res => res.json())
      .then(setResources);

    fetch(`http://localhost:8000/students/${selectedCourse.id}`)
      .then(res => res.json())
      .then(setStudents);

  }, [selectedCourse]);

  const filtered = courses.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  // 🔹 Prevent crash before data loads
  if (!selectedCourse) return <div>Loading...</div>;

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

        {/* Course List */}
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
                  <span className="text-[10px] font-bold uppercase" style={{ color: "var(--color-text-muted)" }}>{c.code}</span>
                  <p className="font-semibold text-sm mt-0.5">{c.name}</p>
                  <p className="text-[11px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Batch {c.batch} · {c.students} students
                  </p>
                </div>
                <ChevronRight size={16} className={`mt-1 ${selectedCourse.id === c.id ? "text-blue-600 rotate-90" : "text-slate-300"}`} />
              </div>

              <div className="mt-3 space-y-1.5">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${c.progress}%`,
                      background: `linear-gradient(90deg,${c.color},${c.color}bb)`
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {c.next_class}
                  </span>
                  <span className="font-semibold" style={{ color: c.color }}>
                    {c.progress}% complete
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Course Detail */}
        <div className="xl:col-span-2 space-y-4">

          {/* Header */}
          <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${selectedCourse.color} 0%, ${selectedCourse.color}cc 100%)` }}>
            <div className="p-6 text-white">
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedCourse.name}</h2>
                  <p className="text-sm">{selectedCourse.description}</p>
                </div>
                <MoreHorizontal size={18} />
              </div>

              <div className="flex gap-6 mt-4 text-xs">
                <div><Users size={13} /> {selectedCourse.students} Students</div>
                <div><Bell size={13} /> {announcements.length} Announcements</div>
                <div><Paperclip size={13} /> {resources.length} Resources</div>
                <div><Calendar size={13} /> {selectedCourse.next_class}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <GlassCard padding="none">
            <div className="flex border-b">
              {(["announcements", "resources", "students"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-semibold ${
                    activeTab === tab ? "border-b-2 border-blue-600" : "text-slate-400"
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
                  {announcements.map(a => (
                    <div key={a.id} className="p-4 border rounded-xl">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs">{a.body}</p>
                      <span className="text-[10px]">{a.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Resources */}
              {activeTab === "resources" && (
                <div className="space-y-3">
                  {resources.map(r => (
                    <div key={r.id} className="flex items-center gap-3 p-3 border rounded-xl">
                      {typeIcon[r.type]}
                      <div>
                        <p className="text-sm">{r.name}</p>
                        <p className="text-xs">{r.size} {r.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Students */}
              {activeTab === "students" && (
                <div className="space-y-2">
                  {students.map(s => (
                    <div key={s.roll} className="p-3 border rounded-xl">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs">{s.roll}</p>
                      <p className="text-xs">Attendance: {s.attendance}%</p>
                      <p className="text-xs">Score: {s.avg_score}%</p>
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