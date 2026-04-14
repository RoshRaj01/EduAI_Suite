import React, { useState, useEffect } from "react";
import {
  Users, Clock, Plus, Search, ChevronRight,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const mockClassrooms = [
  {
    id: 1,
    code: "CSC401",
    name: "Advanced Neural Networks",
    batch: "Batch 2026-A",
    students: 42,
    next_class: "Today, 2:00 PM",
    progress: 68,
    color: "#264796",
    description: "Deep learning architectures",
  },
];

export const ClassroomsPage: React.FC = () => {

  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // 🔥 NEW: Tabs
  const [activeTab, setActiveTab] = useState<"home" | "announcements" | "students">("home");

  useEffect(() => {
    fetch("http://localhost:8000/courses")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setClassrooms(data);
          setSelectedId(data[0].id);
        } else {
          setClassrooms(mockClassrooms);
          setSelectedId(mockClassrooms[0].id);
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
  if (!selected) return <div>Loading...</div>;

  const filtered = classrooms.filter(
    c => c.name.toLowerCase().includes(search.toLowerCase()) ||
         c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Classroom Management</h1>
        <button className="btn btn-primary text-xs">
          <Plus size={14} /> Create Classroom
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* LEFT */}
        <div>
          <input
            className="form-input mb-3"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          {filtered.map(c => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="glass-card p-3 cursor-pointer mb-2"
            >
              <p>{c.code}</p>
              <p>{c.name}</p>
              <p>{c.next_class}</p>
            </div>
          ))}
        </div>

        {/* RIGHT */}
        <div className="xl:col-span-2 space-y-4">

          {/* HEADER */}
          <div className="p-4 rounded-xl bg-blue-100">
            <h2 className="text-lg font-bold">{selected.name}</h2>
            <p className="text-sm">{selected.description}</p>
          </div>

          {/* 🔥 TABS */}
          <div className="flex gap-4 border-b pb-2">
            {["home", "announcements", "students"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`text-sm font-semibold ${activeTab === tab ? "text-blue-600" : "text-gray-400"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}

          {/* HOME */}
          {activeTab === "home" && (
            <div>
              <p><Users size={14} /> Students: {selected.students}</p>
              <p><Clock size={14} /> Next Class: {selected.next_class}</p>
              <p>Progress: {selected.progress}%</p>
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {activeTab === "announcements" && (
            <div>
              {assignments.length === 0 ? (
                <p>No announcements</p>
              ) : (
                assignments.map((a: any) => (
                  <div key={a.id} className="p-2 border rounded mb-2">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm">{a.body}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* STUDENTS */}
          {activeTab === "students" && (
            <div>
              {students.length === 0 ? (
                <p>No students</p>
              ) : (
                students.map((s: any) => (
                  <div key={s.id} className="p-2 border rounded mb-2">
                    <p>{s.name}</p>
                    <p className="text-sm">{s.roll}</p>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
