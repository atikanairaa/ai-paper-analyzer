import React, { useState } from 'react';
import { AppLayout } from '../Layouts/AppLayout';
import { 
  FileText, CheckCircle, Loader2, XCircle, TrendingUp, 
  RefreshCw, AlertCircle, Activity, Check
} from 'lucide-react';

export default function AdminDashboard() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const stats = [
    { title: 'Total Paper', value: 128, icon: <FileText className="w-6 h-6 text-blue-500" />, bgColor: 'bg-blue-50' },
    { title: 'Dianalisis', value: 97, icon: <CheckCircle className="w-6 h-6 text-green-500" />, bgColor: 'bg-green-50' },
    { title: 'Sedang Diproses', value: 8, icon: <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />, bgColor: 'bg-yellow-50' },
    { title: 'Gagal', value: 3, icon: <XCircle className="w-6 h-6 text-red-500" />, bgColor: 'bg-red-50' },
    { title: 'Rata-rata Skor', value: 76.4, icon: <TrendingUp className="w-6 h-6 text-indigo-500" />, bgColor: 'bg-indigo-50' },
  ];

  const domains = [
    { name: 'Computer Science', count: 65, color: 'bg-blue-500' },
    { name: 'Medicine', count: 28, color: 'bg-green-500' },
    { name: 'Engineering', count: 15, color: 'bg-orange-500' },
    { name: 'Lainnya', count: 20, color: 'bg-gray-400' },
  ];
  const totalDomainCount = domains.reduce((acc, curr) => acc + curr.count, 0);

  const failedJobs = [
    { id: 'JOB-9021', paper: '#102 - Attention Is All...', status: 'GAGAL', duration: '48s', retry: '2/3', error: 'FastAPI timeout' },
    { id: 'JOB-9022', paper: '#105 - BERT Pre-training...', status: 'GAGAL', duration: '12s', retry: '1/3', error: 'Invalid JSON response from Gemini' },
    { id: 'JOB-9025', paper: '#110 - GPT-3 Language...', status: 'GAGAL', duration: '1m 05s', retry: '3/3', error: 'PDF Parser Error: Encrypted file' },
  ];

  const auditLogs = [
    { time: '2026-09-15 14:32', user: 'Dr. Ahmad', action: 'UNGGAH_PAPER', target: 'Paper #128' },
    { time: '2026-09-15 14:30', user: 'System AI', action: 'AI_ANALYSIS_STARTED', target: 'Paper #128' },
    { time: '2026-09-15 14:25', user: 'Admin Akbar', action: 'RETRY_AI_ANALYSIS', target: 'Job #JOB-9021' },
    { time: '2026-09-15 14:10', user: 'Prof. Budi', action: 'SUBMIT_REVIEW', target: 'Paper #102' },
  ];

  return (
    <AppLayout activeMenu="dashboard" defaultRole="admin">
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-500 mt-2">Ringkasan sistem dan pemantauan tugas AI (AI Jobs Monitoring)</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center">
              <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Paper Berdasarkan Domain Riset</h2>
              <div className="space-y-4">
                {domains.map((domain, idx) => {
                  const percentage = Math.round((domain.count / totalDomainCount) * 100);
                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-medium text-gray-700">{domain.name}</span>
                        <span className="text-xs text-gray-500">{domain.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${domain.color}`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Failed Jobs Table */}
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
                      <th className="px-6 py-4 font-medium">Paper</th>
                      <th className="px-6 py-4 font-medium">Status & Error</th>
                      <th className="px-6 py-4 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {failedJobs.map((job, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-gray-600">{job.id}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[150px]" title={job.paper}>{job.paper}</td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-red-600 font-mono bg-red-50 px-2 py-1 rounded inline-block mb-1">{job.error}</div>
                          <div className="text-xs text-gray-500">Durasi: {job.duration} | Retry: {job.retry}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => triggerToast(`Proses ulang (retry) untuk ${job.id} berhasil dikirim ke antrean!`)}
                            className="inline-flex items-center justify-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg transition-colors text-xs font-bold border border-red-200"
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

        {/* Audit Log Section */}
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
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{log.time}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{log.user}</td>
                    <td className="px-6 py-4">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-mono text-xs">{log.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 animate-fade-in-up z-50">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
