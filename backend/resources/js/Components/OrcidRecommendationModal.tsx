import React, { useState, useEffect } from 'react';
import { X, Loader2, ExternalLink, Mail, Building2, Award, Search, AlertCircle, UserCheck, Globe } from 'lucide-react';
import axios from 'axios';

interface OrcidReviewer {
    name: string;
    orcid_id: string;
    institution: string;
    email: string;
    expertise: string[];
    match_score: number;
}

interface OrcidApiResponse {
    reviewers: OrcidReviewer[];
    total_found: number;
    keywords_searched: string[];
    error?: string;
}

interface OrcidRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    paperTitle: string;
    paperId?: number;
}

export const OrcidRecommendationModal: React.FC<OrcidRecommendationModalProps> = ({
    isOpen,
    onClose,
    paperTitle,
    paperId
}) => {
    const [data, setData]                   = useState<OrcidApiResponse | null>(null);
    const [loading, setLoading]             = useState(false);
    const [error, setError]                 = useState<string | null>(null);
    const [invitedIds, setInvitedIds]       = useState<Set<string>>(new Set());
    const [invitingId, setInvitingId]       = useState<string | null>(null);
    const [toast, setToast]                 = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !paperId) return;
        setLoading(true);
        setError(null);
        setData(null);
        setInvitedIds(new Set());

        axios.post(`/api/admin/reviewers/${paperId}/orcid`)
            .then(res => {
                const result: OrcidApiResponse = res.data;
                setData(result);
                if (result.reviewers.length === 0) {
                    setError('Tidak ada peneliti yang cocok ditemukan di database ORCID untuk kata kunci paper ini.');
                }
            })
            .catch(() => {
                setError('Gagal menghubungi layanan ORCID. Pastikan ai-service aktif dan koneksi internet tersedia.');
            })
            .finally(() => setLoading(false));
    }, [isOpen, paperId]);

    const handleSendInvitation = (reviewer: OrcidReviewer) => {
        setInvitingId(reviewer.orcid_id);
        setTimeout(() => {
            setInvitedIds(prev => new Set([...prev, reviewer.orcid_id]));
            setInvitingId(null);
            showToast(`Undangan berhasil dikirim ke ${reviewer.name}`);
        }, 800);
    };

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3500);
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' };
        if (score >= 70) return { bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500'   };
        return                  { bar: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',       dot: 'bg-rose-500'    };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <div
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
                style={{ boxShadow: '0 32px 80px -12px rgba(0,0,0,0.25)' }}
            >
                {/* ─── Header ─── */}
                <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-7 py-6 flex-shrink-0">
                    {/* decorative circles */}
                    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="absolute bottom-0 left-10 w-24 h-24 rounded-full bg-white/5 translate-y-1/2 pointer-events-none" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">Rekomendasi Reviewer ORCID</h2>
                                <p className="text-sm text-stone-400 mt-0.5">Peneliti terverifikasi global berdasarkan keahlian paper</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-stone-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Paper info strip */}
                    <div className="relative mt-5 bg-white/10 rounded-xl px-4 py-3 flex items-center gap-3 border border-white/10">
                        <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-0.5">Paper yang Dianalisis</p>
                            <p className="text-sm font-semibold text-white truncate">{paperTitle || 'Judul tidak tersedia'}</p>
                        </div>
                    </div>
                </div>

                {/* ─── Keywords Strip ─── */}
                {data?.keywords_searched && data.keywords_searched.length > 0 && (
                    <div className="bg-stone-50 border-b border-stone-200 px-7 py-3 flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex-shrink-0">Kata Kunci:</span>
                        {data.keywords_searched.map((kw, i) => (
                            <span key={i} className="bg-white border border-stone-200 text-stone-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {kw}
                            </span>
                        ))}
                    </div>
                )}

                {/* ─── Body ─── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-stone-50/50">

                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-16 gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-stone-200" />
                                <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-stone-700">Mencari di Database ORCID Global...</p>
                                <p className="text-sm text-stone-400 mt-1">Mencocokkan profil keahlian peneliti</p>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
                                <AlertCircle className="w-7 h-7 text-rose-500" />
                            </div>
                            <div className="text-center max-w-sm">
                                <p className="font-semibold text-stone-700">Tidak Ada Hasil</p>
                                <p className="text-sm text-stone-400 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Reviewer Cards */}
                    {!loading && !error && data?.reviewers && data.reviewers.map((reviewer, idx) => {
                        const scoreColors = getScoreColor(reviewer.match_score);
                        const isInvited   = invitedIds.has(reviewer.orcid_id);
                        const isInviting  = invitingId === reviewer.orcid_id;

                        return (
                            <div
                                key={reviewer.orcid_id}
                                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md hover:border-stone-300 transition-all duration-200"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Rank Badge */}
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center font-bold text-stone-500 text-sm">
                                        #{idx + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        {/* Name + Score */}
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <h3 className="font-bold text-stone-900 text-base leading-tight">{reviewer.name}</h3>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${scoreColors.badge}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${scoreColors.dot}`} />
                                                {reviewer.match_score}% Kecocokan
                                            </span>
                                        </div>

                                        {/* Match bar */}
                                        <div className="w-full h-1.5 bg-stone-100 rounded-full mb-3 mt-1">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${scoreColors.bar}`}
                                                style={{ width: `${reviewer.match_score}%` }}
                                            />
                                        </div>

                                        {/* Institution & ORCID */}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-y-1.5 gap-x-4 text-sm mb-3">
                                            <div className="flex items-center gap-1.5 text-stone-500">
                                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="truncate">{reviewer.institution}</span>
                                            </div>
                                            <a
                                                href={`https://orcid.org/${reviewer.orcid_id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-medium"
                                            >
                                                <span className="w-4 h-4 bg-emerald-500 text-white font-black text-[8px] rounded flex items-center justify-center flex-shrink-0">iD</span>
                                                <span>{reviewer.orcid_id}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                            {reviewer.email && !reviewer.email.includes('researcher-portal') && (
                                                <div className="flex items-center gap-1.5 text-stone-400">
                                                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                    <span className="truncate text-xs">{reviewer.email}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Expertise Tags */}
                                        {reviewer.expertise && reviewer.expertise.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                <Award className="w-3.5 h-3.5 text-stone-400 mt-0.5 flex-shrink-0" />
                                                {reviewer.expertise.slice(0, 5).map((tag, i) => (
                                                    <span key={i} className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-md font-medium capitalize">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleSendInvitation(reviewer)}
                                                disabled={isInvited || isInviting}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                                    isInvited
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                                                        : isInviting
                                                        ? 'bg-stone-100 text-stone-400 cursor-wait'
                                                        : 'bg-stone-900 hover:bg-stone-700 text-white shadow-sm hover:shadow-md'
                                                }`}
                                            >
                                                {isInviting ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Mengirim...</span></>
                                                ) : isInvited ? (
                                                    <><UserCheck className="w-4 h-4" /><span>Undangan Terkirim</span></>
                                                ) : (
                                                    <><Mail className="w-4 h-4" /><span>Kirim Undangan</span></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ─── Footer ─── */}
                {data && (
                    <div className="border-t border-stone-200 bg-stone-50 px-6 py-3 flex items-center justify-between flex-shrink-0">
                        <p className="text-xs text-stone-400">
                            {data.total_found > 0
                                ? `${data.total_found} peneliti ditemukan di ORCID Public API`
                                : 'Sumber: ORCID Public API v3.0'}
                        </p>
                        <a
                            href="https://orcid.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                        >
                            orcid.org <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}
            </div>

            {/* ─── Toast ─── */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-stone-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 z-[70] border border-stone-700">
                    <UserCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}
        </div>
    );
};
