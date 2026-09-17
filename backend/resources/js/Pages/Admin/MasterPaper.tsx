import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { Database, ChevronRight, User } from 'lucide-react';
import { Paper } from '@/types/paper';
import { Badge } from '@/Components/Badge';

export default function MasterPaper() {
  const { props } = usePage<{ papers: Paper[] }>();
  const papers = props.papers || [];

  return (
    <AppLayout defaultRole="admin">
      <Head title="Master Data Paper" />

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Master Data Paper</h1>
          <p className="text-sm text-stone-500 mt-1">Daftar seluruh paper yang diunggah oleh semua Peneliti (Researcher) maupun Guest ke dalam sistem.</p>
        </div>

        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e8e4dc] flex items-center space-x-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-bold text-stone-900">Semua Paper</h2>
          </div>

          {papers.length === 0 ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center">
                <Database className="w-12 h-12 text-stone-300 mb-4" />
                <p>Belum ada data paper di dalam sistem saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">ID</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Judul Paper</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Pengunggah</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status AI</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status Review</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                  {papers.map((p: any) => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 text-stone-500 text-xs">#{p.id}</td>
                      <td className="px-6 py-4 font-medium text-stone-900 max-w-[300px] truncate" title={p.title}>
                        {p.title}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                            <User className="w-4 h-4 text-stone-400 mr-2" />
                            {p.uploader ? p.uploader.name : 'Guest / Terhapus'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            p.status === 'ANALYZED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            p.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                            'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                          {p.is_submission ? (
                              <Badge color={p.submission_status === 'REVIEWED' ? 'green' : p.submission_status === 'IN_REVIEW' ? 'yellow' : 'gray'}>
                                  {p.submission_status}
                              </Badge>
                          ) : (
                              <Badge color="gray">NOT SUBMISSION</Badge>
                          )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/detail/${p.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-semibold text-sm">
                            Detail <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
