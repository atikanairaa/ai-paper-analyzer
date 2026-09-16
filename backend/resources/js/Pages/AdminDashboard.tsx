import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import {
  FileText, CheckCircle, Loader2, XCircle, TrendingUp,
  RefreshCw, AlertCircle, Activity,
} from 'lucide-react';
import { AiJob, AuditLog } from '@/types/paper';
import axios from 'axios';

// â”€â”€â”€ Mock Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MOCK_STATS = { total: 128, analyzed: 97, processing: 8, failed: 3, avgScore: 76.4 };
const MOCK_DOMAINS = [
  { name: 'Computer Science', count: 65, color: 'bg-blue-500' },
  { name: 'Medicine',         count: 28, color: 'bg-green-500' },
  { name: 'Engineering',      count: 15, color: 'bg-orange-500' },
  { name: 'Lainnya',          count: 20, color: 'bg-slate-400' },
];
const MOCK_FAILED_JOBS: AiJob[] = [
  { id: 9021, paper_id: 102, status: 'FAILED', retry_count: 2, duration_seconds: 48,  error_message: 'FastAPI timeout',                   started_at: null, completed_at: null },
  { id: 9022, paper_id: 105, status: 'FAILED', retry_count: 1, duration_seconds: 12,  error_message: 'Invalid JSON response from Gemini', started_at: null, completed_at: null },
  { id: 9025, paper_id: 110, status: 'FAILED', retry_count: 3, duration_seconds: 65,  error_message: 'PDF Parser Error: Encrypted file',  started_at: null, completed_at: null },
];
const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 1, user_id: 1,    action: 'UNGGAH_PAPER',       paper_id: 128, ip_address: null, created_at: '15 Sep 2026, 14:32', user: { id: 1, name: 'Dr. Ahmad' },   paper: { id: 128, title: 'Paper #128' } },
  { id: 2, user_id: null, action: 'AI_ANALYSIS_STARTED', paper_id: 128, ip_address: null, created_at: '15 Sep 2026, 14:30', user: null,                            paper: { id: 128, title: 'Paper #128' } },
  { id: 3, user_id: 2,    action: 'RETRY_AI_ANALYSIS',   paper_id: 102, ip_address: null, created_at: '15 Sep 2026, 14:25', user: { id: 2, name: 'Admin Akbar' }, paper: { id: 102, title: 'Paper #102' } },
  { id: 4, user_id: 3,    action: 'SUBMIT_REVIEW',        paper_id: 102, ip_address: null, created_at: '15 Sep 2026, 14:10', user: { id: 3, name: 'Prof. Budi' },  paper: { id: 102, title: 'Paper #102' } },
];

export default function AdminDashboard() {
  const [toast, setToast]         = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [failedJobs, setFailedJobs] = useState<AiJob[]>(MOCK_FAILED_JOBS);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch audit logs asli dari API saat mount
  useEffect(() => {
    axios.get('/api/admin/audit-logs')
      .then(res => { if (Array.isArray(res.data) && res.data.length > 0) setAuditLogs(res.data); })
      .catch(() => { /* tetap pakai mock */ });
  }, []);

  const handleRetry = async (job: AiJob) => {
    try {
      await axios.post(`/api/admin/jobs/${job.id}/retry`);
      setFailedJobs(prev => prev.filter(j => j.id !== job.id));
      showToast(`âœ… Retry Job #JOB-${job.id} berhasil dikirim ke antrean!`);
    } catch {
      showToast(`âŒ Gagal mengirim retry untuk Job #JOB-${job.id}.`);
    }
  };

  const totalDomain = MOCK_DOMAINS.reduce((a, d) => a + d.count, 0);

  return (
    <AppLayout activeMenu="dashboard" defaultRole="admin">
      <Head title="Dashboard Admin" />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-sm text-slate-500 mt-1">Ringkasan sistem dan pemantauan tugas AI secara real-time.</p>
        </div>

        {/* â”€â”€ Stats Cards â”€â”€ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { title: 'Total Paper',     value: MOCK_STATS.total,      icon: <FileText    className="w-5 h-5 text-blue-500" />,   ring: 'ring-blue-100',   bg: 'bg-blue-50' },
            { title: 'Dianalisis',      value: MOCK_STATS.analyzed,   icon: <CheckCircle className="w-5 h-5 text-green-500" />,  ring: 'ring-green-100',  bg: 'bg-green-50' },
            { title: 'Sedang Diproses', value: MOCK_STATS.processing, icon: <Loader2    className="w-5 h-5 text-amber-500 animate-spin" />, ring: 'ring-amber-100', bg: 'bg-amber-50' },
            { title: 'Gagal',           value: MOCK_STATS.failed,     icon: <XCircle    className="w-5 h-5 text-red-500" />,    ring: 'ring-red-100',    bg: 'bg-red-50' },
            { title: 'Rata-rata Skor',  value: MOCK_STATS.avgScore,   icon: <TrendingUp className="w-5 h-5 text-indigo-500" />, ring: 'ring-indigo-100', bg: 'bg-indigo-50' },
          ].map((s, i) => (
            <div key={i} className={`bg-white rounded-2xl shadow-sm ring-1 ${s.ring} p-5 flex flex-col items-center text-center`}>
              <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">{s.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* â”€â”€ Domain Chart â”€â”€ */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-800 mb-6">Paper per Domain Riset</h2>
            <div className="space-y-4">
              {MOCK_DOMAINS.map((d, i) => {
                const pct = Math.round((d.count / totalDomain) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{d.name}</span>
                      <span className="text-xs text-slate-400">{d.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`h-2 rounded-full ${d.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* â”€â”€ Failed AI Jobs â”€â”€ */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <h2 className="text-base font-bold text-slate-800">Tugas AI yang Gagal</h2>
              </div>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">{failedJobs.length} Tugas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">ID Job</th>
                    <th className="px-6 py-3 text-left font-semibold">Paper ID</th>
                    <th className="px-6 py-3 text-left font-semibold">Error & Retry</th>
                    <th className="px-6 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {failedJobs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400">Tidak ada tugas gagal saat ini ðŸŽ‰</td></tr>
                  )}
                  {failedJobs.map(job => (
                    <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">JOB-{job.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">#{job.paper_id}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded">{job.error_message}</span>
                        <div className="text-[11px] text-slate-400 mt-1">Durasi: {job.duration_seconds}d Â· Retry: {job.retry_count}/3</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRetry(job)}
                          className="inline-flex items-center space-x-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
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

        {/* â”€â”€ Audit Log â”€â”€ */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-800">Log Aktivitas (Audit Log)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Waktu</th>
                  <th className="px-6 py-3 text-left font-semibold">Pengguna</th>
                  <th className="px-6 py-3 text-left font-semibold">Aksi</th>
                  <th className="px-6 py-3 text-left font-semibold">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{log.created_at}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{log.user?.name ?? 'System AI'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-100">{log.action}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                      {log.paper ? `${log.paper.title} (#${log.paper_id})` : `Paper #${log.paper_id}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-white border border-slate-200 text-slate-900 px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 z-50">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </AppLayout>
  );
}

