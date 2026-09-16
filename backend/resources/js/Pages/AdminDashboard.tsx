import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { FileText, CheckCircle, Loader2, XCircle, TrendingUp, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { AiJob, AuditLog } from '@/types/paper';
import axios from 'axios';

const MOCK_STATS = { total: 128, analyzed: 97, processing: 8, failed: 3, avgScore: 76.4 };
const MOCK_DOMAINS = [
  { name: 'Computer Science', count: 65, color: 'bg-rose-500' },
  { name: 'Medicine',         count: 28, color: 'bg-emerald-500' },
  { name: 'Engineering',      count: 15, color: 'bg-amber-500' },
  { name: 'Lainnya',          count: 20, color: 'bg-stone-400' },
];
const MOCK_FAILED_JOBS: AiJob[] = [
  { id: 9021, paper_id: 102, status: 'FAILED', retry_count: 2, duration_seconds: 48,  error_message: 'FastAPI timeout',                   started_at: null, completed_at: null },
  { id: 9022, paper_id: 105, status: 'FAILED', retry_count: 1, duration_seconds: 12,  error_message: 'Invalid JSON response from Gemini', started_at: null, completed_at: null },
  { id: 9025, paper_id: 110, status: 'FAILED', retry_count: 3, duration_seconds: 65,  error_message: 'PDF Parser Error: Encrypted file',  started_at: null, completed_at: null },
];
const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 1, user_id: 1,    action: 'UNGGAH_PAPER',        paper_id: 128, ip_address: null, created_at: '15 Sep 2026, 14:32', user: { id: 1, name: 'Dr. Ahmad' },   paper: { id: 128, title: 'Paper #128' } },
  { id: 2, user_id: null, action: 'AI_ANALYSIS_STARTED', paper_id: 128, ip_address: null, created_at: '15 Sep 2026, 14:30', user: null,                            paper: { id: 128, title: 'Paper #128' } },
  { id: 3, user_id: 2,    action: 'RETRY_AI_ANALYSIS',   paper_id: 102, ip_address: null, created_at: '15 Sep 2026, 14:25', user: { id: 2, name: 'Admin Akbar' }, paper: { id: 102, title: 'Paper #102' } },
  { id: 4, user_id: 3,    action: 'SUBMIT_REVIEW',       paper_id: 102, ip_address: null, created_at: '15 Sep 2026, 14:10', user: { id: 3, name: 'Prof. Budi' },  paper: { id: 102, title: 'Paper #102' } },
];

export default function AdminDashboard() {
  const [toast, setToast]           = useState<string | null>(null);
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [failedJobs, setFailedJobs] = useState<AiJob[]>(MOCK_FAILED_JOBS);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    axios.get('/api/admin/audit-logs')
      .then(res => { if (Array.isArray(res.data) && res.data.length > 0) setAuditLogs(res.data); })
      .catch(() => {});
  }, []);

  const handleRetry = async (job: AiJob) => {
    try {
      await axios.post(`/api/admin/jobs/${job.id}/retry`);
      setFailedJobs(prev => prev.filter(j => j.id !== job.id));
      showToast(`Retry Job #JOB-${job.id} berhasil dikirim ke antrean!`);
    } catch {
      showToast(`Gagal mengirim retry untuk Job #JOB-${job.id}.`);
    }
  };

  const totalDomain = MOCK_DOMAINS.reduce((a, d) => a + d.count, 0);

  const statCards = [
    { title: 'Total Paper',      value: MOCK_STATS.total,      icon: <FileText    className="w-5 h-5 text-stone-500"  />, bg: 'bg-stone-50',   border: 'border-stone-200'  },
    { title: 'Dianalisis',       value: MOCK_STATS.analyzed,   icon: <CheckCircle className="w-5 h-5 text-emerald-600"/>, bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { title: 'Sedang Diproses',  value: MOCK_STATS.processing, icon: <Loader2    className="w-5 h-5 text-amber-600"  />, bg: 'bg-amber-50',   border: 'border-amber-200'  },
    { title: 'Gagal',            value: MOCK_STATS.failed,     icon: <XCircle    className="w-5 h-5 text-rose-600"   />, bg: 'bg-rose-50',    border: 'border-rose-200'   },
    { title: 'Rata-rata Skor',   value: MOCK_STATS.avgScore,   icon: <TrendingUp className="w-5 h-5 text-stone-500"  />, bg: 'bg-stone-50',   border: 'border-stone-200'  },
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Domain Chart */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Paper per Domain Riset</h2>
            <div className="space-y-4">
              {MOCK_DOMAINS.map((d, i) => {
                const pct = Math.round((d.count / totalDomain) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-stone-700">{d.name}</span>
                      <span className="text-xs text-stone-400">{d.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Failed Jobs */}
          <div className="lg:col-span-2 bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#e8e4dc] bg-stone-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-stone-900">Tugas AI yang Gagal</h2>
              </div>
              <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{failedJobs.length} Tugas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[#e8e4dc] text-stone-400 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">ID Job</th>
                    <th className="px-6 py-3 text-left font-semibold">Paper ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Error & Retry</th>
                    <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {failedJobs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-stone-400">Tidak ada tugas gagal saat ini 🎉</td></tr>
                  )}
                  {failedJobs.map(job => (
                    <tr key={job.id} className="hover:bg-stone-50 border-b border-[#e8e4dc] transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-stone-400">JOB-{job.id}</td>
                      <td className="px-6 py-4 font-semibold text-stone-800">#{job.paper_id}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{job.error_message}</span>
                        <div className="text-[11px] text-stone-400 mt-1">Durasi: {job.duration_seconds}d · Retry: {job.retry_count}/3</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleRetry(job)}
                          className="inline-flex items-center space-x-1.5 bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          <RefreshCw className="w-3.5 h-3.5" /><span>Coba Lagi</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e4dc] bg-stone-50 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-stone-500" />
            <h2 className="text-base font-bold text-stone-900">Log Aktivitas (Audit Log)</h2>
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
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-stone-50 border-b border-[#e8e4dc] transition-colors">
                    <td className="px-6 py-4 text-stone-400 font-mono text-xs">{log.created_at}</td>
                    <td className="px-6 py-4 font-semibold text-stone-800">{log.user?.name ?? 'System AI'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-rose-50 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-stone-500 text-xs font-mono">
                      {log.paper ? `${log.paper.title} (#${log.paper_id})` : `Paper #${log.paper_id}`}
                    </td>
                  </tr>
                ))}
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
