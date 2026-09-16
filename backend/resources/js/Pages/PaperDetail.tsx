import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { ResearcherLayout } from '../Layouts/ResearcherLayout';
import { Badge } from '../Components/Badge';
import { ScoreCard } from '../Components/ScoreCard';
import { WeaknessCard } from '../Components/WeaknessCard';
import { ChatWidget } from '../Components/ChatWidget';
import { Paper } from '../types/paper';

// Fallback data dummy jika backend belum mengirim props
import dummyData from '../dummy_analysis.json';

// Helper: Bentuk data dummy menjadi format Paper yang kompatibel
const DUMMY_PAPER: Partial<Paper> = {
  id: 0,
  title: dummyData.metadata.title,
  abstract: dummyData.metadata.abstract,
  publication_year: dummyData.metadata.publication_year,
  journal: dummyData.metadata.journal,
  doi: dummyData.metadata.doi,
  authors: dummyData.metadata.authors.map((name, i) => ({ id: i, paper_id: 0, name })),
  analyses: [{
    id: 0,
    paper_id: 0,
    research_domain: dummyData.classification.research_domain,
    research_type: dummyData.classification.research_type,
    key_findings: null,
    strengths: null,
    weaknesses: null,
    keywords: null,
  }],
  scores: {
    id: 0,
    paper_id: 0,
    overall_score: dummyData.scoring.overall,
    methodology_score: dummyData.scoring.methodology.score,
    methodology_reason: dummyData.scoring.methodology.reason,
    novelty_score: dummyData.scoring.novelty.score,
    novelty_reason: dummyData.scoring.novelty.reason,
    clarity_score: 82,
    clarity_reason: 'Penulisan cukup jelas dan terstruktur dengan baik.',
    evidence_score: 85,
    evidence_reason: 'Bukti eksperimen kuat dengan dataset standar industri.',
    reproducibility_score: dummyData.scoring.reproducibility.score,
    reproducibility_reason: dummyData.scoring.reproducibility.reason,
    writing_score: 88,
    writing_reason: 'Tata bahasa dan penyajian sangat baik.',
  },
  findings: dummyData.findings as any,
};

interface PaperDetailProps {
  paper?: Paper | null;
}

export default function PaperDetail() {
  // Terima props dari Inertia (Controller)
  const { props } = usePage<{ paper?: Paper }>();
  
  // Gunakan data dari Inertia props, atau fallback ke dummy jika kosong/null
  const paper: Partial<Paper> = props.paper ?? DUMMY_PAPER;
  const isUsingDummy = !props.paper;

  const scores = paper.scores;
  const analysis = paper.analyses?.[0];

  return (
    <ResearcherLayout activeMenu="my-papers">
      <div className="max-w-6xl mx-auto pb-20">
        
        {/* Banner peringatan jika pakai dummy */}
        {isUsingDummy && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs px-4 py-2 rounded-lg">
            ⚠️ <strong>Mode Pratinjau:</strong> Menampilkan data dummy karena backend belum mengirim props. Hubungkan controller ke route Inertia untuk data riil.
          </div>
        )}

        {/* Header / Metadata */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">
              {paper.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {analysis && <Badge color="blue">{analysis.research_domain}</Badge>}
              {analysis && <Badge color="green">{analysis.research_type}</Badge>}
              {paper.is_submission && <Badge color="yellow">Kirim ke Jurnal</Badge>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
            <div>
              <p className="text-gray-500 font-medium mb-1">Penulis</p>
              <p className="text-gray-900">{paper.authors?.map(a => a.name).join(', ') || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Tahun Publikasi</p>
              <p className="text-gray-900">{paper.publication_year || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">Jurnal</p>
              <p className="text-gray-900">{paper.journal || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium mb-1">DOI</p>
              {paper.doi ? (
                <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate block">
                  {paper.doi}
                </a>
              ) : <p className="text-gray-900">—</p>}
            </div>
          </div>

          {paper.abstract && (
            <div>
              <p className="text-gray-500 font-medium mb-1 text-sm">Abstrak</p>
              <p className="text-gray-700 text-sm leading-relaxed">{paper.abstract}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Skor */}
          <div className="lg:col-span-2 space-y-6">
            {scores && (
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
                      {scores.overall_score}
                      <span className="text-lg text-blue-500 font-normal">/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScoreCard title="Metodologi" score={scores.methodology_score} reason={scores.methodology_reason} />
                    <ScoreCard title="Kebaruan (Novelty)" score={scores.novelty_score} reason={scores.novelty_reason} />
                    <ScoreCard title="Kejelasan (Clarity)" score={scores.clarity_score} reason={scores.clarity_reason} />
                    <ScoreCard title="Bukti (Evidence)" score={scores.evidence_score} reason={scores.evidence_reason} />
                    <ScoreCard title="Reproduksibilitas" score={scores.reproducibility_score} reason={scores.reproducibility_reason} />
                    <ScoreCard title="Kualitas Penulisan" score={scores.writing_score} reason={scores.writing_reason} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Temuan */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Temuan Kesalahan & Risiko</h2>
              </div>
              <div className="p-4">
                {paper.findings && paper.findings.length > 0 ? (
                  paper.findings.map((finding, idx) => (
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

      <ChatWidget />
    </ResearcherLayout>
  );
}
