import React, { useState } from 'react';
import { AppLayout } from '@/Layouts/AppLayout';
import { GitCompare, FileText, Check, AlertTriangle } from 'lucide-react';

export default function Compare() {
  const [paperA, setPaperA] = useState('1');
  const [paperB, setPaperB] = useState('2');
  const [isComparing, setIsComparing] = useState(false);

  return (
    <AppLayout defaultRole="peneliti">
      <div className="max-w-6xl mx-auto p-6 md:p-8">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900">Bandingkan Paper</h2>
          <p className="text-stone-500 mt-1">Pilih dua paper untuk melihat perbandingan secara berdampingan.</p>
        </div>

        {/* Selection Card */}
        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full flex-1">
              <label className="block text-sm font-semibold text-stone-700 mb-2">Paper A (Utama)</label>
              <select
                value={paperA}
                onChange={(e) => setPaperA(e.target.value)}
                className="w-full bg-white border border-[#e8e4dc] text-stone-900 rounded-xl p-3 text-sm focus:ring-rose-400 focus:border-rose-400 outline-none transition-colors"
              >
                <option className="bg-white text-stone-900" value="1">Attention Is All You Need</option>
                <option className="bg-white text-stone-900" value="2">BERT: Pre-training of Deep Bidirectional Transformers</option>
                <option className="bg-white text-stone-900" value="3">GPT-3: Language Models are Few-Shot Learners</option>
              </select>
            </div>

            <div className="flex-shrink-0 mt-6 md:mt-0">
              <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 border border-[#e8e4dc]">
                <GitCompare className="w-5 h-5" />
              </div>
            </div>

            <div className="w-full flex-1">
              <label className="block text-sm font-semibold text-stone-700 mb-2">Paper B (Pembanding)</label>
              <select
                value={paperB}
                onChange={(e) => setPaperB(e.target.value)}
                className="w-full bg-white border border-[#e8e4dc] text-stone-900 rounded-xl p-3 text-sm focus:ring-rose-400 focus:border-rose-400 outline-none transition-colors"
              >
                <option className="bg-white text-stone-900" value="1">Attention Is All You Need</option>
                <option className="bg-white text-stone-900" value="2">BERT: Pre-training of Deep Bidirectional Transformers</option>
                <option className="bg-white text-stone-900" value="3">GPT-3: Language Models are Few-Shot Learners</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-stone-100 pt-6">
            <button
              onClick={() => setIsComparing(true)}
              className="bg-rose-700 hover:bg-rose-800 text-white font-semibold py-2.5 px-8 rounded-xl transition-colors flex items-center space-x-2 shadow-sm"
            >
              <GitCompare className="w-4 h-4" />
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

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-stone-100 text-stone-700 uppercase text-[11px] font-bold border-b border-[#e8e4dc]">
                  <tr>
                    <th className="px-6 py-4 w-1/5 tracking-wider">Aspek</th>
                    <th className="px-6 py-4 w-2/5 border-l border-[#e8e4dc] text-rose-800 bg-rose-50">Paper A</th>
                    <th className="px-6 py-4 w-2/5 border-l border-[#e8e4dc] text-stone-700 bg-stone-50">Paper B</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { aspect: 'Topik Riset', a: 'Arsitektur Transformer / NLP', b: 'Pre-training Language Models' },
                    { aspect: 'Metodologi', a: 'Menggunakan mekanisme self-attention penuh, membuang RNN/CNN.', b: 'Bidirectional Encoder Representations dengan Masked LM.' },
                    { aspect: 'Dataset', a: 'WMT 2014 English-to-German', b: 'BooksCorpus & English Wikipedia (16GB)' },
                    { aspect: 'Temuan Utama', a: 'Meningkatkan kecepatan training secara drastis dan mencapai SOTA di translasi.', b: 'Pemahaman konteks dua arah meningkatkan performa di 11 task NLP secara signifikan.' },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-[#e8e4dc] hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-stone-800 bg-stone-50">{row.aspect}</td>
                      <td className="px-6 py-4 border-l border-[#e8e4dc] text-stone-700">{row.a}</td>
                      <td className="px-6 py-4 border-l border-[#e8e4dc] text-stone-700">{row.b}</td>
                    </tr>
                  ))}
                  <tr className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-stone-800 bg-stone-50">Kelemahan</td>
                    <td className="px-6 py-4 border-l border-[#e8e4dc] text-amber-700">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <span>Kebutuhan komputasi tinggi untuk sequence panjang (O(n²)).</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-l border-[#e8e4dc] text-amber-700">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                        <span>Pre-training sangat mahal dan memakan waktu lama.</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-stone-50 p-6 border-t border-[#e8e4dc]">
              <h4 className="font-bold text-stone-900 mb-4 flex items-center">
                <Check className="w-4 h-4 text-emerald-600 mr-2"/> Rekomendasi AI
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 text-sm text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></div>
                  <span><strong className="text-stone-900">Paper mana yang memiliki metodologi lebih kuat?</strong> Paper B memiliki validasi pada lebih banyak downstream tasks (11 tasks), namun Paper A memperkenalkan arsitektur fundamental yang revolusioner.</span>
                </li>
                <li className="flex items-start space-x-3 text-sm text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0"></div>
                  <span><strong className="text-stone-900">Paper mana yang lebih reproducible?</strong> Keduanya menuntut komputasi yang tinggi, namun Paper A sedikit lebih ringan direproduksi dengan GPU standar modern dibandingkan pre-training penuh Paper B.</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
