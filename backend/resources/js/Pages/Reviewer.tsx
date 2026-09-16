import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AppLayout } from '../Layouts/AppLayout';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, FileText, 
  MessageSquare, ThumbsUp, XCircle, RotateCcw
} from 'lucide-react';
import { Paper, Review } from '../types/paper';
import axios from 'axios';

interface ReviewerPageProps {
  paper?: Paper | null;
  review?: Review | null; // review yang sudah ada dari DB
}

export default function Reviewer() {
  const { props } = usePage<ReviewerPageProps>();
  const paper = props.paper ?? null;
  const paperId = paper?.id ?? 102; // fallback ID untuk demo

  const [manualScore, setManualScore] = useState<number | ''>(props.review?.score ?? '');
  const [comment, setComment] = useState(props.review?.comments ?? '');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const submitDecision = async (recommendation: 'ACCEPT' | 'MINOR_REVISION' | 'MAJOR_REVISION' | 'REJECT', label: string) => {
    if (!manualScore && manualScore !== 0) {
      triggerToast('Harap isi skor terlebih dahulu!');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/api/papers/${paperId}/reviews`, {
        recommendation,
        score: manualScore,
        comments: comment,
      });
      triggerToast(`✅ Keputusan "${label}" berhasil disimpan!`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Gagal menyimpan keputusan.';
      triggerToast(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Mock AI report (dalam implementasi nyata bisa datang dari props.paper.analyses)
  const aiReport = {
    summary: paper?.analyses?.[0]?.key_findings?.join(' ') 
      || "Penelitian ini mengusulkan arsitektur Transformer yang menghilangkan RNN dan CNN sepenuhnya, mengandalkan mekanisme self-attention. Menunjukkan hasil SOTA pada tugas terjemahan mesin (WMT 2014).",
    strengths: paper?.analyses?.[0]?.strengths?.length 
      ? paper.analyses[0].strengths 
      : ["Kebaruan (Novelty) yang sangat tinggi dalam NLP.", "Detail matematika dijelaskan dengan baik.", "Hasil eksperimen kuat."],
    majorConcerns: paper?.analyses?.[0]?.weaknesses?.length
      ? paper.analyses[0].weaknesses
      : ["Kebutuhan GPU untuk replikasi masih cukup tinggi."],
    recommendation: paper?.scores?.overall_score && paper.scores.overall_score >= 80 ? "TERIMA" : "REVISI MINOR"
  };

  return (
    <AppLayout activeMenu="assigned-reviews" defaultRole="reviewer">
      <div className="p-6 md:p-8 font-sans max-w-6xl mx-auto space-y-8">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Penilai (Reviewer)</h1>
            <p className="text-gray-500 mt-2">
              Evaluasi Paper: <strong>{paper?.title ?? 'Attention Is All You Need'}</strong> (ID: #{paperId})
            </p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center space-x-2 font-medium">
            <ShieldCheck className="w-5 h-5" />
            <span>Mode Reviewer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* AI Recommendation */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-indigo-900">Ulasan & Rekomendasi AI</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Ringkasan</h3>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                    {aiReport.summary}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                    <ThumbsUp className="w-4 h-4 mr-1" /> Kekuatan Utama
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
                    {aiReport.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Catatan Utama (Major Concerns)
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
                    {aiReport.majorConcerns.map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-1">Rekomendasi Keputusan AI:</p>
                  <div className="inline-block bg-yellow-100 text-yellow-800 font-bold px-4 py-2 rounded-lg border border-yellow-200">
                    {aiReport.recommendation}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Formulir Keputusan Penilai</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Nilai / Skor Manual (0 - 100)</label>
                  <input 
                    type="number" min="0" max="100"
                    placeholder="Contoh: 85"
                    value={manualScore}
                    onChange={(e) => setManualScore(Number(e.target.value))}
                    className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3 text-lg font-medium text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Catatan Penilai (Komentar)</label>
                  <textarea 
                    rows={5}
                    placeholder="Tuliskan evaluasi mendalam, saran perbaikan, atau catatan untuk penulis di sini..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  />
                </div>
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Pilih Keputusan Akhir:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => submitDecision('ACCEPT', 'TERIMA')}
                      disabled={submitting}
                      className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 hover:border-green-600 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <CheckCircle className="w-5 h-5" /><span>TERIMA</span>
                    </button>
                    <button 
                      onClick={() => submitDecision('MINOR_REVISION', 'REVISI MINOR')}
                      disabled={submitting}
                      className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <RotateCcw className="w-5 h-5" /><span>REVISI MINOR</span>
                    </button>
                    <button 
                      onClick={() => submitDecision('MAJOR_REVISION', 'REVISI MAYOR')}
                      disabled={submitting}
                      className="flex items-center justify-center space-x-2 bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white border border-orange-200 hover:border-orange-500 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <AlertTriangle className="w-5 h-5" /><span>REVISI MAYOR</span>
                    </button>
                    <button 
                      onClick={() => submitDecision('REJECT', 'TOLAK')}
                      disabled={submitting}
                      className="flex items-center justify-center space-x-2 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 p-4 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                      <XCircle className="w-5 h-5" /><span>TOLAK</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
