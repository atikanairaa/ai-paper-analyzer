import React, { useState, useEffect, useMemo } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { FileText, CheckCircle, Loader2, XCircle, TrendingUp, RefreshCw, AlertCircle, Activity, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { AiJob, AuditLog } from '@/types/paper';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';

const CHART_COLORS = ['#be123c', '#059669', '#d97706', '#44403c', '#ea580c', '#e11d48'];

export default function AdminDashboard() {
  const { stats, domains, failedJobs: initialFailedJobs, uploadTrend, statusChart, filters } = usePage<any>().props;

  const [toast, setToast]           = useState<string | null>(null);
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>([]);
  const [failedJobs, setFailedJobs] = useState<AiJob[]>(initialFailedJobs || []);
  
  // Trend Timeframe Filter
  const [timeframe, setTimeframe] = useState(filters?.timeframe || 'daily');
  
  // Pagination & Search States for Failed Jobs
  const [failedSearch, setFailedSearch] = useState('');
  const [failedPage, setFailedPage] = useState(1);
  const failedPerPage = 5;

  const formatErrorMessage = (errMsg: string) => {
    if (!errMsg) return "Kesalahan tidak diketahui.";
    const lowerMsg = errMsg.toLowerCase();
    
    if (lowerMsg.includes("429") || lowerMsg.includes("quota exceeded")) {
      return "Kuota harian sistem AI (Gemini) telah habis. Sistem membatasi jumlah analisis maksimal per hari. Silakan coba lagi besok.";
    }
    if (lowerMsg.includes("curl") || lowerMsg.includes("connect to server")) {
      return "Sistem tidak dapat terhubung ke server AI. Pastikan layanan AI sedang aktif dan berjalan normal.";
    }
    if (lowerMsg.includes("timeout") || lowerMsg.includes("time out")) {
      return "Waktu tunggu habis (timeout). Server AI membutuhkan waktu terlalu lama untuk merespons.";
    }
    return "Terjadi kesalahan internal pada pemrosesan dokumen oleh AI. Silakan hubungi administrator.";
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    axios.get('/api/admin/audit-logs')
      .then(res => { 
        const logsData = res.data.data || res.data;
        if (Array.isArray(logsData)) setAuditLogs(logsData); 
      })
      .catch(() => {});
  }, []);

  // Filter & Paginate Failed Jobs
  const paginatedFailedJobs = useMemo(() => {
      let filtered = failedJobs;
      if (failedSearch) {
          const q = failedSearch.toLowerCase();
          filtered = failedJobs.filter(j => 
              j.paper?.title?.toLowerCase().includes(q) ||
              j.error_message?.toLowerCase().includes(q)
          );
      }
      const start = (failedPage - 1) * failedPerPage;
      return {
          data: filtered.slice(start, start + failedPerPage),
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / failedPerPage)
      };
  }, [failedJobs, failedSearch, failedPage]);

  const handleRetry = async (job: AiJob) => {
    try {
      await axios.post(`/api/admin/jobs/${job.id}/retry`);
      setFailedJobs(prev => prev.filter(j => j.id !== job.id));
      showToast(`Retry Job #JOB-${job.id} berhasil dikirim ke antrean!`);
    } catch {
      showToast(`Gagal mengirim retry untuk Job #JOB-${job.id}.`);
    }
  };

  const totalDomain = domains ? domains.reduce((a: number, d: any) => a + d.count, 0) : 0;

  const statCards = [
    { title: 'Total Paper',      value: stats?.total || 0,      icon: <FileText    className="w-5 h-5 text-stone-500"  />, bg: 'bg-stone-50',   border: 'border-stone-200'  },
    { title: 'Dianalisis',       value: stats?.analyzed || 0,   icon: <CheckCircle className="w-5 h-5 text-emerald-600"/>, bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { title: 'Sedang Diproses',  value: stats?.processing || 0, icon: <Loader2    className="w-5 h-5 text-amber-600"  />, bg: 'bg-amber-50',   border: 'border-amber-200'  },
    { title: 'Gagal',            value: stats?.failed || 0,     icon: <XCircle    className="w-5 h-5 text-rose-600"   />, bg: 'bg-rose-50',    border: 'border-rose-200'   },
    { title: 'Rata-rata Skor',   value: stats?.avgScore || 0,   icon: <TrendingUp className="w-5 h-5 text-stone-500"  />, bg: 'bg-stone-50',   border: 'border-stone-200'  },
  ];

  return (
    <AppLayout defaultRole="admin">
      <Head title="Dashboard Admin" />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Dashboard Admin</h1>
          <p className="text-sm text-stone-500 mt-1">Ringkasan sistem dan pemantauan tugas AI secara real-time.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-5 flex flex-col items-center text-center">
              <div className={`w-11 h-11 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-2xl font-bold text-stone-900">{s.value}</p>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mt-1">{s.title}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI Processing Success Rate */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6 flex flex-col">
            <h2 className="text-base font-bold text-stone-900 mb-4">Tingkat Kesuksesan AI</h2>
            <div className="flex-1 min-h-[300px]">
                {statusChart && statusChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={statusChart} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {statusChart.map((entry: any, index: number) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.name === 'Berhasil (Analyzed)' ? '#059669' : entry.name === 'Gagal (Failed)' ? '#be123c' : CHART_COLORS[index % CHART_COLORS.length]} 
                                    />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8e4dc', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full"><p className="text-sm text-stone-400">Belum ada data.</p></div>
                )}
            </div>
          </div>

          {/* Paper by Domain */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6 flex flex-col">
            <h2 className="text-base font-bold text-stone-900 mb-4">Paper per Domain Riset</h2>
            <div className="flex-1 min-h-[300px]">
                {domains && domains.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={domains} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e8e4dc" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#57534e' }} width={90} />
                            <Tooltip cursor={{ fill: '#f5f5f4' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e8e4dc' }} />
                            <Bar dataKey="count" fill="#be123c" radius={[0, 4, 4, 0]} maxBarSize={40}>
                                {domains.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full"><p className="text-sm text-stone-400">Belum ada data domain riset.</p></div>
                )}
            </div>
          </div>

          {/* Uploads Trend */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6 flex flex-col lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-stone-900">Tren Unggahan</h2>
              <select 
                value={timeframe}
                onChange={e => {
                  setTimeframe(e.target.value);
                  router.get('/admin', { timeframe: e.target.value }, { preserveState: true, preserveScroll: true });
                }}
                className="bg-stone-50 border border-stone-200 text-stone-700 text-xs rounded-lg px-3 py-1.5 focus:border-rose-300 focus:ring-rose-200 outline-none"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
            
            <div className="flex-1 min-h-[300px]">
                {uploadTrend && uploadTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={uploadTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e4dc" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#57534e' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#57534e' }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e8e4dc' }} />
                            <Line type="monotone" dataKey="count" stroke="#be123c" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full"><p className="text-sm text-stone-400">Belum ada tren data.</p></div>
                )}
            </div>
          </div>
        </div>

        {/* Failed Jobs (Full Width Stacked) */}
        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#e8e4dc] bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h2 className="text-base font-bold text-stone-900">Tugas AI yang Gagal</h2>
                    <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{paginatedFailedJobs.total}</span>
                </div>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        value={failedSearch}
                        onChange={e => { setFailedSearch(e.target.value); setFailedPage(1); }}
                        placeholder="Cari ID, Judul, Error..."
                        className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-[#e8e4dc] bg-white text-sm text-stone-800 placeholder-stone-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition"
                    />
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                    <tr>
                    <th className="px-6 py-4 font-semibold text-left">ID JOB</th>
                    <th className="px-6 py-4 font-semibold text-left">NAMA PDF</th>
                    <th className="px-6 py-4 font-semibold text-left w-1/3">ERROR & RETRY</th>
                    <th className="px-6 py-4 font-semibold text-right">AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    {paginatedFailedJobs.data.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-stone-400">Tidak ada tugas gagal yang cocok dengan pencarian 🎉</td></tr>
                    )}
                    {paginatedFailedJobs.data.map(job => (
                    <tr key={job.id} className="hover:bg-stone-50/50 border-b border-[#e8e4dc] transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-stone-400">JOB-{job.id}</td>
                        <td className="px-6 py-4 font-semibold text-stone-800 max-w-xs truncate" title={job.paper?.title || `Paper #${job.paper_id}`}>
                        {job.paper?.title ? job.paper.title.replace(/\.pdf$/i, '').replace(/[_+]/g, ' ') : `Paper #${job.paper_id}`}
                        </td>
                        <td className="px-6 py-4">
                        <span className="text-xs text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200 block whitespace-normal">
                            {formatErrorMessage(job.error_message || "")}
                        </span>
                        <div className="text-[11px] text-stone-400 mt-1">Durasi: {job.duration_seconds}d - Retry: {job.retry_count}/3</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRetry(job)}
                            className="inline-flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
                            <RefreshCw className="w-3.5 h-3.5" /><span>Coba Lagi</span>
                        </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>

            {/* Pagination Controls for Failed Jobs */}
            {paginatedFailedJobs.totalPages > 1 && (
                <div className="px-6 py-3 border-t border-[#e8e4dc] bg-stone-50 flex items-center justify-between">
                    <span className="text-xs text-stone-500 font-medium">Halaman {failedPage} dari {paginatedFailedJobs.totalPages}</span>
                    <div className="flex space-x-2">
                        <button onClick={() => setFailedPage(p => Math.max(1, p - 1))} disabled={failedPage === 1} className="p-1.5 rounded-lg border border-[#e8e4dc] bg-white text-stone-500 hover:text-stone-800 disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setFailedPage(p => Math.min(paginatedFailedJobs.totalPages, p + 1))} disabled={failedPage === paginatedFailedJobs.totalPages} className="p-1.5 rounded-lg border border-[#e8e4dc] bg-white text-stone-500 hover:text-stone-800 disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </div>

        {/* Audit Log Table */}
        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e4dc] bg-stone-50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-stone-500" />
              <h2 className="text-base font-bold text-stone-900">Log Aktivitas (Audit Log)</h2>
            </div>
            <a href="/admin/audit" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center">
              Lihat Semua <ChevronRight className="w-3 h-3 ml-1" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e8e4dc] text-stone-400 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Waktu</th>
                  <th className="px-6 py-3 text-left font-semibold">Pengguna</th>
                  <th className="px-6 py-3 text-left font-semibold">Aksi</th>
                  <th className="px-6 py-3 text-left font-semibold">Target</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 5).map(log => {
                  const dateObj = new Date(log.created_at);
                  const formattedDate = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  return (
                    <tr key={log.id} className="border-b border-stone-100/50 hover:bg-stone-50 transition">
                      <td className="px-6 py-3 text-stone-400 text-xs font-medium">{formattedDate}</td>
                      <td className="px-6 py-3 text-stone-900 font-medium">{log.user?.name || 'Sistem'}</td>
                      <td className="px-6 py-3">
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-full text-[10px] font-bold uppercase tracking-wider">{log.action}</span>
                      </td>
                      <td className="px-6 py-3 text-stone-600 truncate max-w-[200px]">{log.paper?.title || `Data #${log.paper_id}`}</td>
                    </tr>
                  );
                })}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-stone-400">Belum ada riwayat aktivitas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-[#e8e4dc] text-stone-900 px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 z-50">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </AppLayout>
  );
}
