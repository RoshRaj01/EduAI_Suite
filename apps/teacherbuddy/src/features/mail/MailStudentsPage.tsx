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
  Eraser,
  Plus,
  Trash2,
  Database
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

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: any;
}

const FIELDS = [
  { value: "attendance", label: "Attendance (%)", type: "number" },
  { value: "avg_score", label: "Average Marks (%)", type: "number" },
  { value: "name", label: "Student Name", type: "text" },
  { value: "registration_number", label: "Register Number", type: "text" },
  { value: "course_id", label: "Course", type: "select" },
];

const OPERATORS = [
  { value: "==", label: "equals" },
  { value: "!=", label: "not equal to" },
  { value: ">", label: "greater than" },
  { value: "<", label: "less than" },
  { value: ">=", label: "greater than or equal" },
  { value: "<=", label: "less than or equal" },
  { value: "contains", label: "contains" },
];

export const MailStudentsPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([
    { id: Math.random().toString(36).substr(2, 9), field: "attendance", operator: "<", value: 75 }
  ]);
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

  const addCondition = () => {
    setConditions([...conditions, { 
      id: Math.random().toString(36).substr(2, 9), 
      field: "attendance", 
      operator: ">=", 
      value: 0 
    }]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, updates: Partial<Condition>) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const filterStudents = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // Map conditions for API
      const apiConditions = conditions.map(c => ({
        field: c.field,
        operator: c.operator,
        value: c.field === 'course_id' || c.field === 'attendance' || c.field === 'avg_score' 
          ? (typeof c.value === 'string' ? parseInt(c.value) : c.value)
          : c.value
      }));

      const res = await fetch(`${API_BASE_URL}/mail/filter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conditions: apiConditions })
      });
      const data = await res.json();
      setStudents(data);
      setSelectedStudents(data.map((s: Student) => s.id));
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
      setConditions([{ id: '1', field: "attendance", operator: "<", value: 75 }]);
    } else if (type === 'borderline') {
      setConditions([
        { id: '1', field: "attendance", operator: ">=", value: 75 },
        { id: '2', field: "attendance", operator: "<=", value: 85 }
      ]);
    } else if (type === 'high-performers') {
      setConditions([{ id: '1', field: "avg_score", operator: ">", value: 85 }]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--color-text-primary)" }}>Mailing System</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>Communicate with students based on SQL-like performance queries.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white/50 backdrop-blur-sm" style={{ borderColor: "var(--color-border)" }}>
          <Info size={18} className="text-blue-500" />
          <span className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>Tip: Use {"{{name}}"} to personalize messages</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: SQL Filters */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border shadow-sm space-y-5" style={{ background: "var(--color-surface-base)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 border-b pb-4" style={{ borderColor: "var(--color-border)" }}>
              <Database size={20} className="text-brand-blue" />
              <h2 className="font-bold uppercase text-xs tracking-widest" style={{ color: "var(--color-text-muted)" }}>Query Builder</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-tighter text-blue-600">SELECT</span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">STUDENTS</span>
              </div>
              
              <div className="flex items-center gap-2 -mt-2">
                <span className="text-xs font-black uppercase tracking-tighter text-blue-600">WHERE</span>
              </div>

              <div className="space-y-3">
                {conditions.map((cond, idx) => (
                  <div key={cond.id} className="relative group p-4 rounded-xl border bg-gray-50/50 hover:bg-white transition-all hover:shadow-md" style={{ borderColor: "var(--color-border)" }}>
                    {idx > 0 && (
                       <div className="absolute -top-3 left-4 px-2 py-0.5 bg-white border rounded-full text-[9px] font-black text-blue-600 uppercase" style={{ borderColor: "var(--color-border)" }}>
                        AND
                       </div>
                    )}
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Column</label>
                        <select 
                          className="w-full text-xs font-semibold p-2 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={cond.field}
                          onChange={(e) => updateCondition(cond.id, { field: e.target.value, value: e.target.value === 'course_id' ? "" : (FIELDS.find(f => f.value === e.target.value)?.type === 'number' ? 0 : "") })}
                        >
                          {FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Operator</label>
                          <select 
                            className="w-full text-xs font-semibold p-2 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={cond.operator}
                            onChange={(e) => updateCondition(cond.id, { operator: e.target.value })}
                          >
                            {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-gray-400 uppercase mb-1 block">Value</label>
                          {cond.field === 'course_id' ? (
                            <select 
                              className="w-full text-xs font-semibold p-2 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={cond.value}
                              onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                            >
                              <option value="">Select Course</option>
                              {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                            </select>
                          ) : (
                            <input 
                              type={FIELDS.find(f => f.value === cond.field)?.type || "text"}
                              className="w-full text-xs font-semibold p-2 rounded-lg border bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                              value={cond.value}
                              onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => removeCondition(cond.id)}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 rounded-full border border-red-100 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={addCondition}
                className="w-full py-2 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                style={{ borderColor: "var(--color-border)" }}
              >
                <Plus size={14} /> Add Condition
              </button>
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-muted)" }}>Quick Presets</p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleQuickFilter('low-attendance')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border hover:border-red-400 transition-colors"
                  style={{ color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
                >
                  Critical Att. (&lt;75%)
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
              {loading ? "Executing Query..." : <><Search size={18} /> Execute Search</>}
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
                <h2 className="font-bold">Result Set ({students.length})</h2>
              </div>
              {students.length > 0 && (
                <div className="flex items-center gap-4">
                   <button 
                    onClick={() => setSelectedStudents([])}
                    className="text-xs font-bold text-red-500 flex items-center gap-1 hover:underline"
                   >
                    <Eraser size={14} /> Clear Selection
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
                            onChange={() => {}} 
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
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>Define your query conditions and click execute.</p>
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
                     <button 
                      className="px-2 py-1 text-[9px] font-bold bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => setMailBody(prev => prev + "{{attendance}}")}
                     >
                      + Attendance
                     </button>
                     <button 
                      className="px-2 py-1 text-[9px] font-bold bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                      onClick={() => setMailBody(prev => prev + "{{marks}}")}
                     >
                      + Marks
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
