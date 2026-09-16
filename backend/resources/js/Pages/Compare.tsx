import React, { useState } from 'react';
import { ResearcherLayout } from '../Layouts/ResearcherLayout';
import { GitCompare, FileText, Check, AlertTriangle } from 'lucide-react';

export default function Compare() {
  const [isComparing, setIsComparing] = useState(false);
  const [paperA, setPaperA] = useState('1'); // Mock ID
  const [paperB, setPaperB] = useState('2');

  const handleCompare = () => {
    setIsComparing(true);
  };

  return (
    <ResearcherLayout activeMenu="compare">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Bandingkan Paper</h2>
          <p className="text-gray-500 mt-1">Pilih dua paper untuk melihat perbandingan secara berdampingan.</p>
        </div>

        {/* Selection Area */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paper A (Utama)</label>
              <select 
                value={paperA}
                onChange={(e) => setPaperA(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="1">Attention Is All You Need</option>
                <option value="2">BERT: Pre-training of Deep Bidirectional Transformers</option>
                <option value="3">GPT-3: Language Models are Few-Shot Learners</option>
              </select>
            </div>
            
            <div className="flex-shrink-0 mt-6 md:mt-0">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <GitCompare className="w-6 h-6" />
              </div>
            </div>

            <div className="w-full flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Paper B (Pembanding)</label>
              <select 
                value={paperB}
                onChange={(e) => setPaperB(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="1">Attention Is All You Need</option>
                <option value="2">BERT: Pre-training of Deep Bidirectional Transformers</option>
                <option value="3">GPT-3: Language Models are Few-Shot Learners</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end border-t border-gray-100 pt-6">
            <button 
              onClick={handleCompare}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-8 rounded-lg transition-colors flex items-center space-x-2"
            >
              <GitCompare className="w-4 h-4" />
              <span>Bandingkan Sekarang</span>
            </button>
          </div>
        </div>

        {/* Comparison Result */}
        {isComparing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <h3 className="font-bold text-gray-800">Hasil Perbandingan</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4 w-1/5">Aspek</th>
                    <th scope="col" className="px-6 py-4 w-2/5 border-l border-gray-200 text-blue-800 bg-blue-50/50">
                      Paper A
                    </th>
                    <th scope="col" className="px-6 py-4 w-2/5 border-l border-gray-200 text-indigo-800 bg-indigo-50/50">
                      Paper B
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  
                  {/* Row 1 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">Topik Riset</td>
                    <td className="px-6 py-4 border-l border-gray-200">Arsitektur Transformer / NLP</td>
                    <td className="px-6 py-4 border-l border-gray-200">Pre-training Language Models</td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">Metodologi</td>
                    <td className="px-6 py-4 border-l border-gray-200">
                      Menggunakan mekanisme self-attention penuh, membuang RNN/CNN.
                    </td>
                    <td className="px-6 py-4 border-l border-gray-200">
                      Bidirectional Encoder Representations dengan Masked LM.
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">Dataset</td>
                    <td className="px-6 py-4 border-l border-gray-200">WMT 2014 English-to-German</td>
                    <td className="px-6 py-4 border-l border-gray-200">BooksCorpus & English Wikipedia (16GB)</td>
                  </tr>

                  {/* Row 4 */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">Temuan Utama</td>
                    <td className="px-6 py-4 border-l border-gray-200">
                      Meningkatkan kecepatan training secara drastis dan mencapai SOTA di translasi.
                    </td>
                    <td className="px-6 py-4 border-l border-gray-200">
                      Pemahaman konteks dua arah meningkatkan performa di 11 task NLP secara signifikan.
                    </td>
                  </tr>

                   {/* Row 5 */}
                   <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 bg-gray-50">Kelemahan (Limitation)</td>
                    <td className="px-6 py-4 border-l border-gray-200 text-yellow-700">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Kebutuhan komputasi tinggi untuk sequence panjang (O(n²)).</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-l border-gray-200 text-yellow-700">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>Pre-training sangat mahal dan memakan waktu lama.</span>
                      </div>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <h4 className="font-bold text-gray-800 mb-4">Rekomendasi AI</h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Paper mana yang memiliki metodologi lebih kuat?</strong> Paper B memiliki validasi pada lebih banyak downstream tasks (11 tasks), namun Paper A memperkenalkan arsitektur fundamental yang revolusioner.</span>
                </li>
                <li className="flex items-start space-x-2 text-sm text-gray-700">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span><strong>Paper mana yang lebih reproducible?</strong> Keduanya menuntut komputasi yang tinggi, namun Paper A sedikit lebih ringan direproduksi dengan GPU standar modern dibandingkan pre-training penuh Paper B.</span>
                </li>
              </ul>
            </div>

          </div>
        )}

      </div>
    </ResearcherLayout>
  );
}
