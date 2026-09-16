import React, { useState, useEffect } from 'react';
import { ResearcherLayout } from '../Layouts/ResearcherLayout';
import { Badge } from '../Components/Badge';
import { ScoreCard } from '../Components/ScoreCard';
import { WeaknessCard } from '../Components/WeaknessCard';
import { ChatWidget } from '../Components/ChatWidget';
import { PaperAnalysis } from '../types/paper';
// In a real app we might fetch this via an API or Inertia props
import dummyData from '../dummy_analysis.json';

export default function PaperDetail() {
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);

  useEffect(() => {
    // Simulate loading data
    setAnalysis(dummyData as PaperAnalysis);
  }, []);

  if (!analysis) {
    return (
      <ResearcherLayout>
        <div className="flex items-center justify-center h-full">
           <p className="text-gray-500">Memuat data...</p>
        </div>
      </ResearcherLayout>
    );
  }

  const { metadata, classification, scoring, findings } = analysis;

  return (
    <ResearcherLayout activeMenu="my-papers">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* Header / Metadata */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {metadata.title}
            </h1>
            <div className="flex space-x-2">
              <Badge color="blue">{classification.research_domain}</Badge>
              <Badge color="green">{classification.research_type}</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium mb-1">Penulis</p>
              <p className="text-gray-900">{metadata.authors.join(', ')}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Tahun Publikasi</p>
              <p className="text-gray-900">{metadata.publication_year}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Jurnal</p>
              <p className="text-gray-900">{metadata.journal}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">DOI</p>
              <a href={`https://doi.org/${metadata.doi}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                {metadata.doi}
              </a>
            </div>
          </div>

          <div>
             <p className="text-gray-500 font-medium mb-1 text-sm">Abstrak</p>
             <p className="text-gray-700 text-sm leading-relaxed">{metadata.abstract}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Scores */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Skor Kualitas Riset</h2>
              </div>
              <div className="p-6">
                
                {/* Overall Score */}
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-blue-900">Skor Keseluruhan</h3>
                    <p className="text-sm text-blue-700 mt-1">Berdasarkan evaluasi otomatis AI</p>
                  </div>
                  <div className="text-4xl font-extrabold text-blue-700">
                    {scoring.overall}
                    <span className="text-lg text-blue-500 font-normal">/100</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScoreCard 
                    title="Metodologi" 
                    score={scoring.methodology.score} 
                    reason={scoring.methodology.reason} 
                  />
                  <ScoreCard 
                    title="Kebaruan (Novelty)" 
                    score={scoring.novelty.score} 
                    reason={scoring.novelty.reason} 
                  />
                  <ScoreCard 
                    title="Reproduksibilitas" 
                    score={scoring.reproducibility.score} 
                    reason={scoring.reproducibility.reason} 
                  />
                  {/* Add more score cards here if data supports it */}
                </div>

              </div>
            </div>
            
          </div>

          {/* Right Column: Findings & Weaknesses */}
          <div className="space-y-6">
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Temuan Kesalahan & Risiko</h2>
              </div>
              <div className="p-4">
                {findings.length > 0 ? (
                  findings.map((finding, idx) => (
                    <WeaknessCard key={idx} finding={finding} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Tidak ada temuan signifikan.</p>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Floating AI Chat */}
      <ChatWidget />

    </ResearcherLayout>
  );
}
