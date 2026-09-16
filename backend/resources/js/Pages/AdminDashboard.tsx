import React, { useState, useEffect } from 'react';
import { AppLayout } from '../Layouts/AppLayout';
import { 
  FileText, CheckCircle, Loader2, XCircle, TrendingUp, 
  RefreshCw, AlertCircle, Activity
} from 'lucide-react';
import { AiJob, AuditLog, Paper } from '../types/paper';
import axios from 'axios';

// Mock stats jika belum ada data dari backend
const MOCK_STATS = { total: 128, analyzed: 97, processing: 8, failed: 3, avgScore: 76.4 };
const MOCK_DOMAINS = [
  { name: 'Computer Science', count: 65, color: 'bg-blue-500' },
  { name: 'Medicine', count: 28, color: 'bg-green-500' },
  { name: 'Engineering', count: 15, color: 'bg-orange-500' },
  { name: 'Lainnya', count: 20, color: 'bg-gray-400' },
];
const MOCK_FAILED_JOBS: AiJob[] = [
  { id: 9021, paper_id: 102, status: 'FAILED', retry_count: 2, duration_seconds: 48, error_message: 'FastAPI timeout', started_at: null, completed_at: null },
  { id: 9022, paper_id: 105, status: 'FAILED', retry_count: 1, duration_seconds: 12, error_message: 'Invalid JSON response from Gemini', started_at: null, completed_at: null },
  { id: 9025, paper_id: 110, status: 'FAILED', retry_count: 3, duration_seconds: 65, error_message: 'PDF Parser Error: Encrypted file', started_at: null, completed_at: null },
];
const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 1, user_id: 1, action: 'UNGGAH_PAPER', paper_id: 128, ip_address: null, created_at: '2026-09-15 14:32', user: { id: 1, name: 'Dr. Ahmad' }, paper: { id: 128, title: 'Paper #128' } },
  { id: 2, user_id: null, action: 'AI_ANALYSIS_STARTED', paper_id: 128, ip_address: null, created_at: '2026-09-15 14:30', user: null, paper: { id: 128, title: 'Paper #128' } },
  { id: 3, user_id: 2, action: 'RETRY_AI_ANALYSIS', paper_id: 102, ip_address: null, created_at: '2026-09-15 14:25', user: { id: 2, name: 'Admin Akbar' }, paper: { id: 102, title: 'Paper #102' } },
  { id: 4, user_id: 3, action: 'SUBMIT_REVIEW', paper_id: 102, ip_address: null, created_at: '2026-09-15 14:10', user: { id: 3, name: 'Prof. Budi' }, paper: { id: 102, title: 'Paper #102' } },
];

export default function AdminDashboard() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);
  const [failedJobs, setFailedJobs] = useState<AiJob[]>(MOCK_FAILED_JOBS);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch audit logs nyata dari backend
  useEffect(() => {
    axios.get('/api/admin/audit-logs')
      .then(res => { if (res.data?.length > 0) setAuditLogs(res.data); })
      .catch(() => { /* gunakan mock */ });
  }, []);

  const handleRetry = async (job: AiJob) => {
    try {
      await axios.post(`/api/admin/jobs/${job.id}/retry`);
      setFailedJobs(prev => prev.filter(j => j.id !== job.id));
      triggerToast(`✅ Proses ulang (retry) untuk Job #${job.id} berhasil dikirim ke antrean!`);
    } catch {
      triggerToast(`❌ Gagal mengirim retry untuk Job #${job.id}.`);
    }
  };

  const domains = MOCK_DOMAINS;
  const totalDomainCount = domains.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <AppLayout activeMenu="dashboard" defaultRole="admin">
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-500 mt-2">Ringkasan sistem dan pemantauan tugas AI (AI Jobs Monitoring)</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { title: 'Total Paper', value: MOCK_STATS.total, icon: <FileText className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50' },
            { title: 'Dianalisis', value: MOCK_STATS.analyzed, icon: <CheckCircle className="w-6 h-6 text-green-500" />, bg: 'bg-green-50' },
            { title: 'Sedang Diproses', value: MOCK_STATS.processing, icon: <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />, bg: 'bg-yellow-50' },
            { title: 'Gagal', value: MOCK_STATS.failed, icon: <XCircle className="w-6 h-6 text-red-500" />, bg: 'bg-red-50' },
            { title: 'Rata-rata Skor', value: MOCK_STATS.avgScore, icon: <TrendingUp className="w-6 h-6 text-indigo-500" />, bg: 'bg-indigo-50' },
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
              <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">{s.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Domain */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Paper Berdasarkan Domain Riset</h2>
              <div className="space-y-4">
                {domains.map((d, i) => {
                  const pct = Math.round((d.count / totalDomainCount) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{d.name}</span>
                        <span className="text-xs text-gray-500">{d.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${d.color}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Failed Jobs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h2 className="text-lg font-bold text-gray-900">Daftar Tugas AI yang Gagal</h2>
                </div>
                <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">{failedJobs.length} Tugas</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-gray-500 border-b border-gray-200 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-4 font-medium">ID Job</th>
                      <th className="px-6 py-4 font-medium">Paper ID</th>
                      <th className="px-6 py-4 font-medium">Error & Retry</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {failedJobs.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada tugas gagal saat ini.</td></tr>
                    )}
                    {failedJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600">JOB-{job.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">#{job.paper_id}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-red-600 font-mono bg-red-50 px-2 py-1 rounded inline-block mb-1">{job.error_message}</div>
                          <div className="text-xs text-gray-500">Durasi: {job.duration_seconds}s | Retry: {job.retry_count}/3</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleRetry(job)}
                            className="inline-flex items-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-200 transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Coba Lagi</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-2 bg-gray-50">
            <Activity className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Log Aktivitas (Audit Log)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-white text-gray-500 border-b border-gray-200 uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Waktu (Timestamp)</th>
                  <th className="px-6 py-4 font-medium">Pengguna</th>
                  <th className="px-6 py-4 font-medium">Aksi</th>
                  <th className="px-6 py-4 font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.created_at}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{log.user?.name ?? 'System AI'}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                      {log.paper ? `${log.paper.title} (#${log.paper_id})` : `Paper #${log.paper_id}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 z-50">
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
