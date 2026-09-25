import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { AppLayout } from "@/Layouts/AppLayout";
import { Badge } from "@/Components/Badge";
import { ConfirmModal } from "@/Components/ConfirmModal";
import { Paper } from "@/types/paper";
import { PageProps } from "@/types";
import axios from "axios";
import { ArrowLeft, Send } from "lucide-react";

export default function ReviewDetail() {
    const { props } = usePage<PageProps<{ paper?: Paper }>>();
    const paper = props.paper;

    // Watermark PDF state — gunakan URL watermarked dari backend jika tersedia
    const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState<string | null>(
        null,
    );
    const [watermarkLoading, setWatermarkLoading] = useState(false);

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

    if (!paper) {
        return (
            <AppLayout defaultRole="reviewer">
                <div className="p-8 text-center text-stone-600">
                    Paper tidak ditemukan.
                </div>
            </AppLayout>
        );
    }

    const getPdfUrl = (path: string) => {
        if (!path) return "";
        if (path.startsWith("http") || path.startsWith("/storage/"))
            return path;
        return `/storage/${path}`;
    };

    const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.target as any;
        const recommendation = form.recommendation.value; // ACCEPT, MINOR_REVISION, MAJOR_REVISION, REJECT

        let confirmBtnClass = "bg-stone-600 hover:bg-stone-700";
        if (recommendation === "ACCEPT")
            confirmBtnClass = "bg-emerald-600 hover:bg-emerald-700 text-white";
        if (recommendation === "MINOR_REVISION")
            confirmBtnClass = "bg-amber-600 hover:bg-amber-700 text-white";
        if (recommendation === "MAJOR_REVISION")
            confirmBtnClass = "bg-orange-700 hover:bg-orange-800 text-white";
        if (recommendation === "REJECT")
            confirmBtnClass = "bg-rose-700 hover:bg-rose-800 text-white";

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
                        score: form.score.value,
                        recommendation: recommendation,
                        comments: form.comments.value,
                    })
                    .then(() => {
                        window.location.reload();
                    })
                    .catch((error: any) => {
                        const errorMsg =
                            error.response?.data?.message ||
                            "Terjadi kesalahan saat mengirim review. Silakan coba kembali.";
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

    // Safe Extraction Analisis
    const analysis = Array.isArray(paper?.analyses)
        ? paper.analyses[0]
        : paper?.analyses || {};
    const strengths = Array.isArray(analysis?.strengths)
        ? analysis.strengths
        : [];
    const weaknesses = Array.isArray(analysis?.weaknesses)
        ? analysis.weaknesses
        : [];
    const keyFindings = Array.isArray(analysis?.key_findings)
        ? analysis.key_findings
        : [];

    // Safe Extraction Review Saat Ini
    const existingReview = Array.isArray(paper?.reviews)
        ? paper.reviews[0]
        : paper?.reviews || null;
    const currentScore =
        existingReview?.score || paper?.scores?.overall_score || "";
    const currentComments = existingReview?.comments || "";

    // Fetch watermarked PDF dari endpoint Person 3
    useEffect(() => {
        if (!paper?.id) return;
        setWatermarkLoading(true);

        const fastApiUrl = "http://127.0.0.1:8001";
        const token = "token_rahasia_internal_tim_9921";

        // Langkah 1: Ambil PDF asli dari route streaming Laravel kita
        fetch(`/papers/${paper.id}/pdf-view`)
            .then((res) => {
                if (!res.ok) throw new Error("PDF tidak tersedia");
                return res.blob();
            })
            .then((pdfBlob) => {
                // Langkah 2: Kirim ke FastAPI watermark endpoint sebagai FormData + Bearer token
                const formData = new FormData();
                formData.append(
                    "file",
                    new File([pdfBlob], `paper_${paper.id}.pdf`, {
                        type: "application/pdf",
                    }),
                );
                formData.append(
                    "watermark_text",
                    "CONFIDENTIAL — FOR PEER REVIEW ONLY",
                );

                return fetch(`${fastApiUrl}/api/v1/pdf/watermark`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
            })
            .then((res) => {
                if (!res.ok) throw new Error("Watermark gagal");
                return res.blob();
            })
            .then((watermarkedBlob) => {
                const blobUrl = URL.createObjectURL(watermarkedBlob);
                setWatermarkedPdfUrl(blobUrl);
            })
            .catch(() => {
                // Fallback: tampilkan PDF biasa jika watermark gagal
                setWatermarkedPdfUrl(null);
            })
            .finally(() => setWatermarkLoading(false));
    }, [paper?.id]);

    // Tentukan src PDF yang dipakai: watermarked jika berhasil, fallback ke streaming route
    const pdfViewerSrc = watermarkedPdfUrl
        ? `${watermarkedPdfUrl}#navpanes=0&pagemode=none&view=FitH`
        : `/papers/${paper.id}/pdf-view#navpanes=0&pagemode=none&view=FitH`;

    return (
        <AppLayout defaultRole="reviewer">
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={confirmModal.confirmLabel}
                variant={confirmModal.variant}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeModal}
            />

            <div className="max-w-[1440px] mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-64px)] flex flex-col">
                {/* Header Back */}
                <div className="mb-4 flex items-center justify-between">
                    <Link
                        href="/reviewer"
                        className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-[#e8e4dc] bg-white text-stone-700 hover:bg-stone-900 hover:text-white font-semibold text-sm transition shadow-sm group"
                    >
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                        <span>Kembali ke Daftar Review</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-stone-900 truncate max-w-xl">
                            {paper?.title || "Judul Tidak Tersedia"}
                        </h1>
                        <Badge
                            color={
                                paper?.submission_status === "REVIEWED"
                                    ? "green"
                                    : "yellow"
                            }
                        >
                            {paper?.submission_status === "REVIEWED"
                                ? "Selesai Direview"
                                : "Butuh Review"}
                        </Badge>
                    </div>
                </div>

                {/* Main Split Screen */}
                <div className="flex flex-col lg:flex-row gap-6 flex-1 h-full min-h-0">
                    {/* LEFT 60%: PDF Viewer */}
                    <div className="lg:w-[60%] flex flex-col bg-white border border-[#e8e4dc] rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="bg-stone-50 p-3 border-b border-[#e8e4dc] flex items-center justify-between z-10 relative">
                            <span className="font-bold text-stone-700 text-sm">
                                Dokumen Naskah
                            </span>
                        </div>
                        <div className="flex-1 relative w-full h-full min-h-[500px]">
                            {/* PDF iframe with REAL AI Watermark Endpoint */}
                            <iframe
                                src={`/papers/${paper.id}/watermark-pdf`}
                                className="w-full h-full border-none relative z-10"
                                title="PDF Viewer"
                            />
                        </div>
                    </div>

                    {/* RIGHT 40%: Evaluasi Dosen Panel */}
                    <div className="lg:w-[40%] flex flex-col h-full bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-stone-50 p-4 border-b border-[#e8e4dc]">
                            <h2 className="font-bold text-stone-900">
                                Panel Evaluasi Reviewer
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">
                                Penilaian bersifat rahasia dan akan dikirim ke
                                editor
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-[#faf8f5]">
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

                            {/* Bagian 2: Formulir Penilaian */}
                            {paper.submission_status === "REVIEWED" ? (
                                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl text-center shadow-sm">
                                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-6 w-6"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-emerald-900 mb-1">
                                        Review Selesai
                                    </h3>
                                    <p className="text-sm text-emerald-700">
                                        Anda telah mensubmit evaluasi untuk
                                        paper ini.
                                    </p>
                                </div>
                            ) : (
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
                                        {/* Hidden input to store recommendation clicked */}
                                        <input
                                            type="hidden"
                                            name="recommendation"
                                            defaultValue=""
                                        />
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
