import React, { useState, useRef, useEffect, useCallback } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  HeartPulse,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  CheckSquare,
  FileSpreadsheet,
  FileSignature,
  Activity,
  X,
  Menu,
  Moon,
  Sun,
  Gamepad2,
  Wrench,
} from "lucide-react";
import logo from "../assets/logo (5).png";
import { useTheme } from "../shared/hooks/useTheme";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/",          end: true,  keywords: "home overview summary stats"      },
  { icon: Wrench,          label: "Teacher Tools", href: "/tools",              keywords: "question paper generator quiz"    },
  { icon: Gamepad2,        label: "Game Studio",   href: "/games",              keywords: "gamify create play interactive"   },
  { icon: BookOpen,        label: "Classrooms",    href: "/classrooms",         keywords: "courses students assignments"     },
  { icon: CheckSquare,     label: "Bulk Evaluation", href: "/evaluation",       keywords: "grade answers ai score"           },
  { icon: FileSpreadsheet, label: "Reports",     href: "/reports",              keywords: "export download pdf analytics"    },
  { icon: FileSignature,   label: "Form Automation", href: "/forms",            keywords: "template auto-fill document"      },
  { icon: Activity,        label: "Analytics & Risk", href: "/analytics",       keywords: "risk alert attendance prediction" },
  { icon: HeartPulse,      label: "Wellbeing Zone", href: "/wellbeing",         keywords: "mental health mood wellness"      },
  { icon: MessageSquare,   label: "AI Assistant",href: "/chat",                 keywords: "chat ask help bot"                },
  { icon: Settings,        label: "Settings",       href: "/settings",          keywords: "preferences config account"       },
];

const notifications = [
  { id: 1, title: "Exam submitted", desc: "John S. submitted Neural Networks Mid-Term", time: "2m ago", unread: true },
  { id: 2, title: "Risk Alert",     desc: "Student #4122 flagged — high absenteeism",   time: "18m ago",unread: true },
  { id: 3, title: "AI Evaluation",  desc: "55 answers evaluated by AI — ready for review", time: "1h ago", unread: false },
];

export const DashboardShell: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Filter nav items based on search query
  const searchResults = searchQuery.trim()
    ? navItems.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.keywords && item.keywords.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Navigate to a search result and clear
  const handleSearchSelect = useCallback((href: string) => {
    navigate(href);
    setSearchQuery("");
    setSearchFocused(false);
    searchRef.current?.blur();
  }, [navigate]);

  // Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === "Escape") {
        setSearchFocused(false);
        setSearchQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--color-surface-base)" }}>

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside
        className={`glass-sidebar flex flex-col fixed h-full z-50 transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-[72px]"
        }`}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8">
          <div
            className="shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-lg cursor-pointer"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <img src={logo} alt="Christ University" className="w-full h-full object-contain p-0.5" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-[13px] leading-tight whitespace-nowrap font-display">EduAI Suite</p>
              <p className="text-[9.5px] font-semibold uppercase tracking-widest whitespace-nowrap" style={{ color: "var(--color-brand-gold)" }}>
                Christ University
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "nav-item-active" : ""}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 transition-all ${isActive ? "text-white" : "text-white/55"}`}>
                    <item.icon size={19} />
                  </span>
                  {sidebarOpen && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {sidebarOpen && isActive && (
                    <ChevronRight size={14} className="ml-auto opacity-60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Promo Banner (only when expanded) */}
        {sidebarOpen && (
          <div className="mx-3 mb-4 rounded-xl p-3 text-white text-xs"
            style={{ background: "linear-gradient(135deg,rgba(208,174,97,0.22) 0%,rgba(208,174,97,0.08) 100%)", border: "1px solid rgba(208,174,97,0.25)" }}>
            <p className="font-bold text-[11px] mb-1" style={{ color: "var(--color-brand-gold)" }}>AI Analysis Ready</p>
            <p className="opacity-70 leading-relaxed">Daily risk scoring completed. 3 new alerts.</p>
          </div>
        )}

        {/* Bottom Links */}
        <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-1">
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? "nav-item-active" : ""}`}>
            <Settings size={19} className="text-white/55 shrink-0" />
            {sidebarOpen && <span>Settings</span>}
          </NavLink>
          <button
            onClick={() => navigate("/login")}
            className="nav-item text-red-300/80 hover:text-red-200 hover:bg-red-500/10 w-full"
          >
            <LogOut size={19} className="shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────── */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-[72px]"}`}>

        {/* Top Header */}
        <header className="sticky top-0 z-40 h-[70px] flex items-center justify-between px-6 gap-4"
          style={{ background: "var(--color-header-bg)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--color-border)" }}>

          {/* Left: Toggle + Search */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(s => !s)}
              className="p-2 rounded-lg transition-colors text-slate-400 hover:text-blue-700 hover:bg-blue-50">
              <Menu size={20} />
            </button>
            <div className="relative hidden md:flex items-center">
              <Search size={15} className="absolute left-3 text-slate-400 z-10" />
              <input
                ref={searchRef}
                className="form-input pl-9 pr-16 py-2 text-sm w-64 transition-all"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchFocused(true); }}
                onFocus={() => setSearchFocused(true)}
                onKeyDown={e => {
                  if (e.key === "Enter" && searchResults.length > 0) {
                    handleSearchSelect(searchResults[0].href);
                  }
                  if (e.key === "Escape") {
                    setSearchFocused(false);
                    setSearchQuery("");
                    searchRef.current?.blur();
                  }
                }}
                style={{ borderRadius: "10px" }}
              />
              <kbd
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded border pointer-events-none"
                style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)", background: "var(--color-bg-grad1)" }}
              >
                Ctrl K
              </kbd>

              {/* Search Results Dropdown */}
              {searchFocused && searchQuery.trim() && (
                <div
                  className="absolute top-full left-0 mt-2 w-80 glass-card overflow-hidden animate-fade-in z-50"
                  style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}
                >
                  {searchResults.length > 0 ? (
                    <div className="py-1">
                      <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                        Pages — {searchResults.length} result{searchResults.length > 1 ? "s" : ""}
                      </p>
                      {searchResults.map((item, i) => (
                        <button
                          key={item.href}
                          onClick={() => handleSearchSelect(item.href)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                          style={{}}
                          onMouseEnter={e => { e.currentTarget.style.background = "var(--color-border)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                        >
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "var(--color-bg-grad1)" }}
                          >
                            <item.icon size={16} style={{ color: "var(--color-brand-blue)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{item.label}</p>
                            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                              Navigate to {item.href === "/" ? "home" : item.href}
                            </p>
                          </div>
                          {i === 0 && (
                            <kbd
                              className="text-[9px] px-1.5 py-0.5 rounded border shrink-0"
                              style={{ color: "var(--color-text-muted)", borderColor: "var(--color-border)" }}
                            >
                              Enter ↵
                            </kbd>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Search size={24} className="mx-auto mb-2" style={{ color: "var(--color-text-muted)" }} />
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>No results found</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>Try searching for pages like "classrooms" or "analytics"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notif + Profile */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl transition-all hover:bg-blue-50 border border-transparent mr-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                className="p-2 rounded-xl transition-all hover:bg-blue-50 relative"
                style={{ color: notifOpen ? "var(--color-brand-blue)" : "#64748b" }}
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-white"
                  style={{ background: "var(--color-brand-gold)" }} />
              </button>

              {notifOpen && (
                <div className="glass-card absolute right-0 top-12 w-80 z-50 overflow-hidden animate-fade-in">
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>Notifications</p>
                    <button onClick={() => setNotifOpen(false)} style={{ color: 'var(--color-text-muted)' }}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${n.unread ? "bg-opacity-10" : ""}`}
                           style={{ backgroundColor: n.unread ? 'var(--color-bg-grad1)' : 'transparent' }}
                           onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
                           onMouseLeave={e => e.currentTarget.style.backgroundColor = n.unread ? 'var(--color-bg-grad1)' : 'transparent'}>
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                          style={{ background: n.unread ? "var(--color-brand-blue)" : "transparent", border: n.unread ? "none" : "1.5px solid var(--color-text-muted)" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>{n.title}</p>
                          <p className="text-[11px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{n.desc}</p>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{n.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
                    <button className="text-xs font-semibold" style={{ color: "var(--color-brand-blue)" }}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-7 w-px bg-slate-200" />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full transition-all hover:bg-slate-100 border border-slate-200/80"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                  style={{ background: "linear-gradient(135deg,#264796,#3460c4)" }}>
                  JD
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Prof. John Doe</p>
                  <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Computer Science</p>
                </div>
              </button>

              {profileOpen && (
                <div className="glass-card absolute right-0 top-12 w-52 z-50 overflow-hidden animate-fade-in py-1">
                  <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Prof. John Doe</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>john.doe@christuniversity.in</p>
                    <span className="badge badge-blue mt-2">Teacher</span>
                  </div>
                  {["View Profile", "Preferences", "Help & Support"].map(item => (
                    <button key={item} 
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                      style={{ color: 'var(--color-text-secondary)' }}
                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-brand-blue)'; e.currentTarget.style.backgroundColor = 'var(--color-border)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {item}
                    </button>
                  ))}
                  <div className="border-t mt-1" style={{ borderColor: 'var(--color-border)' }}>
                    <button onClick={() => navigate("/login")}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-500 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 min-h-[calc(100vh-70px)]">
          <Outlet />
        </div>
      </main>

      {/* Overlay to close dropdowns */}
      {(notifOpen || profileOpen || searchFocused) && (
        <div className="fixed inset-0 z-30" onClick={() => { setNotifOpen(false); setProfileOpen(false); setSearchFocused(false); setSearchQuery(""); }} />
      )}
    </div>
  );
};
