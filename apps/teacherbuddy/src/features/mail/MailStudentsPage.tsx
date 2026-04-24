import React, { useState, useEffect } from "react";
import { 
  Mail, 
  Search, 
  Filter, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  Info,
  History,
  Eraser
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Student {
  id: number;
  name: string;
  email: string;
  registration_number: string;
  attendance: number;
  avg_score: number;
  course_id: number;
}

interface Course {
  id: number;
  name: string;
  code: string;
}

export const MailStudentsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [attendanceRange, setAttendanceRange] = useState({ min: 0, max: 100 });
  const [scoreRange, setScoreRange] = useState({ min: 0, max: 100 });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/courses/`);
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    }
  };

  const filterStudents = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/mail/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse ? parseInt(selectedCourse) : null,
          attendance_min: attendanceRange.min,
          attendance_max: attendanceRange.max,
          score_min: scoreRange.min,
          score_max: scoreRange.max
        })
      });
      const data = await res.json();
      setStudents(data);
      setSelectedStudents(data.map((s: Student) => s.id)); // Select all by default
    } catch (err) {
      setStatus({ type: 'error', message: "Failed to filter students" });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = async () => {
    if (selectedStudents.length === 0) {
      setStatus({ type: 'error', message: "Please select at least one student" });
      return;
    }
    if (!mailSubject || !mailBody) {
      setStatus({ type: 'error', message: "Subject and body are required" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/mail/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_ids: selectedStudents,
          subject: mailSubject,
          body: mailBody
        })
      });
      const data = await res.json();
      setStatus({ type: 'success', message: data.message });
      // Reset form on success? Maybe not, so teacher can see what they sent.
    } catch (err) {
      setStatus({ type: 'error', message: "Failed to send emails" });
    } finally {
      setSending(false);
    }
  };

  const toggleStudentSelection = (id: number) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleQuickFilter = (type: string) => {
    if (type === 'low-attendance') {
      setAttendanceRange({ min: 0, max: 75 });
    } else if (type === 'borderline') {
      setAttendanceRange({ min: 75, max: 85 });
    } else if (type === 'high-performers') {
      setScoreRange({ min: 85, max: 100 });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Mailing System</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Communicate with students based on performance and attendance criteria.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: "var(--color-border)" }}>
          <Info size={18} className="text-blue-500" />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Tip: Use {"{{name}}"} to personalize messages</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border shadow-sm space-y-5" style={{ background: "var(--color-surface-base)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              <Filter size={20} className="text-brand-blue" />
              <h2 className="font-bold">Student Filters</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Course</label>
                <select 
                  className="w-full p-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Attendance Range (%)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" placeholder="Min" className="w-full p-2.5 rounded-lg border bg-transparent outline-none" 
                    style={{ borderColor: "var(--color-border)" }}
                    value={attendanceRange.min} onChange={e => setAttendanceRange({...attendanceRange, min: parseInt(e.target.value) || 0})}
                  />
                  <span style={{ color: "var(--color-text-muted)" }}>—</span>
                  <input 
                    type="number" placeholder="Max" className="w-full p-2.5 rounded-lg border bg-transparent outline-none" 
                    style={{ borderColor: "var(--color-border)" }}
                    value={attendanceRange.max} onChange={e => setAttendanceRange({...attendanceRange, max: parseInt(e.target.value) || 100})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Avg Marks Range (%)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" placeholder="Min" className="w-full p-2.5 rounded-lg border bg-transparent outline-none" 
                    style={{ borderColor: "var(--color-border)" }}
                    value={scoreRange.min} onChange={e => setScoreRange({...scoreRange, min: parseInt(e.target.value) || 0})}
                  />
                  <span style={{ color: "var(--color-text-muted)" }}>—</span>
                  <input 
                    type="number" placeholder="Max" className="w-full p-2.5 rounded-lg border bg-transparent outline-none" 
                    style={{ borderColor: "var(--color-border)" }}
                    value={scoreRange.max} onChange={e => setScoreRange({...scoreRange, max: parseInt(e.target.value) || 100})}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleQuickFilter('low-attendance')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:border-red-400 transition-colors"
                  style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
                >
                  Critical Attendance (&lt;75%)
                </button>
                <button 
                  onClick={() => handleQuickFilter('borderline')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:border-orange-400 transition-colors"
                  style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
                >
                  Borderline (75-85%)
                </button>
                <button 
                  onClick={() => handleQuickFilter('high-performers')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:border-green-400 transition-colors"
                  style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
                >
                  Toppers (&gt;85%)
                </button>
              </div>
            </div>

            <button 
              onClick={filterStudents}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loading ? "Searching..." : <><Search size={18} /> Apply Filters</>}
            </button>
          </div>
        </div>

        {/* Right Column: List & Compose */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2 duration-300 ${
              status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-semibold">{status.message}</span>
            </div>
          )}

          {/* Student List Section */}
          <div className="p-6 rounded-2xl border shadow-sm" style={{ background: "var(--color-surface-base)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Users size={20} className="text-brand-blue" />
                <h2 className="font-bold">Students List ({students.length})</h2>
              </div>
              {students.length > 0 && (
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setSelectedStudents([])}
                    className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline"
                   >
                    <Eraser size={14} /> Clear All
                   </button>
                   <button 
                    onClick={() => setSelectedStudents(students.map(s => s.id))}
                    className="text-xs font-bold text-blue-500 flex items-center gap-1 hover:underline"
                   >
                    <CheckCircle2 size={14} /> Select All
                   </button>
                </div>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto border rounded-xl" style={{ borderColor: "var(--color-border)" }}>
              {students.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white/80 backdrop-blur-md z-10" style={{ background: "var(--color-surface-base)" }}>
                    <tr className="border-b" style={{ borderColor: "var(--color-border)" }}>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Select</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Student Name</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Email</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Att.</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Marks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                    {students.map(s => (
                      <tr 
                        key={s.id} 
                        className={`hover:bg-blue-50/50 transition-colors cursor-pointer ${selectedStudents.includes(s.id) ? 'bg-blue-50/30' : ''}`}
                        onClick={() => toggleStudentSelection(s.id)}
                      >
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.includes(s.id)} 
                            onChange={() => {}} // Handled by row click
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-semibold">{s.name}</p>
                          <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.registration_number}</p>
                        </td>
                        <td className="p-4 text-xs font-mono" style={{ color: "var(--color-text-secondary)" }}>{s.email}</td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.attendance < 75 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {s.attendance}%
                          </span>
                        </td>
                        <td className="p-4">
                           <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.avg_score < 40 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                            {s.avg_score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed" style={{ borderColor: "var(--color-border)" }}>
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>No students found</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Try adjusting your filters or selecting a course.</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex items-center justify-between text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              <span>Showing {students.length} students</span>
              <span className="font-bold text-blue-600">{selectedStudents.length} students selected</span>
            </div>
          </div>

          {/* Compose Section */}
          <div className="p-6 rounded-2xl border shadow-sm space-y-6" style={{ background: "var(--color-surface-base)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              <Mail size={20} className="text-brand-blue" />
              <h2 className="font-bold">Compose Message</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Subject</label>
                <input 
                  type="text" 
                  placeholder="e.g., Attendance Warning / Appreciation Mail" 
                  className="w-full p-3 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                  value={mailSubject}
                  onChange={e => setMailSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-muted)" }}>Message Body</label>
                <div className="relative">
                  <textarea 
                    rows={8}
                    placeholder="Hello {{name}}, we noticed your attendance is {{attendance}}%..."
                    className="w-full p-4 rounded-xl border bg-transparent focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                    value={mailBody}
                    onChange={e => setMailBody(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                     <button 
                      className="px-2 py-1 text-[9px] font-bold bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => setMailBody(prev => prev + "{{name}}")}
                     >
                      + Name
                     </button>
                     <button 
                      className="px-2 py-1 text-[9px] font-bold bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => setMailBody(prev => prev + "{{reg_num}}")}
                     >
                      + Reg No.
                     </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <History size={14} />
                <span>Last sent: Never</span>
              </div>
              <button 
                onClick={handleSendMail}
                disabled={sending || selectedStudents.length === 0}
                className="flex items-center gap-2 px-8 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {sending ? "Sending..." : <><Send size={18} /> Send Bulk Emails</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
