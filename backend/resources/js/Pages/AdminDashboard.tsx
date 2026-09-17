import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { FileText, CheckCircle, Loader2, XCircle, TrendingUp, RefreshCw, AlertCircle, Activity } from 'lucide-react';
import { AiJob, AuditLog } from '@/types/paper';
import axios from 'axios';

import { usePage } from '@inertiajs/react';

export default function AdminDashboard() {
  const { stats, domains, failedJobs: initialFailedJobs } = usePage<any>().props;

  const [toast, setToast]           = useState<string | null>(null);
  const [auditLogs, setAuditLogs]   = useState<AuditLog[]>([]);
  const [failedJobs, setFailedJobs] = useState<AiJob[]>(initialFailedJobs || []);

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
        if (Array.isArray(logsData) && logsData.length > 0) setAuditLogs(logsData.slice(0, 5)); 
      })
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Domain Chart */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6">
            <h2 className="text-base font-bold text-stone-900 mb-6">Paper per Domain Riset</h2>
            <div className="space-y-4">
              {domains && domains.length > 0 ? (
                <div className="space-y-4 mt-2">
                  {domains.map((d: any, i: number) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-stone-700">{d.name}</span>
                        <span className="text-stone-500">{d.count}</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(d.count / totalDomain) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full pb-8">
                  <p className="text-sm text-stone-400">Belum ada data domain riset.</p>
                </div>
              )}
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
                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-left">ID JOB</th>
                    <th className="px-6 py-4 font-semibold text-left">NAMA PDF</th>
                    <th className="px-6 py-4 font-semibold text-left">ERROR & RETRY</th>
                    <th className="px-6 py-4 font-semibold text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {failedJobs.length === 0 && (
                    <tr><td colSpan={4} className="px-6 py-10 text-center text-stone-400">Tidak ada tugas gagal saat ini 🎉</td></tr>
                  )}
                  {failedJobs.map(job => (
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
