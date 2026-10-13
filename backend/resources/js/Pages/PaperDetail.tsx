import React, { useState } from "react";
import { usePage, Link, router } from "@inertiajs/react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Badge } from "@/Components/Badge";
import { ScoreCard } from "@/Components/ScoreCard";
import { WeaknessCard } from "@/Components/WeaknessCard";
import { ChatWidget } from "@/Components/ChatWidget";
import { ConfirmModal } from "@/Components/ConfirmModal";
import { Paper } from "@/types/paper";
import { PageProps } from "@/types";
import { downloadWordDocument } from "@/utils/wordExport";
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
    RefreshCw,
    Sparkles,
    CreditCard,
    FileText,
    ChevronLeft,
    ChevronRight,
    Printer,
    Clock,
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
    { key: "problem_statement", label: "Problem Statement", icon: "❶", synonyms: ["research problem", "problem", "background"] },
    { key: "research_question", label: "Research Question", icon: "❷", synonyms: ["research questions"] },
    { key: "objective", label: "Objective", icon: "❸", synonyms: ["research objective", "aim", "objectives"] },
    { key: "hypothesis", label: "Hypothesis", icon: "❹", synonyms: ["hypotheses"] },
    { key: "methodology", label: "Methodology", icon: "❺", synonyms: ["method", "methods", "proposed method"] },
    { key: "dataset", label: "Dataset / Data", icon: "❻", synonyms: ["data"] },
    { key: "experiment", label: "Experiment", icon: "❼", synonyms: ["experiments", "setup", "evaluation"] },
    { key: "results", label: "Results", icon: "❽", synonyms: ["result", "findings", "discussion"] },
    { key: "conclusion", label: "Conclusion", icon: "❾", synonyms: ["conclusions"] },
    { key: "limitation", label: "Limitation", icon: "❿", synonyms: ["limitations", "future work"] },
];

function splitHtmlIntoPages(html: string, charsPerPage = 4200): string[] {
    if (!html) return [""];
    const pages: string[] = [];
    let remaining = html;
    while (remaining.length > 0) {
        if (remaining.length <= charsPerPage) {
            pages.push(remaining);
            break;
        }

        // 1. Cek batas paragraf alami </p> mendekati batas halaman
        let splitAt = remaining.lastIndexOf("</p>", charsPerPage);

        // 2. Jika </p> terjadi terlalu awal (< 75% dari kapasitas halaman),
        // potong di batas kalimat (titik) agar halaman tidak kosong melompong
        if (splitAt < charsPerPage * 0.72) {
            const searchWindow = remaining.substring(0, charsPerPage);
            const sentenceMatch = searchWindow.lastIndexOf(". ");

            if (sentenceMatch > charsPerPage * 0.68) {
                // Potong bersih di akhir kalimat dan tutup tag </p>
                const firstPart = remaining.substring(0, sentenceMatch + 1) + "</p>";
                
                // Cari format tag <p ...> pembuka untuk melanjutkan ke halaman berikutnya
                const pTagMatch = remaining.substring(0, sentenceMatch).lastIndexOf("<p");
                let pOpenTag = '<p style="text-align: justify; text-indent: 28px; margin-bottom: 12px; line-height: 1.6;">';
                if (pTagMatch >= 0) {
                    const tagEnd = remaining.indexOf(">", pTagMatch);
                    if (tagEnd > pTagMatch && tagEnd < sentenceMatch) {
                        pOpenTag = remaining.substring(pTagMatch, tagEnd + 1);
                    }
                }
                const secondPart = pOpenTag + remaining.substring(sentenceMatch + 2);
                pages.push(firstPart);
                remaining = secondPart;
                continue;
            }

            if (splitAt < charsPerPage * 0.4) {
                splitAt = remaining.lastIndexOf("</div>", charsPerPage);
                if (splitAt < charsPerPage * 0.4) splitAt = remaining.lastIndexOf("<br", charsPerPage);
            }
        }

        if (splitAt < 0 || splitAt < charsPerPage * 0.3) {
            splitAt = charsPerPage;
        } else {
            splitAt += 4;
        }

        pages.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt);
    }
    return pages.length > 0 ? pages : [""];
}

type ActiveTab = "dashboard" | "read" | "template";

export default function PaperDetail() {
    const { props } = usePage<PageProps<{ paper?: Paper, renderedTemplate?: string }>>();
    const paper = props.paper;

    const handleDownloadWord = () => {
        if (!props.renderedTemplate) return;
        const cleanTitle = (paper?.title || "Draft_Jurnal").replace(/[^a-zA-Z0-9_\-\s]/g, "").substring(0, 60).trim();
        downloadWordDocument(`${cleanTitle || "Draft_Jurnal"}.doc`, props.renderedTemplate, paper?.title || "Draft Template Naskah");
    };



    const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
    const [currentPage, setCurrentPage] = useState(1);
    const pages = React.useMemo(() => splitHtmlIntoPages(props.renderedTemplate || "", 4200), [props.renderedTemplate]);
    const totalPages = pages.length;

    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [totalPages]);

    // Polling halus via Inertia setiap 4 detik tanpa kedip layar penuh jika paper sedang dianalisis (PROCESSING)
    React.useEffect(() => {
        if (paper?.status === "PROCESSING") {
            const interval = setInterval(() => {
                router.reload({
                    only: ["paper"],
                    preserveScroll: true,
                });
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [paper?.status]);
    
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
    const [selectedAccessType, setSelectedAccessType] = useState<"OPEN_ACCESS" | "CLOSED_ACCESS">("OPEN_ACCESS");

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
            setConfirmModal({
                isOpen: true,
                title: "Kesalahan",
                message: error.response?.data?.message || "Gagal mengunggah file revisi.",
                confirmLabel: "Tutup",
                variant: "danger",
                onConfirm: closeModal
            });
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
            const response = await axios.post(`/papers/${paper.id}/generate-payment`, {
                access_type: "OPEN_ACCESS"
            });
            // Reload the page to get the updated paper object with payment_url
            window.location.reload();
        } catch (error: any) {
            setConfirmModal({
                isOpen: true,
                title: "Kesalahan",
                message: error.response?.data?.error || "Gagal membuat tagihan pembayaran.",
                confirmLabel: "Tutup",
                variant: "danger",
                onConfirm: closeModal
            });
            setIsGeneratingPayment(false);
        }
    };

    const [isCheckingPayment, setIsCheckingPayment] = useState(false);

    const handleCheckPayment = async () => {
        if (!paper || isCheckingPayment) return;
        setIsCheckingPayment(true);
        try {
            const res = await axios.post(`/papers/${paper.id}/check-payment`);
            setConfirmModal({
                isOpen: true,
                title: "Status Pembayaran",
                message: res.data?.message || "Status pembayaran berhasil dikonfirmasi.",
                confirmLabel: "OK",
                variant: res.data?.status === "PAID" ? "success" : "info",
                onConfirm: () => {
                    closeModal();
                    window.location.reload();
                }
            });
        } catch (error: any) {
            setConfirmModal({
                isOpen: true,
                title: "Kesalahan",
                message: error.response?.data?.error || error.response?.data?.message || "Gagal memeriksa status pembayaran.",
                confirmLabel: "Tutup",
                variant: "danger",
                onConfirm: closeModal
            });
        } finally {
            setIsCheckingPayment(false);
        }
    };

    const handleConfirmClosedAccess = () => {
        if (!paper || isActionLoading) return;
        setConfirmModal({
            isOpen: true,
            title: "Konfirmasi Pilihan Closed Access?",
            message: "Anda memilih opsi Closed Access (publikasi gratis bagi penulis). Pilihan ini akan disimpan dan notifikasi akan dikirimkan kepada Admin untuk menerbitkan naskah ke katalog. Lanjutkan?",
            confirmLabel: "Ya, Konfirmasi & Ajukan ke Admin",
            variant: "info",
            onConfirm: async () => {
                closeModal();
                setIsActionLoading(true);
                try {
                    const res = await axios.post(`/papers/${paper.id}/choose-access`, {
                        access_type: "CLOSED_ACCESS"
                    });
                    setConfirmModal({
                        isOpen: true,
                        title: "Pilihan Berhasil Dikonfirmasi",
                        message: res.data?.message || "Pilihan Closed Access berhasil disimpan dan notifikasi telah dikirim ke Admin.",
                        confirmLabel: "Tutup",
                        variant: "success",
                        onConfirm: () => {
                            closeModal();
                            window.location.reload();
                        }
                    });
                } catch (error: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "Kesalahan",
                        message: error.response?.data?.error || error.response?.data?.message || "Gagal mengonfirmasi pilihan Closed Access.",
                        confirmLabel: "Tutup",
                        variant: "danger",
                        onConfirm: closeModal
                    });
                } finally {
                    setIsActionLoading(false);
                }
            }
        });
    };

    const handlePublishPaper = async () => {
        if (!paper || isActionLoading) return;
        setConfirmModal({
            isOpen: true,
            title: "Terbitkan Paper ke Jurnal Publik?",
            message: "Sebagai Admin, Anda akan menerbitkan naskah jurnal ini secara resmi ke katalog publik. Peneliti akan menerima notifikasi penerbitan. Lanjutkan?",
            confirmLabel: "Ya, Terbitkan Paper",
            variant: "info",
            onConfirm: async () => {
                closeModal();
                setIsActionLoading(true);
                try {
                    await axios.post(`/papers/${paper.id}/publish`);
                    setConfirmModal({
                        isOpen: true,
                        title: "Publikasi Berhasil!",
                        message: "Paper telah resmi diterbitkan ke katalog jurnal publik dan notifikasi telah dikirimkan ke Peneliti.",
                        confirmLabel: "Tutup",
                        variant: "success",
                        onConfirm: () => {
                            closeModal();
                            window.location.reload();
                        }
                    });
                } catch (error: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "Gagal Menerbitkan",
                        message: error.response?.data?.error || "Gagal mempublikasikan paper.",
                        confirmLabel: "Tutup",
                        variant: "danger",
                        onConfirm: closeModal
                    });
                } finally {
                    setIsActionLoading(false);
                }
            }
        });
    };

    const handleReanalyze = () => {
        if (!paper || isActionLoading) return;
        setConfirmModal({
            isOpen: true,
            title: "Analisis Ulang dengan AI?",
            message: "Sistem akan menjalankan ulang analisis AI menggunakan kriteria penilaian dan prompt terbaru yang telah diatur oleh Admin. Nilai dan ringkasan akan diperbarui.",
            confirmLabel: "Ya, Analisis Ulang",
            variant: "info",
            onConfirm: async () => {
                closeModal();
                setIsActionLoading(true);
                try {
                    await axios.post(`/papers/${paper.id}/reanalyze`);
                    window.location.reload();
                } catch (error: any) {
                    setConfirmModal({
                        isOpen: true,
                        title: "Kesalahan",
                        message: error.response?.data?.message || "Gagal memulai analisis ulang.",
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

    const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.target as any;

        const scoreValue = form.score.value;
        const recommendationValue = form.recommendation.value;
        const commentsValue = form.comments.value;

        if (!recommendationValue) {
            setConfirmModal({
                isOpen: true,
                title: "Perhatian",
                message: "Silakan pilih salah satu keputusan (Terima/Revisi/Tolak).",
                confirmLabel: "Tutup",
                variant: "warning",
                onConfirm: closeModal
            });
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
        // Also try matching partial keys and synonyms
        RESEARCH_ELEMENTS.forEach((el) => {
            const sectionLower = s.section_name.toLowerCase();
            const elKeySpace = el.key.replace(/_/g, " ");
            
            let isMatch = sectionLower.includes(elKeySpace) || elKeySpace.includes(sectionLower);
            
            if (!isMatch && el.synonyms) {
                isMatch = el.synonyms.some(syn => sectionLower.includes(syn) || syn.includes(sectionLower));
            }
            
            if (isMatch) {
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
                {/* ── Back Button & Actions ── */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={backInfo.href}
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#e8e4dc] bg-white text-stone-700 hover:bg-stone-900 hover:text-white hover:border-stone-900 font-semibold text-sm transition-all shadow-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>{backInfo.label}</span>
                    </Link>

                    {/* Reanalyze Button (for uploader/researcher) */}
                    {props.auth?.user?.id === paper.uploaded_by && (
                        <button
                            onClick={handleReanalyze}
                            disabled={isActionLoading || paper.status === "PROCESSING"}
                            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-700 text-white hover:bg-rose-800 disabled:opacity-50 font-semibold text-sm transition-all shadow-sm focus:ring-2 focus:ring-rose-200"
                            title="Analisis ulang naskah menggunakan kriteria dan prompt AI terbaru dari Admin"
                        >
                            <RefreshCw className={`w-4 h-4 ${isActionLoading || paper.status === "PROCESSING" ? "animate-spin" : ""}`} />
                            <span>{paper.status === "PROCESSING" ? "Sedang Dianalisis..." : "Analisis Ulang AI (Re-analyze)"}</span>
                        </button>
                    )}
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
                        <button
                            onClick={() => setActiveTab("template")}
                            className={`flex-1 flex items-center justify-center gap-2.5 py-4 px-6 text-sm font-semibold transition-all border-b-2 ${
                                activeTab === "template"
                                    ? "bg-rose-50 text-rose-800 border-rose-600"
                                    : "text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-50"
                            }`}
                        >
                            <FileText className="w-4 h-4" />
                            <span>Preview Template</span>
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
                        {paper.submission_status === "PUBLISHED" && (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200">
                                    <CheckCircle2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-blue-900">Paper Resmi Dipublikasikan ke Katalog!</h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Naskah ini telah resmi dipublikasikan ke katalog jurnal publik ({paper.access_type === 'CLOSED_ACCESS' ? 'Closed Access' : 'Open Access'}). Terima kasih telah berkontribusi pada publikasi ilmiah.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ── Banner REJECTED ── */}
                        {paper.submission_status === "REJECTED" &&
                            props.auth?.user?.id === paper.uploaded_by && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 border border-red-200">
                                        <XCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-red-900">Paper Ditolak</h3>
                                        <p className="text-sm text-red-700 mt-1">Mohon maaf, paper Anda tidak diterima untuk dipublikasikan. Silakan baca catatan reviewer untuk perbaikan.</p>
                                    </div>
                                </div>
                            )}

                        {/* ── Banner ACCEPTED (Khusus Admin & Peneliti) ── */}
                        {(paper.submission_status === "ACCEPTED" ||
                            paper.submission_status === "ACCEPT") && (() => {
                                const isAdmin = props.auth?.peran === "admin" || (props.auth?.user as any)?.roles?.some((r: any) => r.name === 'admin');
                                const isAuthor = props.auth?.user?.id === paper.uploaded_by;
                                const isPaidOpenAccess = (paper as any).access_type === "OPEN_ACCESS" && (paper as any).payment_status === "PAID";
                                const isClosedAccess = (paper as any).access_type === "CLOSED_ACCESS";
                                const isReadyToPublish = isPaidOpenAccess || isClosedAccess;

                                // JIKA USER ADALAH ADMIN:
                                if (isAdmin) {
                                    if (isReadyToPublish) {
                                        return (
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Send className="w-6 h-6 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-lg font-bold text-indigo-900">
                                                                Naskah Siap Diterbitkan ke Katalog (Wewenang Admin)
                                                            </h3>
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                                                {isPaidOpenAccess ? "Open Access (Lunas)" : "Closed Access"}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-indigo-700 mt-1 max-w-2xl">
                                                            {isPaidOpenAccess
                                                                ? "Peneliti telah melunasi biaya publikasi Open Access. Anda sebagai Admin berwenang untuk menerbitkan naskah ini ke katalog publik agar dapat diakses dan diunduh oleh pembaca."
                                                                : "Peneliti telah mengonfirmasi opsi Closed Access (publikasi gratis bagi penulis). Anda sebagai Admin berwenang untuk menerbitkan naskah ini ke katalog jurnal publik."}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 self-end md:self-center">
                                                    <button
                                                        onClick={handlePublishPaper}
                                                        disabled={isActionLoading}
                                                        className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
                                                    >
                                                        <Send className="w-5 h-5" />
                                                        <span>{isActionLoading ? "Menerbitkan..." : "Terbitkan Paper ke Jurnal (Publish)"}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Admin view saat belum siap terbit (peneliti belum bayar atau belum pilih akses)
                                        return (
                                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-amber-100 border border-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Clock className="w-6 h-6 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="text-lg font-bold text-amber-900">
                                                                Menunggu Administrasi dari Peneliti
                                                            </h3>
                                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                                {(paper as any).access_type ? (paper as any).access_type : "Belum Memilih Akses"}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-amber-700 mt-1 max-w-2xl">
                                                            {(paper as any).access_type === "OPEN_ACCESS"
                                                                ? "Peneliti telah memilih Open Access namun tagihan biaya publikasi belum diselesaikan (UNPAID). Tombol penerbitan akan aktif setelah pembayaran lunas."
                                                                : "Paper telah diterima (ACCEPTED) oleh reviewer. Menunggu peneliti menentukan model akses naskah (Open Access atau Closed Access)."}
                                                        </p>
                                                    </div>
                                                </div>
                                                {(paper as any).payment_url && (
                                                    <div className="flex-shrink-0 self-end md:self-center">
                                                        <a
                                                            href={`/simulasi-lunas/${paper.id}`}
                                                            className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-100 text-amber-900 border border-amber-300 rounded-xl hover:bg-amber-200 font-semibold text-xs transition shadow-sm"
                                                            title="Simulasi pelunasan pembayaran (Khusus testing)"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4 text-amber-700" />
                                                            <span>[Dev] Simulasikan Lunas</span>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                }

                                // JIKA USER BUKAN ADMIN TAPI PENELITI / PEMILIK PAPER:
                                if (isAuthor) {
                                    // 1. Jika sudah lunas Open Access:
                                    if (isPaidOpenAccess) {
                                        return (
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                                <div className="w-12 h-12 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-bold text-indigo-900">
                                                            Pembayaran Terkonfirmasi — Menunggu Penerbitan oleh Admin
                                                        </h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                            PAID (OPEN ACCESS)
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-indigo-700 mt-2">
                                                        Terima kasih! Pembayaran biaya publikasi Open Access Anda telah berhasil diverifikasi. Notifikasi telah otomatis dikirimkan ke <strong>Admin Jurnal</strong> untuk proses penerbitan naskah ke katalog publik. Anda akan mendapatkan notifikasi pemberitahuan segera setelah naskah resmi diterbitkan.
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // 2. Jika sudah konfirmasi Closed Access:
                                    if (isClosedAccess) {
                                        return (
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
                                                <div className="w-12 h-12 bg-indigo-100 border border-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <Clock className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg font-bold text-indigo-900">
                                                            Pilihan Closed Access Disimpan — Menunggu Penerbitan oleh Admin
                                                        </h3>
                                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                                            CLOSED ACCESS
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-indigo-700 mt-2">
                                                        Anda telah memilih opsi <strong>Closed Access</strong> (publikasi gratis bagi penulis). Notifikasi telah dikirimkan kepada <strong>Admin Jurnal</strong> untuk memproses penerbitan paper Anda ke katalog. Anda akan menerima notifikasi segera setelah naskah resmi dipublikasikan.
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    // 3. Jika belum memilih akses atau belum lunas bayar Open Access:
                                    return (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col items-start gap-4 shadow-sm">
                                            <div className="flex items-start gap-4 w-full">
                                                <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-emerald-900">
                                                        {(paper as any).payment_url ? "Selesaikan Pembayaran Publikasi Open Access" : "Selamat! Paper Anda Diterima untuk Dipublikasikan"}
                                                    </h3>
                                                    <p className="text-sm text-emerald-700 mt-1 mb-4">
                                                        {(paper as any).payment_url
                                                            ? "Tagihan pembayaran publikasi telah dibuat. Silakan selesaikan pembayaran agar kami dapat memberi tahu Admin untuk menerbitkan naskah Anda."
                                                            : "Naskah Anda telah disetujui oleh reviewer (ACCEPTED). Silakan tentukan opsi akses naskah Anda:"}
                                                    </p>

                                                    {!(paper as any).payment_url && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mt-4">
                                                            <label className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAccessType === 'OPEN_ACCESS' ? 'border-emerald-500 bg-white shadow-sm ring-1 ring-emerald-500' : 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/50'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name="access_type"
                                                                    value="OPEN_ACCESS"
                                                                    checked={selectedAccessType === 'OPEN_ACCESS'}
                                                                    onChange={() => setSelectedAccessType('OPEN_ACCESS')}
                                                                    className="mt-0.5 accent-emerald-600"
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-bold text-emerald-950">Open Access</p>
                                                                    <p className="text-xs text-emerald-700 mt-0.5">Penulis membayar biaya publikasi (APC). Artikel dapat dibaca & diunduh gratis oleh semua orang.</p>
                                                                </div>
                                                            </label>
                                                            <label className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${selectedAccessType === 'CLOSED_ACCESS' ? 'border-emerald-500 bg-white shadow-sm ring-1 ring-emerald-500' : 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/50'}`}>
                                                                <input
                                                                    type="radio"
                                                                    name="access_type"
                                                                    value="CLOSED_ACCESS"
                                                                    checked={selectedAccessType === 'CLOSED_ACCESS'}
                                                                    onChange={() => setSelectedAccessType('CLOSED_ACCESS')}
                                                                    className="mt-0.5 accent-emerald-600"
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-bold text-emerald-950">Closed Access</p>
                                                                    <p className="text-xs text-emerald-700 mt-0.5">Publikasi gratis bagi penulis. Pembaca/institusi luar yang akan membayar biaya akses naskah.</p>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-shrink-0 self-end mt-2">
                                                {(paper as any).payment_url ? (
                                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                                        <a
                                                            href={(paper as any).payment_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-emerald-200"
                                                        >
                                                            <CreditCard className="w-5 h-5" />
                                                            <span>Bayar Biaya Publikasi (DOKU)</span>
                                                        </a>
                                                        <button
                                                            onClick={handleCheckPayment}
                                                            disabled={isCheckingPayment}
                                                            className="inline-flex items-center space-x-2 px-4 py-3 bg-white border border-emerald-300 text-emerald-800 rounded-xl hover:bg-emerald-50 font-bold text-sm transition shadow-sm"
                                                            title="Verifikasi status pembayaran dari DOKU dan beritahu Admin"
                                                        >
                                                            <RefreshCw className={`w-4 h-4 ${isCheckingPayment ? "animate-spin" : ""}`} />
                                                            <span>{isCheckingPayment ? "Memeriksa..." : "Cek / Konfirmasi Pembayaran"}</span>
                                                        </button>
                                                        <a
                                                            href={`/simulasi-lunas/${paper.id}`}
                                                            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-xl hover:bg-amber-200 font-semibold text-xs transition"
                                                            title="Simulasi pembayaran berhasil (DEV only)"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span>Simulasi Pembayaran Berhasil</span>
                                                        </a>
                                                    </div>
                                                ) : selectedAccessType === 'CLOSED_ACCESS' ? (
                                                    <button
                                                        onClick={handleConfirmClosedAccess}
                                                        disabled={isActionLoading}
                                                        className="inline-flex items-center space-x-2 px-6 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-stone-200 disabled:opacity-50"
                                                    >
                                                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                        <span>{isActionLoading ? "Menyimpan..." : "Konfirmasi Pilihan Closed Access"}</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleGeneratePayment}
                                                        disabled={isGeneratingPayment}
                                                        className="inline-flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-sm transition shadow-md focus:ring-2 focus:ring-emerald-200 disabled:opacity-50"
                                                    >
                                                        <CreditCard className="w-5 h-5" />
                                                        <span>{isGeneratingPayment ? "Memproses..." : "Lanjutkan Pembayaran (Generate Tagihan)"}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }

                                return null;
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
                                {props.auth?.user?.id === paper.uploaded_by && (
                                    <div className="mt-5">
                                        <button
                                            onClick={handleReanalyze}
                                            disabled={isActionLoading}
                                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-rose-700 text-white rounded-xl hover:bg-rose-800 font-semibold text-sm transition shadow-sm"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            <span>Coba Analisis Ulang Sekarang</span>
                                        </button>
                                    </div>
                                )}
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
                                                {(() => {
                                                    // Peta label untuk setiap score field
                                                    const scoreFields = [
                                                        { key: 'methodology', label: 'Metodologi' },
                                                        { key: 'novelty', label: 'Kebaruan (Novelty)' },
                                                        { key: 'evidence', label: 'Bukti (Evidence)' },
                                                        { key: 'clarity', label: 'Kejelasan (Clarity)' },
                                                        { key: 'references', label: 'Referensi & Sitasi' },
                                                        { key: 'reproducibility', label: 'Reproduksibilitas' },
                                                        { key: 'writing', label: 'Kualitas Penulisan' },
                                                    ];

                                                    // Filter: hanya tampilkan yang ada datanya dan skornya > 0
                                                    return scoreFields
                                                        .filter((f) => {
                                                            const scoreKey = `${f.key}_score` as keyof typeof scores;
                                                            const val = scores[scoreKey];
                                                            return val !== undefined && val !== null && Number(val) > 0;
                                                        })
                                                        .map((f) => {
                                                            const scoreKey = `${f.key}_score` as keyof typeof scores;
                                                            const reasonKey = `${f.key}_reason` as keyof typeof scores;
                                                            return (
                                                                <ScoreCard
                                                                    key={f.key}
                                                                    title={f.label}
                                                                    score={Number(scores[scoreKey])}
                                                                    reason={String(scores[reasonKey] || '-')}
                                                                />
                                                            );
                                                        });
                                                })()}
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
                {activeTab === "template" && (
                    <div className="bg-[#e0e0e0] border border-[#e8e4dc] rounded-2xl shadow-sm p-8 min-h-[600px]">
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-stone-900">Preview Template Jurnal</h2>
                                <p className="text-sm text-stone-600">Pratinjau naskah dalam format jurnal A4 (CKEditor 4.22).</p>
                            </div>
                            <div className="flex items-center gap-3">
                                
                                <button
                                    onClick={handleDownloadWord}
                                    className="bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm flex items-center gap-2 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Unduh Word (.doc)</span>
                                </button>
                            </div>
                        </div>

                        {props.renderedTemplate ? (
                            <>
                                {/* Pagination Header */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mb-4 bg-white/50 backdrop-blur-sm rounded-xl px-4 py-3 border border-white">
                                        <span className="text-sm font-semibold text-stone-700">
                                            Halaman {currentPage} dari {totalPages}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage <= 1}
                                                className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                            </button>
                                            {Array.from({ length: totalPages }, (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === i + 1 ? "bg-rose-700 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"}`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage >= totalPages}
                                                className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-50 disabled:opacity-40 transition"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Centered A4 Sheet Simulation */}
                                <div 
                                    className="bg-white shadow-xl rounded-sm border border-stone-200 overflow-hidden relative mb-6 mx-auto transition-all"
                                    style={{
                                        maxWidth: "794px",
                                        minHeight: "1123px",
                                        padding: "96px",
                                        boxSizing: "border-box",
                                        fontFamily: "'Times New Roman', Times, serif",
                                        fontSize: "11pt",
                                        lineHeight: "1.6",
                                        color: "#1c1917",
                                    }}
                                >
                                    <div 
                                        className="ck-content"
                                        dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] || "" }}
                                    />
                                    {/* Page Footer overlay */}
                                    <div 
                                        style={{
                                            position: "absolute",
                                            bottom: "24px",
                                            left: "96px",
                                            right: "96px",
                                            textAlign: "center",
                                            fontSize: "9pt",
                                            color: "#78716c",
                                            borderTop: "1px solid #e7e5e4",
                                            paddingTop: "6px",
                                            backgroundColor: "white",
                                            zIndex: 10
                                        }}
                                    >
                                        {paper?.title || "Naskah Jurnal"} &mdash; Halaman {currentPage} dari {totalPages}
                                    </div>
                                </div>
                                <style>{`
                                    .ck-content h1 { color: #881337; font-size: 22px; font-weight: 900; text-align: center; margin: 18px 0; line-height: 1.3; }
                                    .ck-content h2 { color: #881337; font-size: 15px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; break-after: avoid; }
                                    .ck-content h3 { color: #881337; font-size: 14px; font-weight: bold; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; break-after: avoid; }
                                    .ck-content table { border-collapse: collapse; width: 100%; margin: 12pt 0; break-inside: avoid; }
                                    .ck-content th { background-color: #881337; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 12px; border: 1px solid #9f1239; }
                                    .ck-content td { padding: 8px 12px; border: 1px solid #e7e5e4; font-size: 12px; }
                                    .ck-content p { break-inside: avoid-page; }
                                    .ck-content img { max-width: 100%; height: auto; break-inside: avoid; }
                                `}</style>
                            </>
                        ) : (
                            <div className="text-center p-8 bg-white rounded-xl text-stone-500">Template tidak tersedia.</div>
                        )}
                    </div>
                )}

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
                                        src={(props.auth?.peran === 'admin' || props.auth?.peran === 'reviewer') ? `/papers/${paper.id}/watermark-pdf#navpanes=0&pagemode=none&view=FitH` : `${pdfUrl}#navpanes=0&pagemode=none&view=FitH`}
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




