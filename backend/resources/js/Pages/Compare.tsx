import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { GitCompare, FileText, Check, Loader2, UploadCloud, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function Compare() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [compareData, setCompareData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCompare = async () => {
      if (!fileA || !fileB) {
          setErrorMsg("Harap unggah kedua paper (Paper A dan Paper B).");
          return;
      }

      setErrorMsg('');
      setIsComparing(true);
      setIsLoading(true);
      setCompareData(null);

      const formData = new FormData();
      formData.append('file_a', fileA);
      formData.append('file_b', fileB);

      try {
          const res = await axios.post('/api/papers/compare', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          setCompareData(res.data.data);
      } catch (err: any) {
          setErrorMsg(err.response?.data?.error || "Gagal membandingkan paper.");
          setIsComparing(false);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <AppLayout defaultRole="researcher">
      <Head title="Bandingkan Paper" />
      <div className="max-w-6xl mx-auto p-6 md:p-8">

        {/* Back Button */}
        <div className="mb-2">
            <Link 
                href="/dashboard" 
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#e8e4dc] bg-white text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 font-semibold text-sm transition-all shadow-sm group"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Kembali ke Dashboard</span>
            </Link>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900">Bandingkan Paper (On-The-Fly)</h2>
          <p className="text-stone-500 mt-1">Unggah dua file PDF untuk melihat perbandingan dari AI secara langsung tanpa perlu menyimpannya ke database.</p>
        </div>

        {/* Selection Card */}
        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6 mb-8">
          {errorMsg && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 rounded-lg border border-rose-200 text-sm font-semibold">
                  {errorMsg}
              </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full flex-1">
              <label className="block text-sm font-semibold text-stone-700 mb-2">Paper A (Utama)</label>
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-stone-500 rounded-xl border-2 border-dashed border-[#e8e4dc] cursor-pointer hover:bg-stone-50 hover:border-indigo-300 transition-colors">
                <UploadCloud className="w-8 h-8 mb-2 text-stone-400" />
                <span className="text-sm">{fileA ? fileA.name : 'Pilih File PDF'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files && setFileA(e.target.files[0])} />
              </label>
            </div>

            <div className="flex-shrink-0 mt-6 md:mt-0">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 border border-[#e8e4dc]">
                <GitCompare className="w-5 h-5" />
              </div>
            </div>

            <div className="w-full flex-1">
              <label className="block text-sm font-semibold text-stone-700 mb-2">Paper B (Pembanding)</label>
              <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-stone-500 rounded-xl border-2 border-dashed border-[#e8e4dc] cursor-pointer hover:bg-stone-50 hover:border-indigo-300 transition-colors">
                <UploadCloud className="w-8 h-8 mb-2 text-stone-400" />
                <span className="text-sm">{fileB ? fileB.name : 'Pilih File PDF'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files && setFileB(e.target.files[0])} />
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-stone-100 pt-6">
            <button
              onClick={handleCompare}
              disabled={isLoading || !fileA || !fileB}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 px-8 rounded-xl transition-colors flex items-center space-x-2 shadow-sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
              <span>Bandingkan Sekarang</span>
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        {isComparing && (
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-stone-50 p-4 border-b border-[#e8e4dc] flex items-center space-x-2">
              <FileText className="w-5 h-5 text-stone-500" />
              <h3 className="font-bold text-stone-800">Hasil Perbandingan</h3>
            </div>

            {isLoading ? (
                <div className="p-16 flex flex-col items-center justify-center text-stone-500">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                    <p className="font-medium">AI sedang membandingkan kedua paper...</p>
                    <p className="text-sm">Proses ini memakan waktu beberapa menit karena membaca keseluruhan teks dari dua paper.</p>
                </div>
            ) : compareData ? (
                <>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-stone-100 text-stone-700 uppercase text-[11px] font-bold border-b border-[#e8e4dc]">
                    <tr>
                        <th className="px-6 py-4 w-1/5 tracking-wider">Aspek</th>
                        <th className="px-6 py-4 w-2/5 border-l border-[#e8e4dc] text-indigo-800 bg-indigo-50">Paper A</th>
                        <th className="px-6 py-4 w-2/5 border-l border-[#e8e4dc] text-stone-700 bg-stone-50">Paper B</th>
                    </tr>
                    </thead>
                    <tbody>
                    {compareData.comparison_table?.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-[#e8e4dc] hover:bg-stone-50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-stone-800 bg-stone-50">{row.aspect}</td>
                            <td className="px-6 py-4 border-l border-[#e8e4dc] text-stone-700">{row.paper_a}</td>
                            <td className="px-6 py-4 border-l border-[#e8e4dc] text-stone-700">{row.paper_b}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>

                <div className="bg-stone-50 p-6 border-t border-[#e8e4dc]">
                <h4 className="font-bold text-stone-900 mb-4 flex items-center">
                    <Check className="w-4 h-4 text-emerald-600 mr-2"/> Rekomendasi AI
                </h4>
                <ul className="space-y-4">
                    {compareData.verdict && Object.entries(compareData.verdict).map(([key, v]: [string, any]) => (
                        <li key={key} className="flex items-start space-x-3 text-sm text-stone-700">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                            <span>
                                <strong className="text-stone-900 mr-1">{v.question}</strong>
                                (Pemenang: <span className="text-indigo-600 font-semibold">{v.winner}</span>) — {v.reason}
                            </span>
                        </li>
                    ))}
                </ul>
                </div>
                </>
            ) : null}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
