import React, { useState, useEffect, useRef } from "react";
import { Users, Clock, PlusCircle, FilePlus, UserPlus, Megaphone, Trash2, X } from "lucide-react";

const API_URL = "http://localhost:8000";

const DEPARTMENTS = [
  "Computer Science",
  "Statistics and Data Science",
  "Commerce",
  "English",
  "Law",
  "Business and Management"
];

export const ClassroomsPage: React.FC = () => {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "assignments" | "students">("home");

  // Modals
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Forms
  const [courseForm, setCourseForm] = useState({
    code: "", name: "", batch: "", description: "", enrollment_code: "", color: "#264796"
  });

  const [studentForm, setStudentForm] = useState({
    name: "", email: "", registration_number: "", student_class: "", department: DEPARTMENTS[0]
  });
  const [studentTab, setStudentTab] = useState<"manual" | "csv">("manual");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "", body: "", time: "Just now", pinned: false
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: "", dueDate: ""
  });

  const fetchCourses = () => {
    fetch(`${API_URL}/courses/`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClassrooms(data);
          if (data.length > 0 && !selectedId) setSelectedId(data[0].id);
        } else {
          setClassrooms([]);
        }
      });
  };

  const fetchCourseData = () => {
    if (!selectedId) return;
    
    fetch(`${API_URL}/announcements/${selectedId}`)
      .then(res => res.json())
      .then(data => setAnnouncements(Array.isArray(data) ? data : []));

    fetch(`${API_URL}/students/${selectedId}`)
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []));

    fetchCourses();
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedId) fetchCourseData();
    setAssignments([
      { id: Date.now(), title: "Mid-Term Project", dueDate: "2024-04-25" }
    ]);
  }, [selectedId]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...courseForm, students: 0, progress: 0.0 };
    await fetch(`${API_URL}/courses/`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    setShowCourseModal(false);
    setCourseForm({ code: "", name: "", batch: "", description: "", enrollment_code: "", color: "#264796" });
    fetchCourses();
  };

  const handleDeleteCourse = async (id: number) => {
    if (!window.confirm("Delete this entire course?")) return;
    await fetch(`${API_URL}/courses/${id}`, { method: "DELETE" });
    if (selectedId === id) setSelectedId(null);
    fetchCourses();
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await fetch(`${API_URL}/announcements/${selectedId}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(announcementForm)
    });
    setAnnouncementForm({ title: "", body: "", time: "Just now", pinned: false });
    setShowAnnouncementModal(false);
    fetchCourseData();
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!window.confirm("Delete announcement?")) return;
    await fetch(`${API_URL}/announcements/${id}`, { method: "DELETE" });
    fetchCourseData();
  };

  const handleAddStudentManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    await fetch(`${API_URL}/students/${selectedId}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(studentForm)
    });
    setStudentForm({ name: "", email: "", registration_number: "", student_class: "", department: DEPARTMENTS[0] });
    setShowStudentModal(false);
    fetchCourseData();
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedId) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    await fetch(`${API_URL}/students/bulk_upload/${selectedId}`, {
      method: "POST", body: formData
    });
    setShowStudentModal(false);
    fetchCourseData();
  };

  const handleDeleteStudent = async (id: number) => {
    if (!window.confirm("Remove student from this course?")) return;
    await fetch(`${API_URL}/students/${id}`, { method: "DELETE" });
    fetchCourseData();
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignments([{ id: Date.now(), ...assignmentForm }, ...assignments]);
    setShowAssignmentModal(false);
    setAssignmentForm({ title: "", dueDate: "" });
  };

  const selected = classrooms.find(c => c.id === selectedId);

  return (
    <div className="space-y-4">

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Classroom Management</h1>
          <button onClick={() => setShowCourseModal(true)} className="btn btn-primary btn-sm flex items-center gap-2">
            <PlusCircle size={18} /> Create New Class
          </button>
        </div>
        <input
          className="form-input w-72" placeholder="Search for a classroom..."
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* SIDEBAR */}
        <div className="space-y-2">
          {classrooms
            .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
            .map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`glass-card p-4 cursor-pointer relative group flex justify-between items-start ${selectedId === c.id ? 'ring-2 ring-brand-blue' : ''}`}
                style={{ background: selectedId === c.id ? 'var(--color-brand-blue-pale)' : 'var(--color-surface-card)' }}
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--color-brand-gold-dark)" }}>{c.code}</p>
                  <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{c.name}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{c.students} Students</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c.id); }} 
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
        </div>

        {/* MAIN PANE */}
        <div className="xl:col-span-3 space-y-4">
          {!selected ? (
            <div className="p-10 text-center glass-card"><p style={{color: "var(--color-text-muted)"}}>No course selected or created.</p></div>
          ) : (
            <>
              <div className="p-6 rounded-2xl relative overflow-hidden flex justify-between items-start"
                style={{ background: `linear-gradient(135deg, ${selected.color || 'var(--color-brand-blue)'}, var(--color-brand-blue-mid))` }}>
                <div className="relative z-10 text-white">
                  <h2 className="text-2xl font-bold tracking-tight">{selected.name}</h2>
                  <p className="text-white/80 text-sm mt-1 max-w-2xl">{selected.description}</p>
                  {selected.enrollment_code && <p className="text-xs mt-3 font-mono bg-black/20 p-1 px-2 inline-block rounded">Code: {selected.enrollment_code}</p>}
                </div>
                <div className="relative z-10 flex gap-2">
                  <button onClick={() => setShowAssignmentModal(true)} className="btn btn-gold btn-sm">
                    <FilePlus size={16} /> New Assignment
                  </button>
                  <button onClick={() => setShowStudentModal(true)} className="btn bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md btn-sm">
                    <UserPlus size={16} /> Add Students
                  </button>
                </div>
              </div>

              <div className="flex justify-center gap-6 border-b pb-2">
                {["home", "assignments", "students"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`text-sm font-semibold capitalize pt-4 pb-2 transition-all relative ${activeTab === tab ? "text-brand-blue" : "text-text-muted hover:text-text-secondary"}`}
                    style={{ color: activeTab === tab ? "var(--color-brand-blue)" : "var(--color-text-muted)" }}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-blue rounded-full animate-fade-in" style={{ backgroundColor: "var(--color-brand-blue)" }} />}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === "home" && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="glass-card p-4">
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Enrolled</p>
                          <div className="flex items-center gap-3"><Users size={20} style={{ color: "var(--color-brand-blue)" }} /><p className="text-2xl font-bold">{students.length}</p></div>
                       </div>
                       <div className="glass-card p-4">
                          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Course Progress</p>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center"><p className="text-xl font-bold">{selected.progress}%</p></div>
                             <div className="progress-bar"><div className="progress-fill" style={{ width: `${selected.progress}%` }} /></div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div className="flex items-center gap-2">
                          <Megaphone size={18} style={{ color: "var(--color-brand-blue)" }} />
                          <h3 className="font-bold text-lg">Class Announcements</h3>
                        </div>
                        <button onClick={() => setShowAnnouncementModal(true)} className="text-xs font-bold bg-brand-blue text-white px-3 py-1 rounded hover:opacity-90">Post Announcement</button>
                      </div>
                      <div className="grid gap-3">
                        {announcements.length === 0 ? (
                           <div className="p-8 text-center glass-card"><p style={{ color: "var(--color-text-muted)" }}>No announcements.</p></div>
                        ) : (
                          announcements.map((a: any) => (
                            <div key={a.id} className="p-4 glass-card border-l-4 border-l-brand-blue flex justify-between items-start group">
                              <div>
                                <p className="font-bold text-sm mb-1">{a.title}</p>
                                <p className="text-sm line-clamp-3">{a.body}</p>
                                <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--color-text-muted)" }}>{a.time}</p>
                              </div>
                              <button onClick={() => handleDeleteAnnouncement(a.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-2 rounded">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "assignments" && (
                   <div className="space-y-4 animate-fade-in">
                      <div className="grid gap-3">
                        {assignments.map((a: any) => (
                           <div key={a.id} className="p-4 glass-card flex justify-between items-center">
                              <div>
                                 <p className="font-bold text-sm mb-1">{a.title}</p>
                                 <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                                    <Clock size={12} /><span>Due: {a.dueDate}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                   </div>
                )}

                {activeTab === "students" && (
                  <div className="space-y-3">
                    {students.length === 0 ? (
                       <div className="text-center py-10"><p style={{ color: "var(--color-text-muted)" }}>No students found.</p></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {students.map((s: any) => (
                          <div key={s.id} className="p-4 glass-card flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ background: "var(--color-brand-blue)" }}>{s.name.charAt(0)}</div>
                              <div>
                                <p className="font-semibold text-sm">{s.name}</p>
                                <p className="text-[10px] text-gray-500">Reg: {s.registration_number} | {s.email} | {s.student_class} | {s.department}</p>
                              </div>
                            </div>
                            <button onClick={() => handleDeleteStudent(s.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-2 rounded">
                              <Trash2 size={16} />
                            </button>
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

      {/* --- MODALS --- */}
      
      {showCourseModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Create New Class</h3>
              <button className="text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setShowCourseModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Course Code (e.g., CSC101)" value={courseForm.code} onChange={e=>setCourseForm({...courseForm, code: e.target.value})} />
              <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Course Name" value={courseForm.name} onChange={e=>setCourseForm({...courseForm, name: e.target.value})} />
              <input className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Batch / Year" value={courseForm.batch} onChange={e=>setCourseForm({...courseForm, batch: e.target.value})} />
              <input className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Enrollment Code (optional)" value={courseForm.enrollment_code} onChange={e=>setCourseForm({...courseForm, enrollment_code: e.target.value})} />
              <textarea className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Description" rows={3} value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description: e.target.value})} />
              <button type="submit" className="w-full btn btn-primary py-3 rounded-lg font-bold">Create Course</button>
            </form>
          </div>
        </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Add Students</h3>
              <button className="text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setShowStudentModal(false)}><X size={20}/></button>
            </div>
            
            <div className="flex gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              <button onClick={() => setStudentTab("manual")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${studentTab === "manual" ? "bg-brand-blue text-white shadow-md shadow-blue-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>Manual Entry</button>
              <button onClick={() => setStudentTab("csv")} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${studentTab === "csv" ? "bg-brand-blue text-white shadow-md shadow-blue-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>CSV Upload</button>
            </div>

            {studentTab === "manual" ? (
              <form onSubmit={handleAddStudentManual} className="space-y-4">
                <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Student Name" value={studentForm.name} onChange={e=>setStudentForm({...studentForm, name: e.target.value})} />
                <input required type="email" className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Email Address" value={studentForm.email} onChange={e=>setStudentForm({...studentForm, email: e.target.value})} />
                <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Registration Number" value={studentForm.registration_number} onChange={e=>setStudentForm({...studentForm, registration_number: e.target.value})} />
                <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Class/Section" value={studentForm.student_class} onChange={e=>setStudentForm({...studentForm, student_class: e.target.value})} />
                
                <select 
                   className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none appearance-none" 
                   value={studentForm.department} 
                   onChange={e=>setStudentForm({...studentForm, department: e.target.value})}
                >
                  {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>

                <button type="submit" className="w-full btn btn-primary py-3 rounded-lg font-bold">Enroll Student</button>
              </form>
            ) : (
              <div className="space-y-4 py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                  Upload a CSV file containing: <br/>
                  <code className="bg-slate-100 dark:bg-slate-800 text-brand-blue px-2 py-1 rounded text-xs mt-1 inline-block">[reg_number, name, email, class, dept]</code>
                </p>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleBulkUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue/10 file:text-brand-blue hover:file:bg-brand-blue/20 cursor-pointer" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Post Announcement</h3>
              <button className="text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setShowAnnouncementModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Title" value={announcementForm.title} onChange={e=>setAnnouncementForm({...announcementForm, title: e.target.value})} />
              <textarea required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Details..." rows={4} value={announcementForm.body} onChange={e=>setAnnouncementForm({...announcementForm, body: e.target.value})} />
              <div className="flex items-center gap-3 text-sm pt-2 text-slate-600 dark:text-slate-300">
                <input type="checkbox" id="pinned" checked={announcementForm.pinned} onChange={e=>setAnnouncementForm({...announcementForm, pinned: e.target.checked})} className="w-4 h-4 rounded text-brand-blue focus:ring-brand-blue" />
                <label htmlFor="pinned" className="font-medium">Pin to top of class</label>
              </div>
              <button type="submit" className="w-full btn btn-primary py-3 rounded-lg font-bold">Post Announcement</button>
            </form>
          </div>
        </div>
      )}

      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Create Assignment</h3>
              <button className="text-slate-500 hover:text-slate-800 dark:hover:text-white" onClick={() => setShowAssignmentModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <input required className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none" placeholder="Assignment Title" value={assignmentForm.title} onChange={e=>setAssignmentForm({...assignmentForm, title: e.target.value})} />
              <input required type="date" className="form-input w-full bg-slate-50 dark:bg-slate-800 border-none text-slate-600 dark:text-slate-300" value={assignmentForm.dueDate} onChange={e=>setAssignmentForm({...assignmentForm, dueDate: e.target.value})} />
              <button type="submit" className="w-full bg-gold text-slate-900 font-bold py-3 rounded-lg hover:bg-yellow-500 shadow-md">Create Assignment (Mock)</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
