import React, { useState } from 'react';
import { AppLayout } from '@/Layouts/AppLayout';
import { GitCompare, FileText, Check, AlertTriangle } from 'lucide-react';

export default function Compare() {
  const [paperA, setPaperA] = useState('1');
  const [paperB, setPaperB] = useState('2');
  const [isComparing, setIsComparing] = useState(false);

  const handleCompare = () => {
    setIsComparing(true);
  };

  return (
    <AppLayout defaultRole="peneliti">
      <div className="max-w-6xl mx-auto p-6 md:p-8">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bandingkan Paper</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pilih dua paper untuk melihat perbandingan secara berdampingan.</p>
        </div>

        {/* Selection Area */}
        <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-[#162244] dark:border-slate-700/60 p-6 rounded-2xl mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Paper A (Utama)</label>
              <select
                value={paperA}
                onChange={(e) => setPaperA(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-white rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              >
                <option className="bg-white text-slate-900 dark:bg-[#1e293b] dark:text-white" value="1">Attention Is All You Need</option>
                <option className="bg-white text-slate-900 dark:bg-[#1e293b] dark:text-white" value="2">BERT: Pre-training of Deep Bidirectional Transformers</option>
                <option className="bg-white text-slate-900 dark:bg-[#1e293b] dark:text-white" value="3">GPT-3: Language Models are Few-Shot Learners</option>
              </select>
            </div>

            <div className="flex-shrink-0 mt-6 md:mt-0">
              <div className="w-12 h-12 bg-slate-100 dark:bg-[#182444] rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                <GitCompare className="w-5 h-5" />
              </div>
            </div>

            <div className="w-full flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Paper B (Pembanding)</label>
              <select
                value={paperB}
                onChange={(e) => setPaperB(e.target.value)}
                className="w-full bg-white border border-slate-300 text-slate-900 dark:bg-[#1e293b] dark:border-slate-700 dark:text-white rounded-xl p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
              >
                <option className="bg-white text-slate-900 dark:bg-[#1e293b] dark:text-white" value="1">Attention Is All You Need</option>
                <option className="bg-white text-slate-900 dark:bg-[#1e293b] dark:text-white" value="2">BERT: Pre-training of Deep Bidirectional Transformers</option>
                <option className="bg-white text-slate-900 dark:bg-[#1e293b] dark:text-white" value="3">GPT-3: Language Models are Few-Shot Learners</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 dark:border-slate-700/40 pt-6">
            <button
              onClick={handleCompare}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-8 rounded-xl transition-colors flex items-center space-x-2 shadow-sm"
            >
              <GitCompare className="w-4 h-4" />
              <span>Bandingkan Sekarang</span>
            </button>
          </div>
        </div>

        {/* Comparison Result */}
        {isComparing && (
          <div className="bg-white border border-slate-200/80 shadow-sm dark:bg-[#162244] dark:border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="bg-slate-100 dark:bg-[#182444] p-4 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <h3 className="font-bold text-slate-800 dark:text-white">Hasil Perbandingan</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-[#182444] text-slate-700 dark:text-slate-200 uppercase text-[11px] font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th scope="col" className="px-6 py-4 w-1/5 tracking-wider">Aspek</th>
                    <th scope="col" className="px-6 py-4 w-2/5 border-l border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20">
                      Paper A
                    </th>
                    <th scope="col" className="px-6 py-4 w-2/5 border-l border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/20">
                      Paper B
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1a2a50] transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-[#141f3d]">Topik Riset</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Arsitektur Transformer / NLP</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">Pre-training Language Models</td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1a2a50] transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-[#141f3d]">Metodologi</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      Menggunakan mekanisme self-attention penuh, membuang RNN/CNN.
                    </td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      Bidirectional Encoder Representations dengan Masked LM.
                    </td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1a2a50] transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-[#141f3d]">Dataset</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">WMT 2014 English-to-German</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">BooksCorpus & English Wikipedia (16GB)</td>
                  </tr>

                  <tr className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#1a2a50] transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-[#141f3d]">Temuan Utama</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      Meningkatkan kecepatan training secara drastis dan mencapai SOTA di translasi.
                    </td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                      Pemahaman konteks dua arah meningkatkan performa di 11 task NLP secara signifikan.
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-[#1a2a50] transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-300 bg-slate-50 dark:bg-[#141f3d]">Kelemahan</td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <span>Kebutuhan komputasi tinggi untuk sequence panjang (O(n²)).</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-l border-slate-200 dark:border-slate-800 text-amber-700 dark:text-amber-400">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <span>Pre-training sangat mahal dan memakan waktu lama.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 dark:bg-[#182444] p-6 border-t border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
                <Check className="w-4 h-4 text-emerald-500 mr-2"/> Rekomendasi AI
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                  <span><strong className="text-slate-800 dark:text-white">Paper mana yang memiliki metodologi lebih kuat?</strong> Paper B memiliki validasi pada lebih banyak downstream tasks (11 tasks), namun Paper A memperkenalkan arsitektur fundamental yang revolusioner.</span>
                </li>
                <li className="flex items-start space-x-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0"></div>
                  <span><strong className="text-slate-800 dark:text-white">Paper mana yang lebih reproducible?</strong> Keduanya menuntut komputasi yang tinggi, namun Paper A sedikit lebih ringan direproduksi dengan GPU standar modern dibandingkan pre-training penuh Paper B.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
