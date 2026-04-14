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
        <h1 className="text-2xl font-bold">Classroom Management</h1>
        <input
          className="form-input w-72"
          placeholder="Search..."
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
                className="glass-card p-3 cursor-pointer"
              >
                <p>{c.code}</p>
                <p>{c.name}</p>
                <p className="text-xs text-gray-500">{c.next_class}</p>
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
              <div className="p-4 rounded-xl bg-blue-100">
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="text-sm">{selected.description}</p>
              </div>

              {/* 🔥 CENTERED TABS */}
              <div className="flex justify-center gap-6 border-b pb-2">
                {["home", "announcements", "students"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`text-sm font-semibold ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-400"}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* 🔥 FULL WIDTH CONTENT (CHANGES PER TAB) */}
              <div className="p-4">

                {activeTab === "home" && (
                  <div className="space-y-2">
                    <p><Users size={14} /> Students: {selected.students}</p>
                    <p><Clock size={14} /> Next Class: {selected.next_class}</p>
                    <p>Progress: {selected.progress}%</p>
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
                  <div className="space-y-2">
                    {students.length === 0 ? (
                      <p>No students</p>
                    ) : (
                      students.map((s: any) => (
                        <div key={s.id} className="p-3 border rounded">
                          <p>{s.name}</p>
                          <p className="text-sm">{s.roll}</p>
                        </div>
                      ))
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
