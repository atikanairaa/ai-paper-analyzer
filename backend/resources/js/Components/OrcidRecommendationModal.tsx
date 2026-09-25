import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Search, GraduationCap, X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ReviewerRecommendation {
    id?: number;
    name: string;
    institution: string;
    orcid_id?: string;
    orcid?: string;
    email?: string;
    match_score?: number;
    match_percentage?: number;
}

interface OrcidRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    paperTitle: string;
    paperId?: number | null;
}

export const OrcidRecommendationModal: React.FC<OrcidRecommendationModalProps> = ({
    isOpen,
    onClose,
    paperTitle,
    paperId
}) => {
    const [recommendations, setRecommendations] = useState<ReviewerRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sentInvitations, setSentInvitations] = useState<number[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && paperId) {
            fetchRecommendations();
        } else {
            setRecommendations([]);
            setSentInvitations([]);
        }
    }, [isOpen, paperId]);

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get(`/admin/reviewers/recommend-orcid/${paperId}`);
            // FastAPI wraps it in APIResponse { success: true, data: { reviewers: [...] } }
            const reviewersList = res.data?.data?.reviewers || res.data?.reviewers || [];
            setRecommendations(reviewersList);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendInvitation = async (rec: ReviewerRecommendation, index: number) => {
        try {
            await axios.post('/api/admin/reviewers/assign', {
                paper_id: paperId,
                orcid_email: rec.email || `${rec.name.replace(/\s+/g, '').toLowerCase()}@example.com`,
                orcid_name: rec.name
            });
            
            setSentInvitations(prev => [...prev, index]);
            setToastMessage('Undangan review berhasil dikirimkan ke email terdaftar ORCID!');
            setTimeout(() => setToastMessage(null), 3000);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Gagal mengirim undangan');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#e8e4dc] w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-stone-50 to-[#faf8f5] px-6 py-5 border-b border-[#e8e4dc] flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 border border-emerald-100">
                            <Target className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-900">Rekomendasi Reviewer Terverifikasi ORCID</h2>
                            <p className="text-sm text-stone-500 mt-1">Sistem mencocokkan bidang paper dengan profil keahlian peneliti global di ORCID</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-700 bg-white hover:bg-stone-100 p-2 rounded-full transition-colors border border-transparent hover:border-[#e8e4dc]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-[#faf8f5] flex-1">
                    <div className="mb-6">
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Paper Target</p>
                        <div className="bg-white p-3 rounded-xl border border-[#e8e4dc] text-sm font-semibold text-stone-800 shadow-sm">
                            {paperTitle || "Judul Paper Tidak Diketahui"}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-500">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
                            <p>Menghubungkan ke API ORCID Global...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recommendations.length === 0 && !isLoading && (
                                <p className="text-center text-stone-500 py-8">Tidak ada rekomendasi ORCID ditemukan.</p>
                            )}
                            {recommendations.map((rec, index) => {
                                const isSent = sentInvitations.includes(index);
                                const matchVal = rec.match_score || rec.match_percentage || 0;
                                const orcidVal = rec.orcid_id || rec.orcid || 'N/A';
                                
                                const matchColorClass = matchVal >= 90 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                
                                return (
                                    <div key={index} className="bg-white rounded-xl border border-[#e8e4dc] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-stone-300 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                                                    {rec.name}
                                                    {matchVal >= 90 && (
                                                        <span title="Sangat Cocok" className="text-rose-500 text-xs">✨</span>
                                                    )}
                                                </h3>
                                                <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${matchColorClass}`}>
                                                    Kecocokan: {matchVal}%
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                                                <div className="flex items-center gap-1.5">
                                                    <GraduationCap className="w-4 h-4 text-stone-400" />
                                                    <span>{rec.institution}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-4 h-4 bg-lime-100 text-lime-700 font-black text-[10px] rounded-full flex items-center justify-center">iD</span>
                                                    <a href={`https://orcid.org/${orcidVal}`} target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-rose-600 hover:underline">
                                                        ORCID: {orcidVal}
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <button
                                                onClick={() => handleSendInvitation(rec, index)}
                                                disabled={isSent}
                                                className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                                    isSent 
                                                        ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                                                        : 'bg-stone-900 hover:bg-stone-800 text-white shadow-sm border border-transparent'
                                                }`}
                                            >
                                                {isSent ? (
                                                    <>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        <span>Terkirim ✓</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>✉️</span>
                                                        <span>Kirim Undangan</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 bg-stone-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-[70] border border-stone-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="font-medium text-sm">{toastMessage}</span>
                </div>
            )}
        </div>
    );
};
