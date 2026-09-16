import React from 'react';
import { usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { Badge } from '@/Components/Badge';
import { ScoreCard } from '@/Components/ScoreCard';
import { WeaknessCard } from '@/Components/WeaknessCard';
import { ChatWidget } from '@/Components/ChatWidget';
import { Paper } from '@/types/paper';

import dummyData from '@/dummy_analysis.json';

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

export default function PaperDetail() {
  const { props } = usePage<{ paper?: Paper }>();
  
  const paper: Partial<Paper> = props.paper ?? DUMMY_PAPER;
  const isUsingDummy = !props.paper;

  const scores = paper.scores;
  const analysis = paper.analyses?.[0];

  return (
    <AppLayout defaultRole="peneliti">
      <div className="max-w-6xl mx-auto p-6 md:p-8 pb-20">
        
        {isUsingDummy && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-xl shadow-sm flex items-center">
            <span className="mr-2">⚠️</span>
            <span><strong>Mode Pratinjau:</strong> Menampilkan data dummy karena backend belum mengirim props. Hubungkan controller ke route Inertia untuk data riil.</span>
          </div>
        )}

        {/* Header / Metadata */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
            <h1 className="text-3xl font-bold text-slate-900 leading-tight flex-1">
              {paper.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {analysis && <Badge color="blue">{analysis.research_domain}</Badge>}
              {analysis && <Badge color="green">{analysis.research_type}</Badge>}
              {paper.is_submission && <Badge color="yellow">Kirim ke Jurnal</Badge>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
            <div>
              <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Penulis</p>
              <p className="text-slate-800 font-medium">{paper.authors?.map(a => a.name).join(', ') || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Tahun Publikasi</p>
              <p className="text-slate-800 font-medium">{paper.publication_year || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Jurnal</p>
              <p className="text-slate-800 font-medium">{paper.journal || '—'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">DOI</p>
              {paper.doi ? (
                <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate block">
                  {paper.doi}
                </a>
              ) : <p className="text-slate-800 font-medium">—</p>}
            </div>
          </div>

          {paper.abstract && (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-slate-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">Abstrak</p>
              <p className="text-slate-700 text-sm leading-relaxed">{paper.abstract}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Skor */}
          <div className="lg:col-span-2 space-y-8">
            {scores && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 p-5 border-b border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900">Skor Kualitas Riset</h2>
                </div>
                <div className="p-6">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8">
                    <div>
                      <h3 className="text-lg font-bold text-indigo-900">Skor Keseluruhan</h3>
                      <p className="text-sm text-indigo-700 mt-1">Berdasarkan evaluasi otomatis AI</p>
                    </div>
                    <div className="text-5xl font-extrabold text-indigo-700 tracking-tight">
                      {scores.overall_score}
                      <span className="text-xl text-indigo-400 font-normal">/100</span>
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
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">Temuan Kesalahan & Risiko</h2>
              </div>
              <div className="p-5">
                {paper.findings && paper.findings.length > 0 ? (
                  <div className="space-y-4">
                    {paper.findings.map((finding, idx) => (
                      <WeaknessCard key={idx} finding={finding} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-slate-500 font-medium">Tidak ada temuan signifikan.</p>
                    <p className="text-xs text-slate-400 mt-1">Paper ini terlihat sangat baik.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <ChatWidget />
    </AppLayout>
  );
}
