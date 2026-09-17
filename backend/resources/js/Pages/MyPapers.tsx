import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { FileText, ChevronRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Paper } from '@/types/paper';

export default function MyPapers() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/papers')
      .then(res => {
        if (Array.isArray(res.data)) setPapers(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout defaultRole="peneliti">
      <Head title="Paper Saya" />

      <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Riwayat Analisis Paper</h1>
          <p className="text-sm text-stone-500 mt-1">Daftar semua paper yang pernah Anda unggah dan analisis.</p>
        </div>

        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-[#e8e4dc] flex items-center space-x-2">
            <FileText className="w-5 h-5 text-stone-400" />
            <h2 className="text-base font-bold text-stone-900">Paper Saya</h2>
          </div>

          {loading ? (
            <div className="p-8 flex items-center justify-center text-stone-500 space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memuat data...</span>
            </div>
          ) : papers.length === 0 ? (
            <div className="p-12 text-center text-stone-500 flex flex-col items-center">
                <FileText className="w-12 h-12 text-stone-300 mb-4" />
                <p>Anda belum mengunggah paper apa pun.</p>
                <Link href="/upload" className="mt-4 text-rose-600 font-semibold hover:underline">Unggah Paper Sekarang</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Judul Paper / File</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Waktu Unggah</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status</th>
                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                  {papers.map((p) => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-stone-900">
                        {p.title}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(p.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium', timeStyle: 'short'
                        })}
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
                      <td className="px-6 py-4 text-right">
                        <Link href={`/detail/${p.id}`} className="inline-flex items-center text-rose-600 hover:text-rose-800 font-semibold text-sm">
                            Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
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
