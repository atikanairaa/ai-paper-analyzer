import React, { useState } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { Users, FileText, Loader2, Activity } from 'lucide-react';
import axios from 'axios';
import { Paper } from '@/types/paper';
import { Badge } from '@/Components/Badge';

export default function AssignPaper() {
  const { papers, inReviewPapers, reviewers } = usePage<{ papers: Paper[], inReviewPapers: any[], reviewers: any[] }>().props;
  
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState<number | null>(null);

  const getRecommendations = (paperId: number) => {
    setIsLoadingRecs(paperId);
    
    setTimeout(() => {
        const paper = papers.find(p => p.id === paperId);
        const domain = paper?.analyses?.[0]?.research_domain?.toLowerCase() || '';

        const recs = reviewers.filter(r => r.expertise?.toLowerCase() === domain).map(r => ({
            paper_id: paperId,
            reviewer_id: r.id,
            match_percentage: 100,
            reasoning: `Reviewer memiliki keahlian yang persis sama dengan domain paper (${domain})`
        }));

        setRecommendations(recs);
        setIsLoadingRecs(null);
    }, 500);
  };

  const assignReviewer = async (paperId: number, reviewerId: number) => {
    if (!confirm('Tugaskan paper ini ke reviewer tersebut?')) return;
    setIsAssigning(reviewerId);
    try {
        await axios.post('/api/admin/reviewers/assign', {
            paper_id: paperId,
            reviewer_id: reviewerId
        });
        alert('Reviewer berhasil ditugaskan!');
        router.reload();
    } catch (e: any) {
        alert(e.response?.data?.message || 'Gagal menugaskan reviewer.');
    } finally {
        setIsAssigning(null);
    }
  };

  return (
    <AppLayout defaultRole="admin">
      <Head title="Assign Paper" />

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Assign Paper</h1>
          <p className="text-sm text-stone-500 mt-1">Tugaskan paper baru ke reviewer dan pantau status review secara real-time.</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
            {/* Bagian: Paper Menunggu Reviewer */}
            <div>
                <h2 className="text-lg font-bold text-stone-900 flex items-center mb-4"><FileText className="w-5 h-5 mr-2 text-stone-400"/> Paper Perlu Ditugaskan</h2>
                
                {papers.length === 0 ? (
                    <div className="bg-white border border-[#e8e4dc] rounded-2xl p-8 text-center text-stone-500 shadow-sm">
                        Tidak ada paper baru yang perlu di-assign saat ini.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {papers.map(p => (
                            <div key={p.id} className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-stone-900">{p.title}</h3>
                                    <Badge color="blue">{p.analyses?.[0]?.research_domain || 'Umum'}</Badge>
                                </div>
                                <p className="text-sm text-stone-600 mb-6 line-clamp-2">{p.abstract}</p>
                                
                                <div className="border-t border-stone-100 pt-4">
                                    {(() => {
                                        const matchingReviewers = reviewers.filter(r => r.expertise === p.analyses?.[0]?.research_domain);
                                        
                                        if (matchingReviewers.length === 0) {
                                            return <p className="text-sm text-rose-500 font-medium">Tidak ada reviewer yang memiliki bidang keahlian cocok dengan paper ini.</p>;
                                        }

                                        return (
                                            <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
                                                <h4 className="text-sm font-bold text-stone-800 mb-2 flex items-center">
                                                    <Users className="w-4 h-4 mr-2" />
                                                    Rekomendasi Reviewer (Match Domain):
                                                </h4>
                                                {matchingReviewers.map(reviewer => (
                                                    <div key={reviewer.id} className="flex flex-col md:flex-row md:items-center justify-between bg-white p-4 rounded-lg border border-stone-200 shadow-sm">
                                                        <div className="flex-1 mb-3 md:mb-0 pr-4">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="font-bold text-stone-900">{reviewer.name}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-700`}>
                                                                    Match
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-stone-500 mb-1 font-bold text-amber-600">Beban Saat Ini: {reviewer.reviews_count || 0} Paper Aktif</p>
                                                        </div>
                                                        <div>
                                                            <button 
                                                                onClick={() => assignReviewer(p.id, reviewer.id)}
                                                                disabled={isAssigning === reviewer.id}
                                                                className="whitespace-nowrap px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-stone-800 transition"
                                                            >
                                                                Assign Reviewer
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bagian: Pantau Status Review */}
            <div>
                <h2 className="text-lg font-bold text-stone-900 flex items-center mb-4"><Activity className="w-5 h-5 mr-2 text-stone-400"/> Pantau Status Review</h2>
                
                {inReviewPapers && inReviewPapers.length === 0 ? (
                    <div className="bg-white border border-[#e8e4dc] rounded-2xl p-8 text-center text-stone-500 shadow-sm">
                        Tidak ada paper yang sedang dalam proses review.
                    </div>
                ) : (
                    <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Paper</th>
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Reviewer</th>
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                            {inReviewPapers?.map((p: any) => (
                                <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4 max-w-[400px] truncate" title={p.title}>
                                        <Link href={`/detail/${p.id}`} className="font-semibold text-stone-900 hover:text-indigo-600 transition">
                                            {p.title}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-stone-600">
                                        {p.reviews?.[0]?.reviewer?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge color={p.submission_status === 'REVIEWED' ? 'green' : 'yellow'}>
                                            {p.submission_status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>

      </div>
    </AppLayout>
  );
}
