import React, { useState } from 'react';
import { Target, CheckCircle2, Search, GraduationCap, X } from 'lucide-react';

interface ReviewerRecommendation {
    id: number;
    name: string;
    institution: string;
    orcid: string;
    match_percentage: number;
}

interface OrcidRecommendationModalProps {
    isOpen: boolean;
    onClose: () => void;
    paperTitle: string;
}

export const OrcidRecommendationModal: React.FC<OrcidRecommendationModalProps> = ({
    isOpen,
    onClose,
    paperTitle
}) => {
    // Mock recommendations data based on the prompt
    const recommendations: ReviewerRecommendation[] = [
        {
            id: 1,
            name: 'Dr. Hendra Pratama, M.Kom',
            institution: 'Institut Teknologi Bandung',
            orcid: '0000-0002-1825-0097',
            match_percentage: 94
        },
        {
            id: 2,
            name: 'Prof. Siti Aminah, Ph.D',
            institution: 'Universitas Gadjah Mada',
            orcid: '0000-0001-9234-5678',
            match_percentage: 89
        },
        {
            id: 3,
            name: 'Dr. Eng. Agus Hidayat',
            institution: 'Universitas Indonesia',
            orcid: '0000-0003-4567-8901',
            match_percentage: 85
        }
    ];

    const [sentInvitations, setSentInvitations] = useState<number[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleSendInvitation = (id: number) => {
        // Simulate API call
        setTimeout(() => {
            setSentInvitations(prev => [...prev, id]);
            setToastMessage('Undangan review berhasil dikirimkan ke email terdaftar ORCID!');
            setTimeout(() => setToastMessage(null), 3000); // Hide toast after 3s
        }, 500);
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

                    <div className="space-y-4">
                        {recommendations.map(rec => {
                            const isSent = sentInvitations.includes(rec.id);
                            
                            // Color logic based on match percentage
                            const matchColorClass = rec.match_percentage >= 90 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            
                            return (
                                <div key={rec.id} className="bg-white rounded-xl border border-[#e8e4dc] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-stone-300 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                                                {rec.name}
                                                {rec.match_percentage >= 90 && (
                                                    <span title="Sangat Cocok" className="text-rose-500 text-xs">★</span>
                                                )}
                                            </h3>
                                            <div className={`px-2.5 py-1 rounded-full text-xs font-bold border ${matchColorClass}`}>
                                                Kecocokan: {rec.match_percentage}%
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                                            <div className="flex items-center gap-1.5">
                                                <GraduationCap className="w-4 h-4 text-stone-400" />
                                                <span>{rec.institution}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-4 h-4 bg-lime-100 text-lime-700 font-black text-[10px] rounded-full flex items-center justify-center">iD</span>
                                                <a href={`https://orcid.org/${rec.orcid}`} target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-rose-600 hover:underline">
                                                    ORCID: {rec.orcid}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() => handleSendInvitation(rec.id)}
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
