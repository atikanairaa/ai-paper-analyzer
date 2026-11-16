import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { ClipboardList, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { AuditLog } from '@/types/paper';
import axios from 'axios';

export default function AdminAuditLog() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = (page: number) => {
    setLoading(true);
    axios.get(`/api/admin/audit-logs?page=${page}`)
      .then(res => {
        if (res.data && res.data.data) {
          setAuditLogs(res.data.data);
          setCurrentPage(res.data.current_page);
          setLastPage(res.data.last_page);
          setTotal(res.data.total);
        } else if (Array.isArray(res.data)) {
          setAuditLogs(res.data);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs(currentPage);
  }, []);

  return (
    <AppLayout defaultRole="admin">
      <Head title="Riwayat Audit Log" />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Riwayat Audit Log</h1>
          <p className="text-sm text-stone-500 mt-1">Daftar lengkap seluruh aktivitas pengguna di dalam sistem.</p>
        </div>

        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e8e4dc] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-stone-400" />
              <h2 className="text-base font-bold text-stone-900">Semua Log Aktivitas</h2>
            </div>
            {total > 0 && <span className="text-sm text-stone-500">Total {total} log</span>}
          </div>

          {loading ? (
            <div className="p-8 text-center text-stone-500">Memuat data log...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-stone-500">Belum ada catatan log aktivitas.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Waktu</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Pengguna</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Aksi</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        {new Date(log.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium', timeStyle: 'short'
                        })}
                      </td>
                      <td className="px-6 py-4 font-medium text-stone-900">
                        {log.user?.name || 'Sistem'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-500">
                        {log.paper ? (
                          <span className="truncate max-w-xs inline-block">
                            {log.paper.title} <span className="text-stone-300 ml-1">(#{log.paper.id})</span>
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {lastPage > 1 && (
                <div className="px-6 py-4 border-t border-[#e8e4dc] flex items-center justify-between bg-white">
                  <span className="text-sm text-stone-500">
                    Halaman {currentPage} dari {lastPage}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-[#e8e4dc] rounded hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => fetchLogs(currentPage + 1)}
                      disabled={currentPage === lastPage}
                      className="p-2 border border-[#e8e4dc] rounded hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
