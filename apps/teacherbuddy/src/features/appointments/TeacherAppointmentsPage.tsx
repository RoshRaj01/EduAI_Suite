import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  CircleDashed,
  Loader2,
  RefreshCw,
  Search,
  Users,
  XCircle,
  MessageSquareText,
} from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";

const API_URL = "http://localhost:8000";

type AppointmentStatus = "pending" | "approved" | "rejected";

type Course = {
  id: number;
  code: string;
  name: string;
  batch: string;
  students: number;
  progress: number;
  color: string;
  description: string;
  teacher_name?: string | null;
};

type Appointment = {
  id: number;
  student_name: string;
  student_email?: string | null;
  teacher_name: string;
  teacher_department?: string | null;
  meeting_mode: string;
  time_slot: string;
  topic: string;
  status: AppointmentStatus;
  requested_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  notes?: string | null;
};

const formatTimestamp = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

const statusTabs: Array<{ id: "all" | AppointmentStatus; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const statusCopy: Record<AppointmentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending Review", color: "#d97706", bg: "rgba(217,119,6,0.12)" },
  approved: { label: "Approved", color: "#16a34a", bg: "rgba(22,163,74,0.12)" },
  rejected: { label: "Rejected", color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
};

export const TeacherAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState("All Teachers");
  const [statusTab, setStatusTab] = useState<"all" | AppointmentStatus>("pending");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [decisionNotes, setDecisionNotes] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");

  const teacherOptions = useMemo(() => {
    const names = new Set<string>();
    courses.forEach((course) => {
      if (course.teacher_name) names.add(course.teacher_name);
    });
    appointments.forEach((appointment) => {
      if (appointment.teacher_name) names.add(appointment.teacher_name);
    });
    return ["All Teachers", ...Array.from(names).sort()];
  }, [appointments, courses]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const teacherQuery = selectedTeacher !== "All Teachers"
        ? `?teacher_name=${encodeURIComponent(selectedTeacher)}`
        : "";

      const [appointmentsResponse, coursesResponse] = await Promise.all([
        fetch(`${API_URL}/appointments/${teacherQuery}`),
        fetch(`${API_URL}/courses/`),
      ]);

      if (!appointmentsResponse.ok) {
        throw new Error(`Failed to load appointments (${appointmentsResponse.status})`);
      }

      if (!coursesResponse.ok) {
        throw new Error(`Failed to load courses (${coursesResponse.status})`);
      }

      const [appointmentData, courseData] = await Promise.all([appointmentsResponse.json(), coursesResponse.json()]);
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
      setCourses(Array.isArray(courseData) ? courseData : []);
      setSelectedId((current) => current ?? appointmentData?.[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments.");
      setAppointments([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTeacher]);

  useEffect(() => {
    fetchData();
    const timer = window.setInterval(fetchData, 15000);
    return () => window.clearInterval(timer);
  }, [fetchData]);

  useEffect(() => {
    if (selectedTeacher !== "All Teachers" && !teacherOptions.includes(selectedTeacher)) {
      setSelectedTeacher("All Teachers");
    }
  }, [selectedTeacher, teacherOptions]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => statusTab === "all" ? true : appointment.status === statusTab)
      .filter((appointment) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        return [
          appointment.student_name,
          appointment.teacher_name,
          appointment.topic,
          appointment.meeting_mode,
          appointment.time_slot,
        ].some((value) => value.toLowerCase().includes(query));
      });
  }, [appointments, search, statusTab]);

  useEffect(() => {
    if (!filteredAppointments.some((appointment) => appointment.id === selectedId)) {
      setSelectedId(filteredAppointments[0]?.id ?? null);
    }
  }, [filteredAppointments, selectedId]);

  const selectedAppointment = filteredAppointments.find((appointment) => appointment.id === selectedId) ?? filteredAppointments[0] ?? null;

  const counts = useMemo(() => ({
    total: appointments.length,
    pending: appointments.filter((appointment) => appointment.status === "pending").length,
    approved: appointments.filter((appointment) => appointment.status === "approved").length,
    rejected: appointments.filter((appointment) => appointment.status === "rejected").length,
  }), [appointments]);

  const respondToAppointment = async (appointment: Appointment, status: AppointmentStatus) => {
    setActioningId(appointment.id);
    try {
      const response = await fetch(`${API_URL}/appointments/${appointment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          reviewed_by: appointment.teacher_name,
          notes: decisionNotes[appointment.id] ?? (status === "approved" ? "Approved for the requested slot." : "Declined with a reschedule recommendation."),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update appointment (${response.status})`);
      }

      await fetchData();
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ background: "rgba(208,174,97,0.12)", color: "var(--color-brand-gold-dark)" }}>
            <BadgeCheck size={12} />
            Teacher Appointment Review
          </div>
          <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>
            Student Booking Approvals
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Review student appointment requests, approve or reject them, and keep the student portal synced automatically.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Teacher Filter</span>
            <select
              value={selectedTeacher}
              onChange={(event) => setSelectedTeacher(event.target.value)}
              className="rounded-xl px-4 py-3 text-sm outline-none"
              style={{ background: "var(--color-surface-base)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
            >
              {teacherOptions.map((teacher) => <option key={teacher} value={teacher}>{teacher}</option>)}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Search</span>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Student, teacher, topic..."
                className="rounded-xl pl-9 pr-4 py-3 text-sm outline-none"
                style={{ background: "var(--color-surface-base)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              />
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: counts.total, icon: Users, color: "#264796" },
          { label: "Pending", value: counts.pending, icon: Clock, color: "#d97706" },
          { label: "Approved", value: counts.approved, icon: CheckCircle2, color: "#16a34a" },
          { label: "Rejected", value: counts.rejected, icon: XCircle, color: "#dc2626" },
        ].map((stat) => (
          <GlassCard key={stat.label} padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${stat.color}18` }}>
              <stat.icon size={18} style={{ color: stat.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>{stat.value}</p>
              <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>{stat.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={{
              background: statusTab === tab.id ? "linear-gradient(135deg, #264796, #3460c4)" : "rgba(100,116,139,0.08)",
              color: statusTab === tab.id ? "white" : "var(--color-text-secondary)",
            }}
          >
            {tab.label}
          </button>
        ))}
        <button
          onClick={fetchData}
          className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{ background: "rgba(208,174,97,0.12)", color: "var(--color-brand-gold-dark)" }}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <GlassCard variant="gold" className="flex items-center gap-3">
          <AlertCircle size={18} style={{ color: "var(--color-brand-gold-dark)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{error}</p>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          {loading ? (
            <GlassCard className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--color-brand-blue)" }} />
            </GlassCard>
          ) : filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment) => {
              const meta = statusCopy[appointment.status];
              const selected = appointment.id === selectedId;
              return (
                <GlassCard
                  key={appointment.id}
                  interactive
                  className={`cursor-pointer border-l-4 ${selected ? "shadow-lg" : ""}`}
                  style={{ borderLeftColor: selected ? "#264796" : "transparent" }}
                  onClick={() => setSelectedId(appointment.id)}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="badge text-[10px]" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                        <span className="badge text-[10px]" style={{ background: "rgba(38,71,150,0.08)", color: "var(--color-brand-blue)" }}>
                          {appointment.teacher_name}
                        </span>
                      </div>
                      <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{appointment.student_name}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{appointment.topic}</p>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {appointment.time_slot}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {formatTimestamp(appointment.requested_at)}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {appointment.meeting_mode}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start lg:items-end gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={(event) => { event.stopPropagation(); respondToAppointment(appointment, "approved"); }}
                          className="btn btn-primary text-xs"
                          disabled={actioningId === appointment.id || appointment.status !== "pending"}
                        >
                          {actioningId === appointment.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Approve
                        </button>
                        <button
                          onClick={(event) => { event.stopPropagation(); respondToAppointment(appointment, "rejected"); }}
                          className="btn btn-outline text-xs"
                          disabled={actioningId === appointment.id || appointment.status !== "pending"}
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                      {appointment.status !== "pending" && (
                        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                          Reviewed by {appointment.reviewed_by ?? "TeacherBuddy"}
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              );
            })
          ) : (
            <GlassCard className="py-16 text-center">
              <CircleDashed size={28} className="mx-auto mb-3" style={{ color: "var(--color-text-muted)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>No bookings match this view.</p>
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Try another teacher or status filter.</p>
            </GlassCard>
          )}
        </div>

        <div className="space-y-6">
          <GlassCard variant="blue">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquareText size={18} style={{ color: "var(--color-brand-blue)" }} />
              <h2 className="section-title text-sm">Selected Booking</h2>
            </div>
            {selectedAppointment ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>{selectedAppointment.student_name}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>{selectedAppointment.student_email}</p>
                </div>
                <div className="rounded-xl p-3 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-base)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Meeting Topic</p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-text-primary)" }}>{selectedAppointment.topic}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl p-3 border" style={{ borderColor: "var(--color-border)" }}>
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selectedAppointment.teacher_name}</p>
                    <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>{selectedAppointment.teacher_department || "Not specified"}</p>
                  </div>
                  <div className="rounded-xl p-3 border" style={{ borderColor: "var(--color-border)" }}>
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{selectedAppointment.meeting_mode}</p>
                    <p className="mt-1" style={{ color: "var(--color-text-muted)" }}>{selectedAppointment.time_slot}</p>
                  </div>
                </div>

                <label className="space-y-2 block">
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>Decision Note</span>
                  <textarea
                    value={decisionNotes[selectedAppointment.id] ?? selectedAppointment.notes ?? ""}
                    onChange={(event) => setDecisionNotes((current) => ({ ...current, [selectedAppointment.id]: event.target.value }))}
                    rows={4}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    style={{
                      color: "var(--color-text-primary)",
                      background: "var(--color-surface-base)",
                      border: "1px solid var(--color-border)",
                    }}
                    placeholder="Add a note for the student..."
                  />
                </label>

                {selectedAppointment.status === "pending" && (
                  <div className="flex gap-3">
                    <button
                      className="btn btn-primary flex-1 text-sm"
                      onClick={() => respondToAppointment(selectedAppointment, "approved")}
                    >
                      <CheckCircle2 size={15} /> Approve
                    </button>
                    <button
                      className="btn btn-outline flex-1 text-sm"
                      onClick={() => respondToAppointment(selectedAppointment, "rejected")}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>Select a booking to review its details.</p>
            )}
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} style={{ color: "var(--color-brand-blue)" }} />
              <h2 className="section-title text-sm">Approval Flow</h2>
            </div>
            <div className="space-y-3 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,6,0.12)", color: "#d97706" }}>1</span>
                <p>Pending bookings arrive from EduGames through the shared backend.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>2</span>
                <p>Approve or reject a booking using the action buttons on the list or detail pane.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(38,71,150,0.12)", color: "#264796" }}>3</span>
                <p>The student portal refreshes the same appointment record and shows the updated status.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
