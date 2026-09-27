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
import {
    ArrowLeft,
    Download,
    Send,
    RotateCcw,
    BarChart2,
    BookOpen,
    CheckCircle2,
    XCircle,
    BookMarked,
    ExternalLink,
    AlertTriangle,
    Library,
    UploadCloud,
    CreditCard,
    PartyPopper,
} from "lucide-react";
import { RevisionUploadModal } from "@/Components/RevisionUploadModal";

// Helper to build correct PDF URL
function getPdfUrl(path: string): string {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("/storage/")) return path;
    return `/storage/${path}`;
}

// 10 canonical research structure elements
const RESEARCH_ELEMENTS = [
    { key: "problem_statement", label: "Problem Statement", icon: "❶" },
    { key: "research_question", label: "Research Question", icon: "❷" },
    { key: "objective", label: "Objective", icon: "❸" },
    { key: "hypothesis", label: "Hypothesis", icon: "❹" },
    { key: "methodology", label: "Methodology", icon: "❺" },
    { key: "dataset", label: "Dataset / Data", icon: "❻" },
    { key: "experiment", label: "Experiment", icon: "❼" },
    { key: "results", label: "Results", icon: "❽" },
    { key: "conclusion", label: "Conclusion", icon: "❾" },
    { key: "limitation", label: "Limitation", icon: "❿" },
];

type ActiveTab = "dashboard" | "read";

export default function PaperDetail() {
    const { props } = usePage<PageProps<{ paper?: Paper }>>();
    const paper = props.paper;

    const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmLabel: string;
        variant: "danger" | "warning" | "info" | "success";
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        confirmLabel: "Ya, Lanjutkan",
        variant: "warning",
        onConfirm: () => {},
    });

    const closeModal = () =>
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));

    const [revisionModalOpen, setRevisionModalOpen] = useState(false);
    const handleRevisionSubmit = async (file: File | null, notes: string) => {
        if (!file || !paper) return;
        setRevisionModalOpen(false);
        setIsActionLoading(true);

        const formData = new FormData();
        formData.append("file", file);
        if (notes) formData.append("notes", notes);

        try {
            await axios.post(`/papers/${paper.id}/revision`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setConfirmModal({
                isOpen: true,
                title: "Revisi Berhasil Diunggah",
                message:
                    "Naskah revisi Anda telah berhasil dikirim, sedang dianalisis ulang, dan dikembalikan ke reviewer.",
                confirmLabel: "Tutup",
                variant: "success",
                onConfirm: () => {
                    closeModal();
                    window.location.reload();
                },
            });
        } catch (error: any) {
            alert(
                error.response?.data?.message ||
                    "Gagal mengunggah file revisi.",
            );
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleAction = (action: "submit" | "withdraw") => {
        if (!paper || isActionLoading) return;
        setConfirmModal({
            isOpen: true,
            title:
                action === "submit"
                    ? "Kirim ke Jurnal?"
                    : "Tarik untuk Revisi Mandiri?",
            message:
                action === "submit"
                    ? "Paper ini akan dikirim ke editor jurnal. Tindakan ini tidak dapat dibatalkan."
                    : "Paper akan ditarik dari antrian pengajuan dan dikembalikan ke status Draft untuk revisi mandiri.",
            confirmLabel:
                action === "submit"
                    ? "Ya, Kirim ke Jurnal"
                    : "Ya, Tarik & Revisi",
            variant: action === "submit" ? "info" : "warning",
            onConfirm: async () => {
                closeModal();
                setIsActionLoading(true);
                try {
                    await axios.post(`/api/papers/${paper.id}/${action}`);
                    window.location.reload();
                } catch (error: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "Terjadi Kesalahan",
                        message:
                            error.response?.data?.error ||
                            "Terjadi kesalahan saat memproses permintaan.",
                        confirmLabel: "Tutup",
                        variant: "danger",
                        onConfirm: closeModal,
                    });
                } finally {
                    setIsActionLoading(false);
                }
            },
        });
    };

    const handleGeneratePayment = async () => {
        if (!paper || isGeneratingPayment) return;
        setIsGeneratingPayment(true);
        try {
            const response = await axios.post(`/papers/${paper.id}/generate-payment`);
            // Reload the page to get the updated paper object with payment_url
            window.location.reload();
        } catch (error: any) {
            alert(error.response?.data?.error || "Gagal membuat tagihan pembayaran.");
            setIsGeneratingPayment(false);
        }
    };

    const handlePublishPaper = async () => {
        if (!paper) return;
        if (!confirm("Konfirmasi: Paper Anda akan dipublikasikan ke jurnal. Lanjutkan?")) return;
        try {
            await axios.post(`/papers/${paper.id}/publish`);
            window.location.reload();
        } catch (error: any) {
            alert(error.response?.data?.error || "Gagal mempublikasikan paper.");
        }
    };

    const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.target as any;

        const scoreValue = form.score.value;
        const recommendationValue = form.recommendation.value;
        const commentsValue = form.comments.value;

        if (!recommendationValue) {
            alert("Silakan pilih salah satu keputusan (Terima/Revisi/Tolak).");
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: "Kirim Keputusan Review?",
            message:
                "Keputusan review Anda akan dikirim dan tidak dapat diubah setelah dikonfirmasi.",
            confirmLabel: "Ya, Kirim Review",
            variant: "info",
            onConfirm: () => {
                closeModal();
                axios
                    .post(`/papers/${paper!.id}/reviews`, {
                        score: scoreValue,
                        recommendation: recommendationValue,
                        comments: commentsValue,
                    })
                    .then(() => window.location.reload())
                    .catch((error: any) => {
                        console.error(error);
                        const errorMsg = error.response?.data?.message || "Terjadi kesalahan saat mengirim review. Silakan coba kembali.";
                        setConfirmModal({
                            isOpen: true,
                            title: "Gagal Mengirim Review",
                            message: errorMsg,
                            confirmLabel: "Tutup",
                            variant: "danger",
                            onConfirm: closeModal,
                        });
                    });
            },
        });
    };

    const getBackInfo = () => {
        if (window.location.pathname.startsWith("/upload"))
            return { href: "/upload", label: "Kembali ke Unggah Paper" };
        if (props.auth?.peran === "admin")
            return { href: "/admin/papers", label: "Kembali ke Master Paper" };
        if (props.auth?.peran === "reviewer")
            return { href: "/reviewer", label: "Kembali ke Daftar Review" };
        return { href: "/detail", label: "Kembali ke Paper Saya" };
    };
    const backInfo = getBackInfo();

    // ── Empty State ──
    if (!paper) {
        return (
            <AppLayout>
                <div className="max-w-6xl mx-auto p-6 md:p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-6 border border-stone-200 shadow-sm">
                        <BookMarked className="h-10 w-10 text-stone-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-stone-800 mb-2">
                        Belum Ada Paper yang Dipilih
                    </h2>
                    <p className="text-stone-500 max-w-md mx-auto mb-8">
                        Silakan pilih paper dari menu{" "}
                        <span className="font-semibold text-rose-600">
                            Paper Saya
                        </span>{" "}
                        atau kembali ke halaman Unggah untuk menganalisis paper
                        baru.
                    </p>
                </div>
            </AppLayout>
        );
    }

    // Fallbacks yang aman
    const sections = Array.isArray(paper?.sections) ? paper.sections : [];
    const findings = Array.isArray(paper?.findings) ? paper.findings : [];
    const scores = paper?.scores || null;
    const references = paper?.references || {
        total_references: 0,
        recent_references: 0,
        old_references: 0,
        potential_issues: [],
    };
    
    const analysis = paper?.analyses?.[0] || null;
    const isAnalyzed = paper.status === "ANALYZED";
    
    let strengths: string[] = [];
    let weaknesses: string[] = [];

    if (analysis) {
        try {
            const parsed =
                typeof analysis.structured_results === "string"
                    ? JSON.parse(analysis.structured_results)
                    : analysis.structured_results;
            strengths = parsed.strengths || [];
            weaknesses = parsed.weaknesses || [];
        } catch (e) {}
    }

    const existingReview = Array.isArray(paper?.reviews)
        ? paper.reviews[0]
        : paper?.reviews || null;
    const currentScore =
        existingReview?.score || paper?.scores?.overall_score || "";
    const currentComments = existingReview?.comments || "";


    // Build sections lookup map from real data
    const sectionsMap: Record<string, boolean> = {};
    sections.forEach((s) => {
        const normalizedKey = s.section_name.toLowerCase().replace(/\s+/g, "_");
        sectionsMap[normalizedKey] = s.is_found;
        // Also try matching partial keys
        RESEARCH_ELEMENTS.forEach((el) => {
            if (
                s.section_name
                    .toLowerCase()
                    .includes(el.key.replace(/_/g, " ")) ||
                el.key.replace(/_/g, " ").includes(s.section_name.toLowerCase())
            ) {
                sectionsMap[el.key] = s.is_found;
            }
        });
    });

    // Map AI findings key_findings as references to sections
    const analysisSections = analysis?.key_findings || [];

    const pdfUrl = getPdfUrl(paper.file_path);

    return (
        <AppLayout>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeModal}
            />

            <RevisionUploadModal
                isOpen={revisionModalOpen}
                onClose={() => setRevisionModalOpen(false)}
                onSubmit={handleRevisionSubmit}
            />

            <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 pb-8">
                {/* ── Back Button ── */}
                <div className="mb-5 flex items-center justify-between">
                    <Link
                        href={backInfo.href}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#e8e4dc] bg-white text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 font-semibold text-sm transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>{backInfo.label}</span>
                    </Link>
                </div>

                {/* ── 2-Tab Switcher ── */}
                <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm mb-6 overflow-hidden">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab("dashboard")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 text-sm font-semibold transition-all border-b-2 ${
                                activeTab === "dashboard"
                                    ? "bg-rose-50 text-rose-800 border-rose-600"
                                    : "text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-50"
                            }`}
                        >
                            <BarChart2 className="w-4 h-4" />
                            <span>Dashboard Analisis</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("read")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 text-sm font-semibold transition-all border-b-2 ${
                                activeTab === "read"
                                    ? "bg-rose-50 text-rose-800 border-rose-600"
                                    : "text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-50"
                            }`}
                        >
                            <BookOpen className="w-4 h-4" />
                            <span>
                                {props.auth?.peran === "reviewer"
                                    ? "Baca Paper & Review Paper"
                                    : "Baca Paper & Chat AI"}
                            </span>
                        </button>
                    </div>
                </div>

                {/* ════════════════════════════════════════
                    TAB 1: DASHBOARD ANALISIS
                ════════════════════════════════════════ */}
                {activeTab === "dashboard" && (
                    <div className="space-y-6">
                        {/* ── Banner REVISION_REQUIRED ── */}
                        {(paper.submission_status === "REVISION_REQUIRED" ||
                            paper.submission_status === "REVISION") &&
                            props.auth?.user?.id === paper.uploaded_by && (
                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                    <div>
                                        <h3 className="text-lg font-bold text-amber-900">
                                            Paper Memerlukan Revisi
                                        </h3>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Silakan periksa masukan reviewer di
                                            bawah dan unggah naskah yang telah
                                            diperbaiki.
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <button
                                            onClick={() =>
                                                setRevisionModalOpen(true)
                                            }
                                            className="inline-flex items-center space-x-2 px-5 py-3 bg-rose-700 text-white rounded-xl hover:bg-rose-800 font-bold text-sm transition shadow-sm focus:ring-2 focus:ring-rose-200"
                                        >
                                            <UploadCloud className="w-5 h-5" />
                                            <span>Unggah Dokumen Revisi</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                        {/* ── Banner PUBLISHED ── */}
                        {paper.submission_status === "PUBLISHED" &&
                            props.auth?.user?.id === paper.uploaded_by && (
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200">
                                        <span className="text-2xl">🎉</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-900">Paper Berhasil Dipublikasikan!</h3>
                                        <p className="text-sm text-blue-700 mt-1">Paper Anda telah resmi dipublikasikan ke jurnal. Terima kasih telah berkontribusi pada pengembangan ilmu pengetahuan.</p>
                                    </div>
                                </div>
                            )}

                        {/* ── Banner REJECTED ── */}
                        {paper.submission_status === "REJECTED" &&
                            props.auth?.user?.id === paper.uploaded_by && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 border border-red-200">
                                        <span className="text-2xl">❌</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900">Paper Ditolak</h3>
                                        <p className="text-sm text-red-700 mt-1">Mohon maaf, paper Anda tidak diterima untuk dipublikasikan. Silakan baca catatan reviewer untuk perbaikan.</p>
                                    </div>
                                </div>
                            )}

                        {/* ── Banner ACCEPTED ── */}
                        {(paper.submission_status === "ACCEPTED" ||
                            paper.submission_status === "ACCEPT") &&
                            props.auth?.user?.id === paper.uploaded_by && (() => {
                                const isPaid = (paper as any).payment_status === "PAID";
                                return (
                                    <div className={`${isPaid ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200'} border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 ${isPaid ? 'bg-indigo-100 border-indigo-200' : 'bg-emerald-100 border-emerald-200'} rounded-full flex items-center justify-center flex-shrink-0 border`}>
                                                <PartyPopper className={`w-6 h-6 ${isPaid ? 'text-indigo-600' : 'text-emerald-600'}`} />
                                            </div>
                                            <div>
                                                <h3 className={`text-lg font-bold ${isPaid ? 'text-indigo-900' : 'text-emerald-900'}`}>
                                                    {isPaid ? "Pembayaran Selesai — Siap Dipublikasikan!" : "Selamat! Paper Anda Diterima untuk Dipublikasikan"}
                                                </h3>
                                                <p className={`text-sm ${isPaid ? 'text-indigo-700' : 'text-emerald-700'} mt-1`}>
                                                    {isPaid
                                                        ? "Pembayaran Anda telah dikonfirmasi. Klik tombol di bawah untuk mempublikasikan paper Anda ke jurnal."
                                                        : "Silakan selesaikan administrasi publikasi jurnal dengan melakukan pembayaran."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 mt-4 md:mt-0">
                                            {isPaid ? (
                                                /* === STATE 2: Sudah bayar → Tombol Publish === */
                                                <button
                                                    onClick={handlePublishPaper}
                                                    className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-indigo-200"
                                                >
                                                    <span>🚀</span>
                                                    <span>Publikasikan Paper</span>
                                                </button>
                                            ) : (paper as any).payment_url ? (
                                                /* === STATE 1b: Invoice sudah dibuat → Tombol Bayar + Simulasi === */
                                                <div className="flex flex-col items-end gap-2">
                                                    <a
                                                        href={(paper as any).payment_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-emerald-200"
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                        <span>Bayar Biaya Publikasi (DOKU)</span>
                                                    </a>
                                                    {/* Tombol simulasi DEV — hapus di production */}
                                                    <a
                                                        href={`/simulasi-lunas/${paper.id}`}
                                                        className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl hover:bg-amber-200 font-semibold text-xs transition"
                                                        title="Simulasi pembayaran berhasil (DEV only)"
                                                    >
                                                        <span>🧪</span>
                                                        <span>Simulasi Pembayaran Berhasil</span>
                                                    </a>
                                                </div>
                                            ) : (
                                                /* === STATE 1a: Belum ada invoice → Generate Invoice === */
                                                <button
                                                    onClick={handleGeneratePayment}
                                                    disabled={isGeneratingPayment}
                                                    className="inline-flex items-center space-x-2 px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-stone-200 disabled:opacity-50"
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                    <span>{isGeneratingPayment ? "Memproses..." : "Generate Tagihan Pembayaran"}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* ── 1. Metadata Header ── */}
                        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] p-7">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                <h1 className="text-3xl font-bold text-stone-900 leading-tight flex-1">
                                    {paper.title}
                                </h1>
                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                    <Badge
                                        color={
                                            paper.status === "FAILED"
                                                ? "red"
                                                : paper.status === "PROCESSING"
                                                  ? "yellow"
                                                  : "green"
                                        }
                                    >
                                        {paper.status}
                                    </Badge>
                                    {analysis && (
                                        <Badge color="blue">
                                            {analysis.research_domain}
                                        </Badge>
                                    )}
                                    {analysis && (
                                        <Badge color="green">
                                            {analysis.research_type}
                                        </Badge>
                                    )}
                                    {paper.is_submission && (
                                        <Badge color="yellow">
                                            Pengajuan Jurnal
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
                                <div>
                                    <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                                        Penulis
                                    </p>
                                    <p className="text-stone-800 font-medium">
                                        {paper.authors
                                            ?.map((a) => a.name)
                                            .join(", ") || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                                        Tahun Publikasi
                                    </p>
                                    <p className="text-stone-800 font-medium">
                                        {paper.publication_year || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                                        Jurnal
                                    </p>
                                    <p className="text-stone-800 font-medium">
                                        {paper.journal || "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-stone-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                                        DOI
                                    </p>
                                    {paper.doi ? (
                                        <a
                                            href={`https://doi.org/${paper.doi}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-rose-600 hover:text-rose-800 hover:underline font-medium truncate block flex items-center gap-1"
                                        >
                                            {paper.doi}{" "}
                                            <ExternalLink className="w-3 h-3 inline" />
                                        </a>
                                    ) : (
                                        <p className="text-stone-800 font-medium">
                                            —
                                        </p>
                                    )}
                                </div>
                            </div>

                            {paper.is_submission && paper.submission_status && (
                                <div className="flex items-center gap-3 mb-5 px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm">
                                    <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                        <Send className="w-3.5 h-3.5 text-rose-600" />
                                    </div>
                                    <div>
                                        <span className="font-bold text-rose-900">
                                            Status Pengajuan Jurnal:{" "}
                                        </span>
                                        <span className="text-rose-700 font-medium">
                                            {paper.submission_status}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {paper.abstract && (
                                <div className="bg-stone-50 p-5 rounded-xl border border-stone-100">
                                    <p className="text-stone-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">
                                        Abstrak
                                    </p>
                                    <p className="text-stone-700 text-sm leading-relaxed">
                                        {paper.abstract}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* ── Action Banner ── */}
                        {paper.is_submission &&
                            paper.status === "ANALYZED" &&
                            paper.submission_status === "DRAFT" &&
                            props.auth?.user?.id === paper.uploaded_by && (
                                <div className="bg-[#faf8f5] border-2 border-rose-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                                    <div>
                                        <h3 className="text-lg font-bold text-stone-900">
                                            Tindakan Lanjutan Pengajuan Jurnal
                                        </h3>
                                        <p className="text-sm text-stone-600 mt-1">
                                            Paper ini dipilih untuk dikirim ke
                                            Jurnal. Lanjut kirim ke Editor, atau
                                            tarik kembali untuk perbaikan
                                            mandiri?
                                        </p>
                                    </div>
                                    <div className="flex gap-3 flex-shrink-0">
                                        <button
                                            onClick={() =>
                                                handleAction("withdraw")
                                            }
                                            disabled={isActionLoading}
                                            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 font-semibold text-sm transition focus:ring-2 focus:ring-stone-200 disabled:opacity-50"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            <span>
                                                Tarik &amp; Revisi Mandiri
                                            </span>
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleAction("submit")
                                            }
                                            disabled={isActionLoading}
                                            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-rose-700 text-white rounded-xl hover:bg-rose-800 font-semibold text-sm transition shadow-sm focus:ring-2 focus:ring-rose-200 disabled:opacity-50"
                                        >
                                            <Send className="w-4 h-4" />
                                            <span>Lanjut Submit ke Jurnal</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                        {/* ── Failed / Processing States ── */}
                        {paper.status === "FAILED" && (
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center shadow-sm">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="h-8 w-8 text-rose-600" />
                                </div>
                                <h2 className="text-xl font-bold text-rose-900 mb-2">
                                    Analisis AI Gagal
                                </h2>
                                <div className="bg-rose-100/50 border border-rose-200 rounded-lg p-4 text-center max-w-2xl mx-auto text-sm text-rose-800 font-medium">
                                    {(() => {
                                        const errMsg =
                                            paper.latest_job?.error_message ||
                                            "";
                                        if (
                                            errMsg.includes("429") ||
                                            errMsg
                                                .toLowerCase()
                                                .includes("quota")
                                        )
                                            return "Kuota harian sistem AI telah habis. Silakan coba lagi besok.";
                                        if (
                                            errMsg.includes("cURL error") ||
                                            errMsg.includes("connect to server")
                                        )
                                            return "Sistem tidak dapat terhubung ke server AI. Pastikan layanan AI sedang aktif.";
                                        if (
                                            errMsg.includes("timeout") ||
                                            errMsg.includes("time out")
                                        )
                                            return "Waktu tunggu habis (timeout). Server AI membutuhkan waktu terlalu lama.";
                                        if (errMsg)
                                            return "Terjadi kesalahan internal pada pemrosesan dokumen oleh AI.";
                                        return "Terjadi kesalahan sistem yang tidak diketahui.";
                                    })()}
                                </div>
                            </div>
                        )}

                        {paper.status === "PROCESSING" && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center shadow-sm">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="animate-spin h-8 w-8 text-amber-600"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                </div>
                                <h2 className="text-xl font-bold text-amber-900 mb-2">
                                    Sedang Diproses
                                </h2>
                                <p className="text-amber-700">
                                    Sistem AI masih membaca dan mengekstrak data
                                    dari paper ini. Silakan tunggu beberapa saat
                                    atau kembali lagi nanti.
                                </p>
                            </div>
                        )}

                        {/* ── 2. Hasil Review (Full Width) ── */}
                        {(paper.submission_status === "REVIEWED" ||
                            paper.submission_status === "REVISION") && (
                            <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                <div className="bg-emerald-50 p-5 border-b border-emerald-100 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-emerald-900">
                                            Hasil Review dari Reviewer
                                        </h2>
                                        <p className="text-xs text-emerald-600 mt-0.5">
                                            Keputusan final dari proses peer
                                            review
                                        </p>
                                    </div>
                                    {(!props.auth?.peran ||
                                        props.auth?.peran === "researcher" ||
                                        props.auth?.peran === "peneliti") && (
                                        <a
                                            href={`/papers/${paper.id}/export-review`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-semibold text-xs hover:bg-emerald-700 transition"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            <span>Ekspor Report</span>
                                        </a>
                                    )}
                                </div>
                                {paper.reviews && paper.reviews.length > 0 ? (
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc]">
                                                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
                                                    Nama Reviewer
                                                </p>
                                                <p className="font-bold text-sm text-stone-900 truncate">
                                                    {paper.reviews[0].reviewer
                                                        ?.name ||
                                                        "Reviewer Sistem"}
                                                </p>
                                            </div>
                                            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc]">
                                                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
                                                    Status Kelayakan
                                                </p>
                                                <Badge
                                                    color={
                                                        paper.reviews[0]
                                                            .recommendation ===
                                                        "ACCEPT"
                                                            ? "green"
                                                            : paper.reviews[0]
                                                                    .recommendation ===
                                                                "REJECT"
                                                              ? "red"
                                                              : "yellow"
                                                    }
                                                >
                                                    {
                                                        paper.reviews[0]
                                                            .recommendation
                                                    }
                                                </Badge>
                                            </div>
                                            <div className="bg-[#faf8f5] rounded-xl p-4 border border-[#e8e4dc]">
                                                <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
                                                    Skor Reviewer
                                                </p>
                                                <p className="font-bold text-2xl text-stone-900">
                                                    {paper.reviews[0].score}
                                                    <span className="text-sm font-normal text-stone-400">
                                                        {" "}
                                                        / 100
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
                                                Komentar &amp; Catatan
                                            </p>
                                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                                                {paper.reviews[0].comments ||
                                                    "Tidak ada komentar tambahan."}
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

                        {/* ── 3 & 4. Skor + Checklist Side by Side ── */}
                        {isAnalyzed && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {/* LEFT: Skor Kualitas Riset */}
                                {scores && (
                                    <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                        <div className="bg-stone-50 p-5 border-b border-stone-100">
                                            <h2 className="text-lg font-bold text-stone-900">
                                                Skor Kualitas Riset
                                            </h2>
                                        </div>
                                        <div className="p-6">
                                            {/* Overall Score */}
                                            <div className="flex items-center justify-between bg-rose-50 border border-rose-100 rounded-xl p-5 mb-5">
                                                <div>
                                                    <h3 className="text-lg font-bold text-rose-900">
                                                        Skor Keseluruhan
                                                    </h3>
                                                    <p className="text-sm text-rose-700 mt-0.5">
                                                        Berdasarkan evaluasi
                                                        otomatis AI
                                                    </p>
                                                </div>
                                                <div className="text-5xl font-extrabold text-rose-700 tracking-tight">
                                                    {scores.overall_score}
                                                    <span className="text-xl text-rose-400 font-normal">
                                                        /100
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Progress bar overall */}
                                            <div className="w-full bg-stone-100 rounded-full h-2.5 mb-6">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all ${scores.overall_score >= 80 ? "bg-emerald-500" : scores.overall_score >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
                                                    style={{
                                                        width: `${scores.overall_score}%`,
                                                    }}
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <ScoreCard
                                                    title="Metodologi"
                                                    score={
                                                        scores.methodology_score
                                                    }
                                                    reason={
                                                        scores.methodology_reason
                                                    }
                                                />
                                                <ScoreCard
                                                    title="Kebaruan (Novelty)"
                                                    score={scores.novelty_score}
                                                    reason={
                                                        scores.novelty_reason
                                                    }
                                                />
                                                <ScoreCard
                                                    title="Kejelasan (Clarity)"
                                                    score={scores.clarity_score}
                                                    reason={
                                                        scores.clarity_reason
                                                    }
                                                />
                                                <ScoreCard
                                                    title="Bukti (Evidence)"
                                                    score={
                                                        scores.evidence_score
                                                    }
                                                    reason={
                                                        scores.evidence_reason
                                                    }
                                                />
                                                <ScoreCard
                                                    title="Reproduksibilitas"
                                                    score={
                                                        scores.reproducibility_score
                                                    }
                                                    reason={
                                                        scores.reproducibility_reason
                                                    }
                                                />
                                                <ScoreCard
                                                    title="Kualitas Penulisan"
                                                    score={scores.writing_score}
                                                    reason={
                                                        scores.writing_reason
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* RIGHT: Checklist 10 Elemen + Referensi */}
                                <div className="space-y-6">
                                    {/* Checklist 10 Elemen Struktur Riset */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                        <div className="bg-stone-50 p-5 border-b border-stone-100">
                                            <h2 className="text-lg font-bold text-stone-900">
                                                10 Elemen Struktur Riset
                                            </h2>
                                            <p className="text-xs text-stone-500 mt-0.5">
                                                Kelengkapan komponen standar
                                                naskah ilmiah
                                            </p>
                                        </div>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {RESEARCH_ELEMENTS.map((el) => {
                                                    // Check in real sections data by matching section_name
                                                    const realSection =
                                                        sections.find((s) => {
                                                            const sn =
                                                                s.section_name.toLowerCase();
                                                            const ek = el.key
                                                                .toLowerCase()
                                                                .replace(
                                                                    /_/g,
                                                                    " ",
                                                                );
                                                            const el_label =
                                                                el.label.toLowerCase();
                                                            return (
                                                                sn.includes(
                                                                    ek,
                                                                ) ||
                                                                ek.includes(
                                                                    sn,
                                                                ) ||
                                                                sn.includes(
                                                                    el_label,
                                                                ) ||
                                                                el_label.includes(
                                                                    sn,
                                                                )
                                                            );
                                                        });
                                                    const found = realSection
                                                        ? realSection.is_found
                                                        : null; // null = unknown
                                                    return (
                                                        <div
                                                            key={el.key}
                                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                                                found === true
                                                                    ? "bg-emerald-50 border-emerald-200"
                                                                    : found ===
                                                                        false
                                                                      ? "bg-rose-50 border-rose-200"
                                                                      : "bg-stone-50 border-stone-100"
                                                            }`}
                                                        >
                                                            {found === true ? (
                                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                            ) : found ===
                                                              false ? (
                                                                <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                                                            ) : (
                                                                <div className="w-5 h-5 rounded-full border-2 border-stone-300 flex-shrink-0" />
                                                            )}
                                                            <div className="min-w-0">
                                                                <p
                                                                    className={`text-sm font-semibold ${
                                                                        found ===
                                                                        true
                                                                            ? "text-emerald-800"
                                                                            : found ===
                                                                                false
                                                                              ? "text-rose-700"
                                                                              : "text-stone-500"
                                                                    }`}
                                                                >
                                                                    {el.label}
                                                                </p>
                                                                {realSection?.summary && (
                                                                    <p className="text-xs text-stone-500 truncate mt-0.5">
                                                                        {
                                                                            realSection.summary
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {sections.length === 0 && (
                                                <p className="text-xs text-stone-400 text-center mt-4 italic">
                                                    Data elemen belum tersedia —
                                                    AI belum mendeteksi bagian
                                                    struktural.
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Statistik Sitasi & Referensi */}
                                    {references && (
                                        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                            <div className="bg-stone-50 p-5 border-b border-stone-100 flex items-center gap-2">
                                                <Library className="w-5 h-5 text-stone-400" />
                                                <h2 className="text-lg font-bold text-stone-900">
                                                    Statistik Sitasi &amp;
                                                    Referensi
                                                </h2>
                                            </div>
                                            <div className="p-5">
                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                    <div className="bg-stone-50 border border-stone-100 rounded-xl p-4 text-center">
                                                        <p className="text-2xl font-extrabold text-stone-900">
                                                            {
                                                                references.total_references
                                                            }
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mt-1">
                                                            Total Referensi
                                                        </p>
                                                    </div>
                                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                                                        <p className="text-2xl font-extrabold text-emerald-700">
                                                            {
                                                                references.recent_references
                                                            }
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-bold mt-1">
                                                            Terbaru (≤5 thn)
                                                        </p>
                                                    </div>
                                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
                                                        <p className="text-2xl font-extrabold text-amber-700">
                                                            {
                                                                references.old_references
                                                            }
                                                        </p>
                                                        <p className="text-[10px] uppercase tracking-wider text-amber-500 font-bold mt-1">
                                                            Lama (&gt;5 thn)
                                                        </p>
                                                    </div>
                                                </div>
                                                {references.total_references >
                                                    0 && (
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                                                            <span>
                                                                Rasio Referensi
                                                                Terbaru
                                                            </span>
                                                            <span>
                                                                {Math.round(
                                                                    (references.recent_references /
                                                                        references.total_references) *
                                                                        100,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-stone-100 rounded-full h-2">
                                                            <div
                                                                className="h-2 rounded-full bg-emerald-500"
                                                                style={{
                                                                    width: `${Math.round((references.recent_references / references.total_references) * 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                {references.potential_issues &&
                                                    references.potential_issues
                                                        .length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-2">
                                                                Potensi Isu
                                                                Referensi
                                                            </p>
                                                            <ul className="space-y-1.5">
                                                                {references.potential_issues.map(
                                                                    (
                                                                        issue: string,
                                                                        i: number,
                                                                    ) => (
                                                                        <li
                                                                            key={
                                                                                i
                                                                            }
                                                                            className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                                                                        >
                                                                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                                            <span>
                                                                                {
                                                                                    issue
                                                                                }
                                                                            </span>
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── 5. Temuan Kesalahan & Risiko (Full Width) ── */}
                        {isAnalyzed && (
                            <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] overflow-hidden">
                                <div className="bg-stone-50 p-5 border-b border-stone-100">
                                    <h2 className="text-lg font-bold text-stone-900">
                                        Temuan Kesalahan &amp; Risiko
                                    </h2>
                                    <p className="text-xs text-stone-500 mt-0.5">
                                        Isu yang terdeteksi oleh sistem AI dalam
                                        naskah
                                    </p>
                                </div>
                                <div className="p-5">
                                    {findings.length > 0 ? (
                                        <div className="columns-1 md:columns-2 gap-5">
                                            {findings.map(
                                                (finding: any, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        className="break-inside-avoid mb-4"
                                                    >
                                                        <WeaknessCard
                                                            finding={finding}
                                                        />
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                            </div>
                                            <p className="text-sm text-stone-500 font-medium">
                                                Tidak ada temuan signifikan.
                                            </p>
                                            <p className="text-xs text-stone-400 mt-1">
                                                Paper ini terlihat sangat baik.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════
                    TAB 2: BACA PAPER & CHAT AI
                ════════════════════════════════════════ */}
                {activeTab === "read" && (
                    <div
                        className="flex flex-col lg:flex-row gap-5"
                        style={{
                            height: "calc(100vh - 240px)",
                            minHeight: "600px",
                        }}
                    >
                        {/* LEFT 65%: PDF Viewer */}
                        <div className="lg:w-[60%] flex flex-col bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden h-full">
                            <div className="bg-stone-50 px-5 py-3 border-b border-[#e8e4dc] flex items-center gap-2 flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-stone-400" />
                                <span className="font-semibold text-stone-700 text-sm truncate">
                                    Dokumen PDF Asli — {paper.title}
                                </span>
                            </div>
                            <div className="flex-1 min-h-0">
                                {pdfUrl ? (
                                    <iframe
                                        src={(props.auth?.peran === 'admin' || props.auth?.peran === 'reviewer') ? `/papers/${paper.id}/watermark-pdf#navpanes=0&pagemode=none&view=FitH` : `/papers/${paper.id}/pdf-view#navpanes=0&pagemode=none&view=FitH`}
                                        className="w-full h-full border-none"
                                        title="PDF Viewer"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-stone-400">
                                        <p className="text-sm">
                                            File PDF tidak tersedia.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT 35%: Embedded ChatWidget */}
                        <div className="lg:w-[40%] h-full min-h-[400px]">
                            {props.auth?.peran === 'reviewer' ? (
                                <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
                                    {paper.submission_status === "IN_REVIEW" ? (
                                        isAnalyzed ? (
                                            <div className="space-y-6">
                                                {/* Bagian 1: Ringkasan AI */}
                                                <div className="bg-white p-4 rounded-xl border border-[#e8e4dc] shadow-sm">
                                                    <h3 className="text-sm font-bold text-stone-900 mb-2 uppercase tracking-wider">
                                                        Ringkasan AI
                                                    </h3>
                                                    <p className="text-sm text-stone-700 mb-3 leading-relaxed">
                                                        {paper?.abstract || "Tidak ada abstrak."}
                                                    </p>

                                                    {strengths.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                                                Kekuatan
                                                            </p>
                                                            <ul className="list-disc pl-5 text-sm text-stone-700 space-y-1">
                                                                {strengths
                                                                    .slice(0, 3)
                                                                    .map((s: string, i: number) => (
                                                                        <li key={i}>{s}</li>
                                                                    ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {weaknesses.length > 0 && (
                                                        <div className="mb-3">
                                                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                                                Kelemahan
                                                            </p>
                                                            <ul className="list-disc pl-5 text-sm text-stone-700 space-y-1">
                                                                {weaknesses
                                                                    .slice(0, 3)
                                                                    .map((s: string, i: number) => (
                                                                        <li key={i}>{s}</li>
                                                                    ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <form
                                                    onSubmit={handleReviewSubmit}
                                                    className="bg-white p-5 rounded-xl border border-[#e8e4dc] shadow-sm space-y-5"
                                                >
                                                    <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-4 border-b border-[#e8e4dc] pb-2">
                                                        Formulir Keputusan
                                                    </h3>

                                                    <div>
                                                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                                                            Skor Evaluasi (0 - 100)
                                                        </label>
                                                        <input
                                                            required
                                                            name="score"
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            defaultValue={currentScore}
                                                            placeholder="Contoh: 85"
                                                            className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-4 py-3 text-sm text-stone-900 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">
                                                            Catatan Evaluasi Mendalam
                                                        </label>
                                                        <textarea
                                                            required
                                                            name="comments"
                                                            rows={6}
                                                            defaultValue={currentComments}
                                                            placeholder="Tuliskan catatan komprehensif, koreksi naskah, dan saran perbaikan..."
                                                            className="w-full rounded-xl border border-[#e8e4dc] bg-[#faf8f5] px-4 py-3 text-sm text-stone-900 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition resize-y"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">
                                                            Vonis Keputusan Akhir
                                                        </label>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <button
                                                                type="submit"
                                                                onClick={(e) => {
                                                                    (
                                                                        e.currentTarget
                                                                            .form as any
                                                                    ).recommendation.value =
                                                                        "ACCEPT";
                                                                }}
                                                                className="w-full px-4 py-3 bg-[#115e59] hover:bg-[#0f4d4a] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition"
                                                            >
                                                                Terima
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                onClick={(e) => {
                                                                    (
                                                                        e.currentTarget
                                                                            .form as any
                                                                    ).recommendation.value =
                                                                        "MINOR_REVISION";
                                                                }}
                                                                className="w-full px-4 py-3 bg-[#b45309] hover:bg-[#92400e] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition"
                                                            >
                                                                Revisi Minor
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                onClick={(e) => {
                                                                    (
                                                                        e.currentTarget
                                                                            .form as any
                                                                    ).recommendation.value =
                                                                        "MAJOR_REVISION";
                                                                }}
                                                                className="w-full px-4 py-3 bg-[#9a3412] hover:bg-[#7c2d12] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition"
                                                            >
                                                                Revisi Mayor
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                onClick={(e) => {
                                                                    (
                                                                        e.currentTarget
                                                                            .form as any
                                                                    ).recommendation.value =
                                                                        "REJECT";
                                                                }}
                                                                className="w-full px-4 py-3 bg-[#be123c] hover:bg-[#9f1239] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </div>
                                                        <input
                                                            type="hidden"
                                                            name="recommendation"
                                                            defaultValue=""
                                                        />
                                                    </div>
                                                </form>
                                            </div>
                                        ) : (
                                            <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] p-6 text-center text-amber-700 font-bold">
                                                Naskah sedang diproses oleh AI. Mohon tunggu sejenak...
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e4dc] p-6 text-center text-emerald-700 font-bold">
                                            Paper ini telah selesai direview.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <ChatWidget paperId={paper.id!} embedded={true} />
                            )}</div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
