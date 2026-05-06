import React, { useState, useEffect } from "react";
import { FileSpreadsheet, Download, RefreshCw, Send, Users, X } from "lucide-react";
import { GlassCard } from "../../shared/components/GlassCard";
import { useTheme } from "../../shared/hooks/useTheme";
import { API_ENDPOINTS } from "../../shared/utils/apiConfig";

export const ReportsPage: React.FC = () => {
  const { isDark } = useTheme();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportType, setNewReportType] = useState('Student Report');
  const [newReportTargetId, setNewReportTargetId] = useState(1);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [sendEmailAddress, setSendEmailAddress] = useState("");
  const [selectedReportId, setSelectedReportId] = useState("");

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_ENDPOINTS.REPORTS}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async (type: string, target_id: number) => {
    try {
      setLoading(true);
      await fetch(`${API_ENDPOINTS.REPORTS}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target_id })
      });
      fetchReports();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to generate report:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (rep: any) => {
    if (!rep.content) return;
    const blob = new Blob([rep.content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${rep.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleSendClick = (rep: any) => {
    setSelectedReportId(rep.id);
    setSendEmailAddress("");
    setIsSendModalOpen(true);
  };

  const confirmSend = async () => {
    if (!sendEmailAddress) {
      alert("Please enter an email address.");
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_ENDPOINTS.REPORTS}/${selectedReportId}/send`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: sendEmailAddress })
      });
      if (res.ok) {
        alert('Report sent successfully!');
        setIsSendModalOpen(false);
      } else {
        const data = await res.json();
        alert(`Failed to send: ${data.detail}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error sending report.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type: string) => {
    setNewReportType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display" style={{ color: "var(--color-text-primary)" }}>Report Generation Center</h1>
          <p className="mt-1" style={{ color: "var(--color-text-secondary)" }}>Automated, AI-filled academic reports ready for parents and administration.</p>
        </div>
        <button onClick={() => openModal('Student Report')} className="btn btn-primary shadow-lg flex items-center gap-2">
          <FileSpreadsheet size={16} /> New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { type: 'Class Report', title: 'Class-Level Reports', desc: 'Generate aggregated performance stats.', icon: <Users size={20}/>, color: 'blue' },
          { type: 'Student Report', title: 'Parent-Ready Auto Reports', desc: 'AI summarizes student strengths & weaknesses.', icon: <FileSpreadsheet size={20}/>, color: 'green' },
          { type: 'Analytics Export', title: 'Scheduled Exports', desc: 'Manage automated weekly/monthly exports.', icon: <RefreshCw size={20}/>, color: 'purple' }
        ].map((item) => (
          <GlassCard key={item.title} className="p-6 group hover:scale-[1.02] transition-all duration-300">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
              item.color === 'blue' ? 'bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' :
              item.color === 'green' ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500 group-hover:text-white' :
              'bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white'
            }`}>
              {item.icon}
            </div>
            <h3 className="text-lg font-bold mb-2 font-display" style={{ color: "var(--color-text-primary)" }}>{item.title}</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{item.desc}</p>
            <button 
              onClick={() => openModal(item.type)} 
              className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                item.color === 'blue' ? 'text-blue-500 hover:text-blue-600' :
                item.color === 'green' ? 'text-green-500 hover:text-green-600' :
                'text-purple-500 hover:text-purple-600'
              }`}
            >
              Generate
              <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="overflow-hidden mt-6">
        <div className="p-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h2 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>Recent Reports</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead style={{ background: "rgba(0,0,0,0.02)", color: "var(--color-text-secondary)" }}>
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">ID</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Report Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Generated</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No reports generated yet.</td>
                </tr>
              ) : reports.map(rep => (
                <tr key={rep.id} className="hover:bg-black/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{rep.id}</td>
                  <td className="px-6 py-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>
                     <div className="flex items-center gap-2">
                       {rep.status === 'generating' && <RefreshCw size={14} className="animate-spin text-blue-500" />}
                       {rep.status === 'failed' && <span className="text-red-500 text-xs px-1 border border-red-500 rounded">Failed</span>}
                       {rep.name}
                     </div>
                  </td>
                  <td className="px-6 py-4" style={{ color: "var(--color-text-secondary)" }}>{rep.type}</td>
                  <td className="px-6 py-4" style={{ color: "var(--color-text-secondary)" }}>{rep.date}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => rep.content && alert(rep.content)} disabled={rep.status !== 'ready'} className="text-gray-500 hover:text-blue-600 disabled:opacity-30" title="View Content"><FileSpreadsheet size={16}/></button>
                    <button onClick={() => handleDownload(rep)} disabled={rep.status !== 'ready'} className="text-gray-500 hover:text-blue-600 disabled:opacity-30" title="Download"><Download size={16}/></button>
                    <button onClick={() => handleSendClick(rep)} disabled={rep.status !== 'ready'} className="text-gray-500 hover:text-green-600 disabled:opacity-30" title="Send"><Send size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-[#121212] rounded-2xl max-w-md w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white font-display mb-1">Generate Report</h2>
                  <p className="text-gray-400 text-sm">Configure your automated report parameters.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 ml-1">Report Type</label>
                  <div className="relative group">
                    <select 
                      value={newReportType} 
                      onChange={(e) => setNewReportType(e.target.value)}
                      className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer hover:bg-white/10"
                    >
                      <option value="Student Report" className="bg-[#1a1a1a]">Student Report</option>
                      <option value="Class Report" className="bg-[#1a1a1a]">Class Report</option>
                      <option value="Analytics Export" className="bg-[#1a1a1a]">Analytics Export</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <Users size={16} />
                    </div>
                  </div>
                </div>
                
                {newReportType !== 'Analytics Export' && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 ml-1">
                      {newReportType === 'Student Report' ? 'Student ID' : 'Course ID'}
                    </label>
                    <input 
                      type="number" 
                      value={newReportTargetId} 
                      onChange={(e) => setNewReportTargetId(Number(e.target.value))}
                      className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all hover:bg-white/10 placeholder:text-gray-600"
                      placeholder={`Enter ${newReportType === 'Student Report' ? 'Student' : 'Course'} ID...`}
                    />
                    <p className="text-[10px] mt-2 text-gray-500 italic ml-1 flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin-slow" />
                      Tip: Use ID 1, 2, or 3 for demonstration purposes.
                    </p>
                  </div>
                )}
                
                <button 
                  onClick={() => handleGenerate(newReportType, newReportTargetId)} 
                  disabled={loading}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-gray-400 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(37,99,235,0.6)] group mt-4"
                >
                  {loading ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <>
                      <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform" />
                      Start Real-Time Generation
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
          </div>
        </div>
      )}

      {isSendModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-[#121212] rounded-2xl max-w-md w-full overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 pt-8 pb-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white font-display mb-1">Send Report</h2>
                  <p className="text-gray-400 text-sm">Email this report directly to recipients.</p>
                </div>
                <button 
                  onClick={() => setIsSendModalOpen(false)} 
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-green-500 mb-2 ml-1">Recipient Email</label>
                  <div className="relative group">
                    <input 
                      type="email" 
                      value={sendEmailAddress} 
                      onChange={(e) => setSendEmailAddress(e.target.value)}
                      placeholder="parent@school.com"
                      className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all hover:bg-white/10 placeholder:text-gray-600"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <Send size={16} />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={confirmSend} 
                  disabled={loading}
                  className="w-full h-14 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:text-gray-400 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(22,163,74,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(22,163,74,0.6)] group mt-4"
                >
                  {loading ? (
                    <RefreshCw size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Send to Recipient
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />
          </div>
        </div>
      )}
    </div>
  );
};
