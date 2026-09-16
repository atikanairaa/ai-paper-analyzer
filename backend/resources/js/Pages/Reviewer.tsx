import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { ShieldCheck, AlertTriangle, CheckCircle, FileText, MessageSquare, ThumbsUp, XCircle, RotateCcw } from 'lucide-react';
import axios from 'axios';

export default function Reviewer() {
  const { props } = usePage<any>();
  const paper = props.paper ?? null;
  const paperId = paper?.id ?? 102;

  const [manualScore, setManualScore] = useState<number | ''>(props.review?.score ?? '');
  const [comment, setComment] = useState(props.review?.comments ?? '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const submitDecision = async (recommendation: string, label: string) => {
    if (manualScore === '' && manualScore !== 0) { triggerToast('Harap isi skor terlebih dahulu!'); return; }
    setSubmitting(true);
    try {
      await axios.post(`/api/papers/${paperId}/reviews`, { recommendation, score: manualScore, comments: comment });
      triggerToast(`Keputusan "${label}" berhasil disimpan!`);
    } catch (e: any) {
      triggerToast(e?.response?.data?.message || 'Gagal menyimpan keputusan.');
    } finally {
      setSubmitting(false);
    }
  };

  const aiReport = {
    summary: paper?.analyses?.[0]?.key_findings?.join(' ') || 'Penelitian ini mengusulkan arsitektur Transformer yang menghilangkan RNN dan CNN sepenuhnya, mengandalkan mekanisme self-attention. Menunjukkan hasil SOTA pada tugas terjemahan mesin (WMT 2014).',
    strengths: paper?.analyses?.[0]?.strengths?.length ? paper.analyses[0].strengths : ['Kebaruan (Novelty) yang sangat tinggi dalam NLP.', 'Detail matematika dijelaskan dengan baik.', 'Hasil eksperimen kuat.'],
    majorConcerns: paper?.analyses?.[0]?.weaknesses?.length ? paper.analyses[0].weaknesses : ['Kebutuhan GPU untuk replikasi masih cukup tinggi.'],
    recommendation: paper?.scores?.overall_score && paper.scores.overall_score >= 80 ? 'TERIMA' : 'REVISI MINOR',
  };

  return (
    <AppLayout defaultRole="reviewer">
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Panel Penilai (Reviewer)</h1>
            <p className="text-stone-500 mt-2">
              Evaluasi Paper: <strong className="text-stone-800">{paper?.title ?? 'Attention Is All You Need'}</strong>
              <span className="text-stone-400 ml-2">(ID: #{paperId})</span>
            </p>
          </div>
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2 rounded-xl flex items-center space-x-2 font-semibold shadow-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Mode Reviewer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* AI Report Card */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
            <div className="bg-stone-50 px-6 py-4 border-b border-[#e8e4dc] flex items-center space-x-2">
              <FileText className="w-5 h-5 text-stone-500" />
              <h2 className="text-lg font-bold text-stone-900">Ulasan & Rekomendasi AI</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Ringkasan</h3>
                <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-[#e8e4dc]">{aiReport.summary}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center bg-emerald-50 w-max px-3 py-1 rounded-lg border border-emerald-100">
                  <ThumbsUp className="w-4 h-4 mr-2" /> Kekuatan Utama
                </h3>
                <ul className="space-y-2 ml-1">
                  {aiReport.strengths.map((s: string, i: number) => (
                    <li key={i} className="flex items-start text-sm text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 mr-3 flex-shrink-0"></span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-rose-800 mb-3 flex items-center bg-rose-50 w-max px-3 py-1 rounded-lg border border-rose-100">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Catatan Utama
                </h3>
                <ul className="space-y-2 ml-1">
                  {aiReport.majorConcerns.map((c: string, i: number) => (
                    <li key={i} className="flex items-start text-sm text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 mr-3 flex-shrink-0"></span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-stone-100 pt-5">
                <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Rekomendasi Keputusan AI:</p>
                <div className="inline-block bg-amber-50 text-amber-800 font-bold px-4 py-2 rounded-lg border border-amber-200">
                  {aiReport.recommendation}
                </div>
              </div>
            </div>
          </div>

          {/* Manual Review Form */}
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden sticky top-6">
            <div className="bg-stone-50 px-6 py-4 border-b border-[#e8e4dc] flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-stone-500" />
              <h2 className="text-lg font-bold text-stone-900">Formulir Keputusan Penilai</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Nilai / Skor Manual (0 - 100)</label>
                <input
                  type="number" min="0" max="100" placeholder="Contoh: 85"
                  value={manualScore}
                  onChange={(e) => setManualScore(Number(e.target.value))}
                  className="w-1/2 border border-[#e8e4dc] bg-white rounded-xl p-3 text-lg font-bold text-stone-900 focus:ring-rose-400 focus:border-rose-400 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-2">Catatan Penilai (Komentar)</label>
                <textarea
                  rows={5}
                  placeholder="Tuliskan evaluasi mendalam, saran perbaikan, atau catatan untuk penulis di sini..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border border-[#e8e4dc] bg-white rounded-xl p-4 text-sm text-stone-700 focus:ring-rose-400 focus:border-rose-400 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
              <div className="border-t border-stone-100 pt-6">
                <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-4">Pilih Keputusan Akhir:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button onClick={() => submitDecision('ACCEPT', 'TERIMA')} disabled={submitting}
                    className="flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 group">
                    <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /><span>TERIMA</span>
                  </button>
                  <button onClick={() => submitDecision('MINOR_REVISION', 'REVISI MINOR')} disabled={submitting}
                    className="flex items-center justify-center space-x-2 bg-sky-50 text-sky-800 hover:bg-sky-600 hover:text-white border border-sky-200 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 group">
                    <RotateCcw className="w-5 h-5 group-hover:-rotate-45 transition-transform" /><span>REVISI MINOR</span>
                  </button>
                  <button onClick={() => submitDecision('MAJOR_REVISION', 'REVISI MAYOR')} disabled={submitting}
                    className="flex items-center justify-center space-x-2 bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-200 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 group">
                    <AlertTriangle className="w-5 h-5 group-hover:scale-110 transition-transform" /><span>REVISI MAYOR</span>
                  </button>
                  <button onClick={() => submitDecision('REJECT', 'TOLAK')} disabled={submitting}
                    className="flex items-center justify-center space-x-2 bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white border border-rose-200 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 group">
                    <XCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /><span>TOLAK</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-white border border-[#e8e4dc] text-stone-900 px-6 py-4 rounded-2xl shadow-xl flex items-center space-x-3 z-50">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
