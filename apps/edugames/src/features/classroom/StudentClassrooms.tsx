import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Megaphone,
  Paperclip,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const API_URL = "http://localhost:8000";

type Course = {
  id: number;
  code: string;
  name: string;
  batch: string;
  students: number;
  progress: number;
  color: string;
  description: string;
  enrollment_code?: string | null;
  teacher_name?: string | null;
  course_plan_path?: string | null;
};

type Assignment = {
  id: number;
  course_id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  media_path?: string | null;
};

type Announcement = {
  id: number;
  course_id: number;
  title: string;
  body: string;
  time: string;
  pinned: boolean;
  attachment_path?: string | null;
};

const formatDueDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.replace("T", " at ");
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const getAssignmentStatus = (dueDate: string) => {
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return "Upcoming";
  }

  const diff = parsed.getTime() - Date.now();
  if (diff < 0) return "Overdue";
  if (diff < 1000 * 60 * 60 * 24) return "Due Soon";
  return "Open";
};

const getFileUrl = (path?: string | null) => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");
  return normalized.startsWith("http") ? normalized : `${API_URL}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
};

export const StudentClassrooms: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "announcements">("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File[]>>({});
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState<number[]>([]);

  const selectedCourse = useMemo(
    () => courses.find(course => course.id === selectedId) ?? null,
    [courses, selectedId],
  );

  const loadCourses = async () => {
    const response = await fetch(`${API_URL}/courses/`);
    if (!response.ok) {
      throw new Error(`Failed to load classrooms (${response.status})`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Invalid classroom payload");
    }

    setCourses(data);
    return data;
  };

  const loadCourseData = async (courseId: number) => {
    const [announcementData, assignmentData] = await Promise.all([
      fetch(`${API_URL}/announcements/${courseId}`).then(response => {
        if (!response.ok) throw new Error(`Failed to load announcements (${response.status})`);
        return response.json();
      }),
      fetch(`${API_URL}/assignments/${courseId}`).then(response => {
        if (!response.ok) throw new Error(`Failed to load assignments (${response.status})`);
        return response.json();
      }),
    ]);

    setAnnouncements(Array.isArray(announcementData) ? announcementData : []);
    
    if (Array.isArray(assignmentData)) {
      setAssignments(assignmentData);
      const submissionsPromises = assignmentData.map(a => 
         fetch(`${API_URL}/submissions/${a.id}`).then(res => res.json().catch(() => []))
      );
      const allSubmissions = await Promise.all(submissionsPromises);
      const submittedIds = [];
      assignmentData.forEach((a, i) => {
         if (Array.isArray(allSubmissions[i]) && allSubmissions[i].some((sub: any) => sub.student_name === "Aarav (Student)")) {
            submittedIds.push(a.id);
         }
      });
      setSubmittedAssignmentIds(submittedIds);
    } else {
      setAssignments([]);
      setSubmittedAssignmentIds([]);
    }
  };

  const selectCourse = async (courseId: number) => {
    setSelectedId(courseId);
    setLoading(true);
    setError(null);

    try {
      await loadCourseData(courseId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync selected classroom.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    setLoading(true);
    setError(null);

    try {
      const data = await loadCourses();
      const nextSelectedId = selectedId && data.some(course => course.id === selectedId)
        ? selectedId
        : data[0]?.id ?? null;

      if (nextSelectedId) {
        setSelectedId(nextSelectedId);
        await loadCourseData(nextSelectedId);
      } else {
        setAssignments([]);
        setAnnouncements([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync classroom data.");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleSubmitWork = async (assignmentId: number, files: File[]) => {
    try {
      const formData = new FormData();
      formData.append("student_name", "Aarav (Student)"); // Mocked student identity
      for (const file of files) {
        formData.append("files", file);
      }
      
      const response = await fetch(`${API_URL}/submissions/${assignmentId}`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error("Failed to submit assignment.");
      }
      
      alert("Assignment submitted successfully!");
      setSubmittedAssignmentIds(prev => Array.from(new Set([...prev, assignmentId])));
      setSelectedFiles(prev => {
        const next = { ...prev };
        delete next[assignmentId];
        return next;
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not upload work");
    }
  };

  const handleUnsubmit = async (assignmentId: number) => {
    if (!window.confirm("Are you sure you want to unsubmit your work?")) return;
    
    try {
      const studentName = "Aarav (Student)";
      const response = await fetch(`${API_URL}/submissions/assignment/${assignmentId}/student/${encodeURIComponent(studentName)}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Failed to unsubmit assignment.");
      }
      
      setSubmittedAssignmentIds(prev => prev.filter(id => id !== assignmentId));
      alert("Assignment unsubmitted successfully.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not unsubmit work");
    }
  };


  useEffect(() => {
    refresh();
  }, []);

  const filteredCourses = courses.filter(course =>
    `${course.code} ${course.name} ${course.batch}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>
            My Classrooms
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Live classroom data synced from the database.
          </p>
        </div>

        <div className="flex w-full max-w-md items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-9"
              placeholder="Search classrooms..."
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            className="btn btn-outline px-4"
            aria-label="Refresh classrooms"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Courses</p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
            {courses.length}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Assignments</p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
            {assignments.length}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Announcements</p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
            {announcements.length}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Progress</p>
          <p className="mt-2 text-3xl font-extrabold" style={{ color: "var(--color-text-primary)" }}>
            {selectedCourse?.progress ?? 0}%
          </p>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="space-y-3 xl:col-span-1">
          {filteredCourses.length === 0 ? (
            <GlassCard className="p-6 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              No classrooms match your search.
            </GlassCard>
          ) : (
            filteredCourses.map(course => {
              const isSelected = course.id === selectedId;

              return (
                <GlassCard
                  key={course.id}
                  className={`cursor-pointer p-5 transition-all hover:-translate-y-0.5 ${
                    isSelected ? "ring-2 ring-offset-0" : ""
                  }`}
                  onClick={() => void selectCourse(course.id)}
                  style={{
                    borderColor: isSelected ? course.color : undefined,
                    boxShadow: isSelected ? `0 0 0 1px ${course.color}33` : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: course.color }}>
                        {course.code}
                      </p>
                      <h2 className="mt-1 truncate text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                        {course.name}
                      </h2>
                      <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {course.batch}
                      </p>
                    </div>
                    <ChevronRight size={18} className={isSelected ? "text-blue-600" : "text-slate-400"} />
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {course.description}
                  </p>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                      <span style={{ color: course.color }}>{course.progress}% progress</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full" style={{ width: `${course.progress}%`, background: course.color }} />
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>

        <div className="space-y-6 xl:col-span-3">
          {!selectedCourse ? (
            <GlassCard className="p-10 text-center">
              <BookOpen size={32} className="mx-auto text-slate-400" />
              <p className="mt-4 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Select a classroom to view details
              </p>
            </GlassCard>
          ) : loading ? (
            <GlassCard className="p-10 text-center">
              <Loader2 size={28} className="mx-auto animate-spin text-slate-400" />
              <p className="mt-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Loading live classroom data...
              </p>
            </GlassCard>
          ) : (
            <>
              <GlassCard className="overflow-hidden">
                <div
                  className="p-6 text-white"
                  style={{
                    background: `linear-gradient(135deg, ${selectedCourse.color}, #1c3570)`,
                  }}
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/70">
                        {selectedCourse.code}
                      </p>
                      <h2 className="text-3xl font-black leading-tight">{selectedCourse.name}</h2>
                      <p className="max-w-2xl text-sm text-white/80">{selectedCourse.description}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Batch</p>
                        <p className="mt-1 font-semibold">{selectedCourse.batch}</p>
                      </div>
                      <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Classwork</p>
                        <p className="mt-1 font-semibold">{assignments.length} items</p>
                      </div>
                    </div>
                  </div>

                  {selectedCourse.enrollment_code && (
                    <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold">
                      <span className="text-white/65">Join code</span>
                      <span>{selectedCourse.enrollment_code}</span>
                    </div>
                  )}
                  {selectedCourse.teacher_name && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold ml-2">
                      <span className="text-white/65">Teacher</span>
                      <span>{selectedCourse.teacher_name}</span>
                    </div>
                  )}
                  {selectedCourse.course_plan_path && (
                    <a href={getFileUrl(selectedCourse.course_plan_path)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold ml-2 hover:bg-white/20 transition-colors text-white">
                      <BookOpen size={14} />
                      <span>Course Plan</span>
                    </a>
                  )}

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold text-white/80">
                      <span>Course progress</span>
                      <span>{selectedCourse.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/15">
                      <div
                        className="h-2 rounded-full bg-white"
                        style={{ width: `${selectedCourse.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>

              <div className="flex flex-wrap gap-3">
                {[
                  ["overview", "Overview"],
                  ["assignments", "Assignments"],
                  ["announcements", "Announcements"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key as typeof activeTab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                      activeTab === key ? "bg-blue-600 text-white" : "bg-white/70 text-slate-700 hover:bg-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === "overview" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <GlassCard
                    className="p-5"
                    interactive
                    role="button"
                    tabIndex={0}
                    aria-label="View upcoming assignments"
                    onClick={() => setActiveTab("assignments")}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") setActiveTab("assignments");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-600" size={18} />
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Upcoming work
                      </p>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Track class assignments and due dates from one place.
                    </p>
                  </GlassCard>
                  <GlassCard
                    className="p-5"
                    interactive
                    role="button"
                    tabIndex={0}
                    aria-label="View announcements"
                    onClick={() => setActiveTab("announcements")}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") setActiveTab("announcements");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="text-blue-600" size={18} />
                      <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
                        Announcements
                      </p>
                    </div>
                    <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      Important class updates and reminders appear here.
                    </p>
                  </GlassCard>
                </div>
              )}

              {activeTab === "assignments" && (() => {
                  const pendingAssignments = assignments.filter(a => !submittedAssignmentIds.includes(a.id));
                  const submittedAssignments = assignments.filter(a => submittedAssignmentIds.includes(a.id));
                  
                  return (
                    <div className="space-y-8">
                       {/* Pending Assignments */}
                       <div className="grid gap-4">
                         {pendingAssignments.length === 0 ? (
                            <GlassCard className="p-8 text-center bg-white/40">
                              <p className="text-slate-500 font-bold">You have zero pending assignments. Great job!</p>
                            </GlassCard>
                         ) : (
                            pendingAssignments.map(assignment => {
                              const status = getAssignmentStatus(assignment.due_date);
        
                              return (
                                <GlassCard key={assignment.id} className="p-5 border-l-4 border-l-orange-400">
                                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                                          {assignment.title}
                                        </p>
                                        <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-orange-700 border border-orange-200">
                                          PENDING
                                        </span>
                                      </div>
                                      <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                                        {assignment.description}
                                      </p>
                                      {assignment.media_path && (
                                        <div className="mt-4">
                                          <a
                                            href={getFileUrl(assignment.media_path)}
                                            download
                                            className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:border-blue-300"
                                          >
                                            <div className="flex items-center gap-2">
                                              <Paperclip size={14} className="group-hover:hidden" />
                                              <Download size={14} className="hidden group-hover:block" />
                                              <span className="truncate max-w-[200px]">{assignment.media_path.split(/[\/\\]/).pop()?.replace(/^[^_]+_/, '') || assignment.media_path.split(/[\/\\]/).pop()}</span>
                                            </div>
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                      <div className="flex shrink-0 flex-col gap-2 text-sm max-w-[200px]">
                                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                                          <Clock size={14} />
                                          <span>Due {formatDueDate(assignment.due_date)}</span>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-700">
                                          <CheckCircle2 size={14} />
                                          <span>{assignment.max_points} points</span>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-3">
                                          <div className="flex flex-wrap gap-2">
                                            {(selectedFiles[assignment.id] || []).map((file, idx) => (
                                              <div key={idx} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                                                <span className="truncate max-w-[120px]">{file.name}</span>
                                                <button 
                                                  onClick={() => {
                                                    setSelectedFiles(prev => ({
                                                      ...prev,
                                                      [assignment.id]: prev[assignment.id].filter((_, i) => i !== idx)
                                                    }));
                                                  }}
                                                  className="hover:text-red-500 transition-colors"
                                                >
                                                  <X size={12} />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                          
                                          <label className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-2 text-indigo-600 transition-colors hover:bg-indigo-50 cursor-pointer text-xs font-bold w-full text-center">
                                            <Paperclip size={14} className="shrink-0" />
                                            <span>Add Files</span>
                                            <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip" onChange={(e) => {
                                                if (e.target.files) {
                                                    const files = Array.from(e.target.files);
                                                    setSelectedFiles(prev => ({ 
                                                       ...prev, 
                                                       [assignment.id]: [...(prev[assignment.id] || []), ...files] 
                                                    }));
                                                }
                                            }} />
                                          </label>
                                          
                                          {(selectedFiles[assignment.id] || []).length > 0 && (
                                            <button 
                                              onClick={() => handleSubmitWork(assignment.id, selectedFiles[assignment.id])}
                                              className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-3 py-2 text-white transition-colors hover:bg-indigo-700 shadow-md shadow-indigo-500/20 font-bold text-xs w-full text-center truncate"
                                            >
                                              <span>Submit {selectedFiles[assignment.id].length} File(s)</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </GlassCard>
                              );
                            })
                         )}
                       </div>

                       {/* Submitted Assignments */}
                       {submittedAssignments.length > 0 && (
                         <div className="pt-6 border-t border-slate-200/50">
                            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider px-2">Submitted Assignments</h3>
                            <div className="grid gap-4 opacity-75">
                              {submittedAssignments.map(assignment => {
                                return (
                                  <GlassCard key={assignment.id} className="p-5 border-l-4 border-l-green-400 bg-white/40 grayscale-[0.3]">
                                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                                            {assignment.title}
                                          </p>
                                          <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-green-700 border border-green-200 flex items-center gap-1">
                                            <CheckCircle2 size={10}/> SUBMITTED
                                          </span>
                                        </div>
                                        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                                          {assignment.description}
                                        </p>
                                      </div>
                                      <div className="flex shrink-0 flex-col gap-2 text-sm">
                                          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-green-100 text-green-800 px-4 py-2 font-bold opacity-100 shadow-sm">
                                            <CheckCircle2 size={16} />
                                            <span>Work Submitted</span>
                                          </div>
                                          <button 
                                            onClick={() => handleUnsubmit(assignment.id)}
                                            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-red-600 text-xs font-bold hover:bg-red-100 transition-all shadow-sm"
                                          >
                                            <Trash2 size={14} />
                                            <span>Unsubmit</span>
                                          </button>
                                      </div>
                                    </div>
                                  </GlassCard>
                                )
                              })}
                            </div>
                         </div>
                       )}
                    </div>
                  );
              })()}

              {activeTab === "announcements" && (
                <div className="grid gap-4">
                  {announcements.length === 0 ? (
                    <GlassCard className="p-8 text-center">
                      <p style={{ color: "var(--color-text-secondary)" }}>No announcements available right now.</p>
                    </GlassCard>
                  ) : (
                    announcements.map(announcement => (
                      <GlassCard key={announcement.id} className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                            <Megaphone size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold" style={{ color: "var(--color-text-primary)" }}>
                                {announcement.title}
                              </p>
                              {announcement.pinned && (
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700">
                                  Pinned
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                              {announcement.body}
                            </p>
                            {announcement.attachment_path && (
                              <a
                                href={getFileUrl(announcement.attachment_path)}
                                download
                                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
                              >
                                <Paperclip size={14} />
                                <span>Download file</span>
                              </a>
                            )}
                            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {announcement.time}
                            </p>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
