import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, Check, Loader } from "lucide-react";
import logo from "../../assets/logo (5).png";

type Mode = "login" | "forgot";

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<"faculty" | "admin">("faculty");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (mode === "forgot") { setDone(true); return; }
      window.location.href = "/";
    }, 1800);
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#0f1e45 0%,#1c3570 50%,#264796 100%)" }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full" style={{ background: "rgba(208,174,97,0.08)" }} />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full" style={{ background: "rgba(38,71,150,0.25)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.02)" }} />

        {/* Logo */}
        <div>
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-xl p-1.5">
              <img src={logo} alt="Christ University" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-black text-xl tracking-tight" style={{ fontFamily: "var(--font-display)" }}>TeacherBuddy</p>
              <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: "var(--color-brand-gold)" }}>
                Christ (Deemed to be University)
              </p>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Empowering<br />
            <span style={{ color: "var(--color-brand-gold)" }}>Educators.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-sm">
            AI-powered academic management and insight tools for faculty and administrators at Christ University.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4 relative">
          {[
            { emoji: "🧠", title: "AI Evaluation", desc: "Automated subjective answer scoring with teacher review" },
            { emoji: "⚠️", title: "Risk Detection", desc: "Early warning system for student dropout risk" },
            { emoji: "📊", title: "Live Analytics", desc: "Real-time performance dashboards and trend analysis" },
            { emoji: "📚", title: "Content Studio", desc: "AI-generated lesson plans and interactive quizzes" },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                style={{ background: "rgba(255,255,255,0.08)" }}>
                {f.emoji}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-white/50 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs">
          © 2026 Christ (Deemed to be University) · Excellence · Service · Knowledge
        </p>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: "var(--color-bg-start)" }}>
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="glass-card p-8">
            {/* Mobile Logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1">
                <img src={logo} alt="Christ University" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-black text-sm" style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}>TeacherBuddy</p>
                <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>Christ University</p>
              </div>
            </div>

            {mode === "login" ? (
              <>
                <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                  Faculty Portal
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                  Sign in to your TeacherBuddy account.
                </p>

                {/* Role Selector */}
                <div className="flex gap-1 p-1 rounded-xl mb-6 hidden" style={{ background: "var(--color-bg-grad1)", border: "1px solid var(--color-border)" }}>
                  {(["faculty", "admin"] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className="flex-1 py-2 text-xs font-semibold capitalize rounded-lg transition-all"
                      style={{
                        backgroundColor: role === r ? 'var(--color-surface-card)' : 'transparent',
                        color: role === r ? 'var(--color-brand-blue)' : 'var(--color-text-muted)',
                        boxShadow: role === r ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-input text-sm"
                      placeholder={`${role}@christuniversity.in`}
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        className="form-input text-sm pr-10"
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Remember me</span>
                    </label>
                    <button type="button" onClick={() => setMode("forgot")}
                      className="text-xs font-semibold" style={{ color: "var(--color-brand-blue)" }}>
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full py-3 text-sm font-bold disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading
                      ? <><Loader size={15} className="animate-spin" /> Signing in…</>
                      : <>Sign In <ArrowRight size={15} /></>
                    }
                  </button>
                </form>

                <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Having trouble? Contact{" "}
                    <a href="mailto:it@christuniversity.in" className="font-semibold" style={{ color: "var(--color-brand-blue)" }}>
                      it@christuniversity.in
                    </a>
                  </p>
                </div>
              </>
            ) : (
              /* ── Forgot Password ── */
              <>
                <button onClick={() => { setMode("login"); setDone(false); }}
                  className="btn btn-ghost text-xs mb-4 px-0">
                  ← Back to Sign In
                </button>
                <h2 className="text-2xl font-black mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>
                  Reset Password
                </h2>
                <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
                  Enter your university email and we'll send you a reset link.
                </p>

                {done ? (
                  <div className="p-5 rounded-xl text-center space-y-3"
                    style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.2)" }}>
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                      <Check size={22} className="text-green-600" />
                    </div>
                    <p className="font-bold text-green-800">Email Sent!</p>
                    <p className="text-sm text-green-700">Check your inbox for the password reset link. It expires in 30 minutes.</p>
                    <button onClick={() => { setMode("login"); setDone(false); }} className="btn btn-outline text-sm mt-2">
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>
                        University Email
                      </label>
                      <input type="email" className="form-input text-sm" placeholder="you@christuniversity.in" required />
                    </div>
                    <button type="submit" className="btn btn-primary w-full py-3 text-sm font-bold" disabled={loading}>
                      {loading ? <><Loader size={15} className="animate-spin" /> Sending…</> : "Send Reset Link"}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>

          {/* SSD info */}
          <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-muted)" }}>
            Secured with TLS 1.3 · JWT Authentication · RBAC Access Control
          </p>
        </div>
      </div>
    </div>
  );
};
