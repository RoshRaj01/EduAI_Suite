import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, Gamepad2, LayoutDashboard, Clock, LogOut, ChevronRight, Menu, Moon, Sun, Bell, X, ShieldAlert } from "lucide-react";
import logo from "../assets/logo (5).png";
import { useTheme } from "../shared/hooks/useTheme";
import { useAuthStore } from "../store/useAuthStore";

const studentNavItems = [
  { icon: LayoutDashboard, label: "My Dashboard", href: "/", end: true },
  { icon: BookOpen,        label: "My Classrooms",href: "/classroom" },
  { icon: Clock,         label: "Upcoming Exams", href: "/exams" },
  { icon: Gamepad2,        label: "EduGames",      href: "/games" },
];

export const StudentShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark, toggleTheme } = useTheme();
  const { setRole } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-surface-base)" }}>
      {/* ── Sidebar ── */}
      <aside className={`glass-sidebar flex flex-col fixed h-full z-50 transition-all duration-300 ${sidebarOpen ? "w-64" : "w-[72px]"}`}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div className="shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg" onClick={() => setSidebarOpen(s => !s)}>
            <img src={logo} alt="Christ University" className="w-full h-full object-contain p-0.5" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-[13px] leading-tight whitespace-nowrap font-display">EduGames Portal</p>
              <p className="text-[9.5px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "var(--color-brand-gold)" }}>Student View</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {studentNavItems.map((item) => (
            <NavLink key={item.href} to={item.href} end={item.end} className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}>
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 transition-all ${isActive ? "text-white" : "text-white/55"}`}>
                    <item.icon size={19} />
                  </span>
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {sidebarOpen && isActive && <ChevronRight size={14} className="ml-auto opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Links */}
        <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-1">
          <button onClick={() => navigate("/login")} className="nav-item text-red-300/80 hover:text-red-200 hover:bg-red-500/10 w-full">
            <LogOut size={19} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-[72px]"}`}>
        <header className="sticky top-0 z-40 h-[70px] flex items-center justify-between px-6 gap-4" style={{ background: "var(--color-header-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(s => !s)} className="p-2 rounded-lg transition-colors text-slate-400 hover:text-blue-700 hover:bg-blue-50">
              <Menu size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={toggleTheme} className="p-2 rounded-xl transition-all hover:bg-blue-50" style={{ color: "var(--color-text-muted)" }}>
               {isDark ? <Sun size={20} /> : <Moon size={20} />}
             </button>
             <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow bg-emerald-500">
                 AS
             </div>
          </div>
        </header>

        <div className="p-6 min-h-[calc(100vh-70px)]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
