import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { Database, ChevronRight, User } from 'lucide-react';
import { Paper } from '@/types/paper';
import { Badge } from '@/Components/Badge';

export default function MasterPaper() {
  const { props } = usePage<{ papers: { data: Paper[], links: any[] } }>();
  const papers = props.papers?.data || [];

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
            <Database className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-stone-900">Semua Paper</h2>
          </div>

          {papers.length === 0 ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center">
                <Database className="w-12 h-12 text-stone-300 mb-4" />
                <h3 className="text-lg font-bold text-stone-900 mb-1">Belum Ada Paper</h3>
                <p className="text-sm">Belum ada paper yang diunggah ke dalam sistem.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-[10px] uppercase tracking-wider text-stone-500">
                      <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] w-12">ID</th>
                      <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Informasi Paper</th>
                      <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Pengunggah</th>
                      <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status AI</th>
                      <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                    {papers.map((p: any) => (
                      <tr 
                        key={p.id} 
                        className="hover:bg-stone-50 transition-colors cursor-pointer group"
                        onClick={() => window.location.href = `/detail/${p.id}`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-stone-500">#{p.id}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-stone-900 group-hover:text-rose-700 transition-colors line-clamp-1">{p.title || 'Untitled Paper'}</p>
                          <p className="text-xs text-stone-500 mt-1">Diunggah: {new Date(p.created_at).toLocaleDateString('id-ID')}</p>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                                <User className="w-4 h-4 text-stone-400" />
                                <span className="text-sm font-medium">{p.uploader?.name || 'Guest'}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            color={p.status === 'ANALYZED' ? 'green' : p.status === 'FAILED' ? 'red' : 'yellow'}
                          >
                            {p.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {!p.is_submission ? (
                            <span className="text-xs text-stone-400 italic">Bukan untuk Jurnal</span>
                          ) : (
                            <Badge 
                                color={p.submission_status === 'PUBLISHED' || p.submission_status === 'ACCEPTED' ? 'green' : p.submission_status === 'REJECTED' ? 'red' : 'blue'}
                            >
                                {p.submission_status}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {props.papers?.links && props.papers.links.length > 3 && (
                <div className="px-6 py-4 border-t border-[#e8e4dc] flex items-center justify-center space-x-1 bg-stone-50">
                  {props.papers.links.map((link: any, index: number) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={`px-3 py-1.5 text-sm rounded-lg border ${
                        link.active 
                          ? 'bg-rose-600 border-rose-600 text-white font-bold shadow-sm' 
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                      } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
