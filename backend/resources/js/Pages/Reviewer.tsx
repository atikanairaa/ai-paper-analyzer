import React, { useState } from 'react';
import { AppLayout } from '../Layouts/AppLayout';
import { 
  ShieldCheck, AlertTriangle, CheckCircle, FileText, 
  MessageSquare, ThumbsUp, XCircle, RotateCcw, Check
} from 'lucide-react';

export default function Reviewer() {
  const [manualScore, setManualScore] = useState<number | ''>('');
  const [comment, setComment] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const aiReport = {
    summary: "Penelitian ini mengusulkan arsitektur Transformer yang menghilangkan RNN dan CNN sepenuhnya, mengandalkan mekanisme self-attention. Menunjukkan hasil SOTA pada tugas terjemahan mesin (WMT 2014) dengan efisiensi komputasi yang lebih baik dibandingkan arsitektur recurrent.",
    strengths: [
      "Kebaruan (Novelty) yang sangat tinggi dalam NLP.",
      "Detail matematika dijelaskan dengan sangat baik.",
      "Hasil eksperimen menunjukkan peningkatan performa dan efisiensi waktu training."
    ],
    majorConcerns: [
      "Kebutuhan sumber daya komputasi (GPU) untuk replikasi masih cukup tinggi bagi peneliti independen."
    ],
    minorConcerns: [
      "Beberapa hyperparameter tuning tidak dijelaskan alasan pemilihannya secara spesifik."
    ],
    recommendation: "REVISI MINOR"
  };

  return (
    <AppLayout activeMenu="assigned-reviews" defaultRole="reviewer">
      <div className="p-6 md:p-8 font-sans max-w-6xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel Penilai (Reviewer)</h1>
            <p className="text-gray-500 mt-2">Evaluasi Paper: Attention Is All You Need (ID: #102)</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg flex items-center space-x-2 font-medium">
            <ShieldCheck className="w-5 h-5" />
            <span>Mode Reviewer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* AI Recommendation Column */}
          <div className="space-y-6">
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
                    {aiReport.strengths.map((str, idx) => (
                      <li key={idx}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Catatan Utama (Major Concerns)
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
                    {aiReport.majorConcerns.map((conc, idx) => (
                      <li key={idx}>{conc}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-yellow-700 mb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" /> Catatan Tambahan (Minor Concerns)
                  </h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
                    {aiReport.minorConcerns.map((conc, idx) => (
                      <li key={idx}>{conc}</li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-2">
                  <p className="text-sm text-gray-500 mb-1">Rekomendasi Keputusan AI:</p>
                  <div className="inline-block bg-yellow-100 text-yellow-800 font-bold px-4 py-2 rounded-lg border border-yellow-200">
                    {aiReport.recommendation}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Form Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Formulir Keputusan Penilai</h2>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* Score Input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Nilai / Skor Manual (0 - 100)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max="100"
                    placeholder="Contoh: 85"
                    value={manualScore}
                    onChange={(e) => setManualScore(Number(e.target.value))}
                    className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3 text-lg font-medium text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                {/* Comment Textarea */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Catatan Penilai (Komentar)</label>
                  <textarea 
                    rows={5}
                    placeholder="Tuliskan evaluasi mendalam, saran perbaikan, atau catatan untuk penulis di sini..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm text-gray-900 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Decision Buttons */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Pilih Keputusan Akhir:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => triggerToast('Keputusan TERIMA berhasil disimpan!')}
                      className="flex items-center justify-center space-x-2 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white border border-green-200 hover:border-green-600 p-4 rounded-xl font-bold transition-all shadow-sm"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>TERIMA</span>
                    </button>
                    <button 
                      onClick={() => triggerToast('Keputusan REVISI MINOR berhasil disimpan!')}
                      className="flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 hover:border-blue-600 p-4 rounded-xl font-bold transition-all shadow-sm"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>REVISI MINOR</span>
                    </button>
                    <button 
                      onClick={() => triggerToast('Keputusan REVISI MAYOR berhasil disimpan!')}
                      className="flex items-center justify-center space-x-2 bg-orange-50 text-orange-700 hover:bg-orange-500 hover:text-white border border-orange-200 hover:border-orange-500 p-4 rounded-xl font-bold transition-all shadow-sm"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      <span>REVISI MAYOR</span>
                    </button>
                    <button 
                      onClick={() => triggerToast('Keputusan TOLAK berhasil disimpan!')}
                      className="flex items-center justify-center space-x-2 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600 p-4 rounded-xl font-bold transition-all shadow-sm"
                    >
                      <XCircle className="w-5 h-5" />
                      <span>TOLAK</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 z-50">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}
    </AppLayout>
  );
}
