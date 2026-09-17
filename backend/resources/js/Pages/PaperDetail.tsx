import React, { useState } from "react";
import { usePage, Link } from "@inertiajs/react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Badge } from "@/Components/Badge";
import { ScoreCard } from "@/Components/ScoreCard";
import { WeaknessCard } from "@/Components/WeaknessCard";
import { ChatWidget } from "@/Components/ChatWidget";
import { ConfirmModal } from "@/Components/ConfirmModal";
import { Paper } from "@/types/paper";
import { PageProps } from "@/types";
import axios from "axios";
import { ArrowLeft, Download, Send, RotateCcw } from "lucide-react";

export default function PaperDetail() {
    const { props } = usePage<PageProps<{ paper?: Paper }>>();
    const paper = props.paper;
    const [isActionLoading, setIsActionLoading] = useState(false);

    // ── ConfirmModal State ──
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Ya, Lanjutkan',
        variant: 'warning',
        onConfirm: () => {},
    });

    const closeModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

    const handleAction = (action: 'submit' | 'withdraw') => {
        if (!paper || isActionLoading) return;
        setConfirmModal({
            isOpen: true,
            title: action === 'submit' ? 'Kirim ke Jurnal?' : 'Tarik untuk Revisi Mandiri?',
            message: action === 'submit'
                ? 'Paper ini akan dikirim ke editor jurnal. Tindakan ini tidak dapat dibatalkan.'
                : 'Paper akan ditarik dari antrian pengajuan dan dikembalikan ke status Draft untuk revisi mandiri.',
            confirmLabel: action === 'submit' ? 'Ya, Kirim ke Jurnal' : 'Ya, Tarik & Revisi',
            variant: action === 'submit' ? 'info' : 'warning',
            onConfirm: async () => {
                closeModal();
                setIsActionLoading(true);
                try {
                    await axios.post(`/api/papers/${paper.id}/${action}`);
                    window.location.reload();
                } catch (error: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Terjadi Kesalahan',
                        message: error.response?.data?.error || 'Terjadi kesalahan saat memproses permintaan.',
                        confirmLabel: 'Tutup',
                        variant: 'danger',
                        onConfirm: closeModal,
                    });
                } finally {
                    setIsActionLoading(false);
                }
            },
        });
    };

    // ── Review Form Submit Confirm ──
    const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.target as any;
        setConfirmModal({
            isOpen: true,
            title: 'Kirim Keputusan Review?',
            message: 'Keputusan review Anda akan dikirim dan tidak dapat diubah setelah dikonfirmasi.',
            confirmLabel: 'Ya, Kirim Review',
            variant: 'info',
            onConfirm: () => {
                closeModal();
                axios.post(`/api/papers/${paper!.id}/reviews`, {
                    score: form.score.value,
                    recommendation: form.recommendation.value,
                    comments: form.comments.value
                }).then(() => {
                    window.location.reload();
                }).catch(() => {
                    setConfirmModal({
                        isOpen: true,
                        title: 'Gagal Mengirim Review',
                        message: 'Terjadi kesalahan saat mengirim review. Silakan coba kembali.',
                        confirmLabel: 'Tutup',
                        variant: 'danger',
                        onConfirm: closeModal,
                    });
                });
            },
        });
    };

    // ── Back Button Helper ──
    const getBackInfo = () => {
        if (window.location.pathname.startsWith('/upload')) {
            return { href: '/upload', label: 'Kembali ke Unggah Paper' };
        }
        if (props.auth?.peran === 'admin') {
            return { href: '/admin/papers', label: 'Kembali ke Master Paper' };
        }
        if (props.auth?.peran === 'reviewer') {
            return { href: '/reviewer', label: 'Kembali ke Daftar Review' };
        }
        return { href: '/detail', label: 'Kembali ke Paper Saya' };
    };
    const backInfo = getBackInfo();

    if (!paper) {
        return (
            <AppLayout>
                <div className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 border border-stone-200 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-stone-800 mb-2">Belum Ada Paper yang Dipilih</h2>
                    <p className="text-stone-500 max-w-md mx-auto mb-8">
                        Silakan pilih paper dari menu{" "}
                        <span className="font-semibold text-rose-600">Paper Saya</span>{" "}
                        atau kembali ke halaman Unggah untuk menganalisis paper baru.
                    </p>
                </div>
            </AppLayout>
        );
    }

    const scores = paper.scores;
    const analysis = paper.analyses?.[0];

    return (
        <AppLayout>
            {/* ConfirmModal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeModal}
            />

            <div className="max-w-6xl mx-auto p-6 md:p-8 pb-24">

                {/* ── Back Button (Kontras) ── */}
                <div className="mb-6 flex justify-between items-center">
                    <Link
                        href={backInfo.href}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#e8e4dc] bg-white text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 font-semibold text-sm transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>{backInfo.label}</span>
                    </Link>
                </div>

                {/* ── Header / Metadata ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] p-8 mb-8">
                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <h1 className="text-3xl font-bold text-stone-900 leading-tight flex-1">
                            {paper.title}
                        </h1>
                        <div className="flex flex-wrap gap-2">
                            <Badge color={paper.status === 'FAILED' ? 'red' : paper.status === 'PROCESSING' ? 'yellow' : 'green'}>
                                {paper.status}
                            </Badge>
                            {analysis && (
                                <Badge color="blue">{analysis.research_domain}</Badge>
                            )}
                            {analysis && (
                                <Badge color="green">{analysis.research_type}</Badge>
                            )}
                            {paper.is_submission && (
                                <Badge color="yellow">Pengajuan Jurnal</Badge>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
                        <div>
                            <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Penulis</p>
                            <p className="text-stone-800 font-medium">{paper.authors?.map((a) => a.name).join(", ") || "-"}</p>
                        </div>
                        <div>
                            <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Tahun Publikasi</p>
                            <p className="text-stone-800 font-medium">{paper.publication_year || "-"}</p>
                        </div>
                        <div>
                            <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">Jurnal</p>
                            <p className="text-stone-800 font-medium">{paper.journal || "-"}</p>
                        </div>
                        <div>
                            <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">DOI</p>
                            {paper.doi ? (
                                <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="text-rose-600 hover:text-indigo-800 hover:underline font-medium truncate block">
                                    {paper.doi}
                                </a>
                            ) : (
                                <p className="text-stone-800 font-medium">-</p>
                            )}
                        </div>
                    </div>

                    {paper.abstract && (
                        <div className="bg-stone-50 p-5 rounded-xl border border-stone-100">
                            <p className="text-stone-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">Abstrak</p>
                            <p className="text-stone-700 text-sm leading-relaxed">{paper.abstract}</p>
                        </div>
                    )}
                </div>

                {/* ── Action Banner: DRAFT → Submit or Withdraw ── */}
                {paper.is_submission && paper.status === 'ANALYZED' && paper.submission_status === 'DRAFT' && (
                    <div className="bg-[#faf8f5] border-2 border-indigo-100 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                        <div>
                            <h3 className="text-lg font-bold text-stone-900">Tindakan Lanjutan Pengajuan Jurnal</h3>
                            <p className="text-sm text-stone-600 mt-1">Paper ini dipilih untuk dikirim ke Jurnal. Lanjut kirim ke Editor, atau tarik kembali untuk perbaikan mandiri?</p>
                        </div>
                        <div className="flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => handleAction('withdraw')}
                                disabled={isActionLoading}
                                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 font-semibold text-sm transition focus:ring-2 focus:ring-stone-200 disabled:opacity-50"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Tarik &amp; Revisi Mandiri</span>
                            </button>
                            <button
                                onClick={() => handleAction('submit')}
                                disabled={isActionLoading}
                                className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 border border-transparent text-white rounded-xl hover:bg-indigo-700 font-semibold text-sm transition shadow-sm focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                                <span>Lanjut Submit ke Jurnal</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Submission Status Banner ── */}
                {paper.is_submission && paper.submission_status !== 'DRAFT' && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-indigo-900">Status Pengajuan Jurnal: {paper.submission_status}</h3>
                                <p className="text-sm text-indigo-700">Paper ini telah disubmit dan sedang dalam proses jurnal.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Failed ── */}
                {paper.status === 'FAILED' && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center mb-8 shadow-sm">
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-rose-900 mb-2">Analisis AI Gagal</h2>
                        <p className="text-rose-700 font-medium mb-2">Sistem gagal memproses dokumen ini karena alasan berikut:</p>
                        <div className="bg-rose-100/50 border border-rose-200 rounded-lg p-4 text-center max-w-2xl mx-auto text-sm text-rose-800 font-medium">
                            {(() => {
                                const errMsg = paper.latest_job?.error_message || "";
                                if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
                                    return "Kuota harian sistem AI telah habis. Silakan coba lagi besok.";
                                }
                                if (errMsg.includes("cURL error") || errMsg.includes("connect to server")) {
                                    return "Sistem tidak dapat terhubung ke server AI. Pastikan layanan AI sedang aktif.";
                                }
                                if (errMsg.includes("timeout") || errMsg.includes("time out")) {
                                    return "Waktu tunggu habis (timeout). Server AI membutuhkan waktu terlalu lama.";
                                }
                                if (errMsg) {
                                    return "Terjadi kesalahan internal pada pemrosesan dokumen oleh AI. Silakan hubungi administrator.";
                                }
                                return "Terjadi kesalahan sistem yang tidak diketahui.";
                            })()}
                        </div>
                    </div>
                )}

                {/* ── Processing ── */}
                {paper.status === 'PROCESSING' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mb-8 shadow-sm">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="animate-spin h-8 w-8 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-amber-900 mb-2">Sedang Diproses</h2>
                        <p className="text-amber-700">Sistem AI masih membaca dan mengekstrak data dari paper ini. Silakan tunggu beberapa saat atau kembali lagi nanti.</p>
                    </div>
                )}

                {/* ── Main Analysis Grid (2 col balanced) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* LEFT: Skor Kualitas Riset */}
                    {scores && (
                        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                            <div className="bg-stone-50 p-5 border-b border-stone-100">
                                <h2 className="text-lg font-bold text-stone-900">Skor Kualitas Riset</h2>
                            </div>
                            <div className="p-6">
                                {/* Overall Score */}
                                <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-xl p-5 mb-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-rose-900">Skor Keseluruhan</h3>
                                        <p className="text-sm text-rose-700 mt-0.5">Berdasarkan evaluasi otomatis AI</p>
                                    </div>
                                    <div className="text-5xl font-extrabold text-rose-700 tracking-tight">
                                        {scores.overall_score}
                                        <span className="text-xl text-rose-400 font-normal">/100</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
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

                    {/* RIGHT: Temuan Kesalahan & Risiko */}
                    {paper.status === 'ANALYZED' && (
                        <div className="space-y-8">
                            {/* Temuan */}
                            <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                <div className="bg-stone-50 p-5 border-b border-stone-100">
                                    <h2 className="text-lg font-bold text-stone-900">Temuan Kesalahan &amp; Risiko</h2>
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
                                            <p className="text-sm text-stone-500 font-medium">Tidak ada temuan signifikan.</p>
                                            <p className="text-xs text-stone-400 mt-1">Paper ini terlihat sangat baik.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Review Form (Reviewer) */}
                            {props.auth?.user && paper.submission_status === 'IN_REVIEW' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                    <div className="bg-indigo-50 p-5 border-b border-indigo-100">
                                        <h2 className="text-lg font-bold text-indigo-900">Input Hasil Review</h2>
                                        <p className="text-xs text-indigo-600 mt-0.5">Berikan penilaian akhir Anda sebagai reviewer</p>
                                    </div>
                                    <div className="p-6">
                                        <form onSubmit={handleReviewSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Skor Akhir (0–100)</label>
                                                    <input
                                                        required
                                                        name="score"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-4 py-2.5 text-sm text-stone-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Rekomendasi Kelayakan</label>
                                                    <select
                                                        required
                                                        name="recommendation"
                                                        className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-4 py-2.5 text-sm text-stone-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition"
                                                    >
                                                        <option value="">-- Pilih Rekomendasi --</option>
                                                        <option value="ACCEPT">ACCEPT — Terima</option>
                                                        <option value="MINOR_REVISION">MINOR REVISION</option>
                                                        <option value="MAJOR_REVISION">MAJOR REVISION</option>
                                                        <option value="REJECT">REJECT — Tolak</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-1.5">Alasan &amp; Komentar</label>
                                                <textarea
                                                    required
                                                    name="comments"
                                                    rows={4}
                                                    placeholder="Tuliskan catatan, alasan keputusan, dan saran perbaikan..."
                                                    className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-4 py-2.5 text-sm text-stone-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white outline-none transition resize-none"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full flex items-center justify-center space-x-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition shadow-sm"
                                            >
                                                <Send className="w-4 h-4" />
                                                <span>Kirim Keputusan Review</span>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Show Final Review Result if REVIEWED */}
                            {paper.submission_status === 'REVIEWED' && (
                                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                    <div className="bg-emerald-50 p-5 border-b border-emerald-100 flex items-center justify-between">
                                        <div>
                                            <h2 className="text-lg font-bold text-emerald-900">Hasil Review dari Reviewer</h2>
                                            <p className="text-xs text-emerald-600 mt-0.5">Keputusan final dari proses peer review</p>
                                        </div>
                                        {(!props.auth?.peran || props.auth?.peran === 'researcher' || props.auth?.peran === 'peneliti') && (
                                            <a
                                                href={`/papers/${paper.id}/export-review`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 transition flex-shrink-0"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Ekspor Report</span>
                                            </a>
                                        )}
                                    </div>

                                    {paper.reviews && paper.reviews.length > 0 ? (
                                        <div className="p-6 space-y-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc]">
                                                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">Status Kelayakan</p>
                                                    <Badge color={
                                                        paper.reviews[0].recommendation === 'ACCEPT' ? 'green' :
                                                        paper.reviews[0].recommendation === 'REJECT' ? 'red' : 'yellow'
                                                    }>
                                                        {paper.reviews[0].recommendation}
                                                    </Badge>
                                                </div>
                                                <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc]">
                                                    <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">Skor Reviewer</p>
                                                    <p className="font-bold text-2xl text-stone-900">
                                                        {paper.reviews[0].score}
                                                        <span className="text-sm font-normal text-stone-400"> / 100</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">Komentar &amp; Catatan</p>
                                                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                    {paper.reviews[0].comments || "Tidak ada komentar tambahan."}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-emerald-700 text-sm">
                                            Paper ini telah selesai direview.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {(!props.auth?.peran || props.auth?.peran === 'researcher' || props.auth?.peran === 'peneliti') && (
                <ChatWidget paperId={paper.id!} />
            )}
        </AppLayout>
    );
}
