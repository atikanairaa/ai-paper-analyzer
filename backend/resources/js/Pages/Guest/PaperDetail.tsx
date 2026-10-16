import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Lock, FileText, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Download, LogIn, UserPlus, CheckCircle2, X, ExternalLink } from "lucide-react";
import axios from "axios";

function splitHtmlIntoPages(html: string, charsPerPage = 3500): string[] {
    if (!html) return [""];
    const pages: string[] = [];
    let remaining = html;
    while (remaining.length > 0) {
        if (remaining.length <= charsPerPage) {
            pages.push(remaining);
            break;
        }
        let splitAt = remaining.lastIndexOf("</p>", charsPerPage);
        if (splitAt < charsPerPage * 0.5) splitAt = remaining.lastIndexOf("<br", charsPerPage);
        if (splitAt < 0) splitAt = charsPerPage;
        else splitAt += 4;
        pages.push(remaining.substring(0, splitAt));
        remaining = remaining.substring(splitAt);
    }
    return pages.length > 0 ? pages : [""];
}

export default function PaperDetail({
    paper,
    isLocked,
    hasPurchased,
    pendingPurchase,
    price,
    renderedTemplate,
    abstractHtml,
    auth,
}: {
    paper: any;
    isLocked: boolean;
    hasPurchased?: boolean;
    pendingPurchase?: any;
    price: number;
    renderedTemplate?: string;
    abstractHtml?: string;
    auth?: any;
}) {
    const [isBuying, setIsBuying] = useState(false);
    const [isCheckingReaderPayment, setIsCheckingReaderPayment] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Split the rendered template into A4 pages
    const pages = splitHtmlIntoPages(renderedTemplate || "");
    const totalPages = pages.length;

    const handleBuy = async () => {
        // Jika belum login, wajibkan login/register terlebih dahulu
        if (!auth?.user) {
            setShowAuthModal(true);
            return;
        }

        setIsBuying(true);
        try {
            const res = await axios.post(`/papers/${paper.id}/buy`);
            if (res.data.already_paid && res.data.redirect_url) {
                window.location.href = res.data.redirect_url;
                return;
            }
            if (res.data.payment_url) {
                window.location.href = res.data.payment_url;
            }
        } catch (err: any) {
            if (err.response?.status === 401 && err.response?.data?.require_login) {
                setShowAuthModal(true);
            } else {
                alert(err.response?.data?.error || "Gagal membuat tagihan pembayaran. Silakan coba lagi.");
            }
        } finally {
            setIsBuying(false);
        }
    };

    const handleCheckPayment = async () => {
        setIsCheckingReaderPayment(true);
        try {
            const res = await axios.post(`/papers/${paper.id}/check-reader-payment`);
            if (res.data.status === "PAID") {
                window.location.href = res.data.redirect_url || `/paper/${paper.id}/read`;
            } else {
                alert(res.data.message || "Status pembayaran belum lunas.");
            }
        } catch (err: any) {
            alert(err.response?.data?.error || err.response?.data?.message || "Gagal memeriksa status pembayaran.");
        } finally {
            setIsCheckingReaderPayment(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#faf8f5]">
            <Head title={paper.title} />
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/katalog" className="inline-flex items-center space-x-2 text-stone-500 hover:text-stone-700 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Kembali ke Katalog</span>
                    </Link>
                    {auth?.user ? (
                        <div className="text-xs text-stone-500 font-medium flex items-center gap-2 bg-stone-100 px-3.5 py-1.5 rounded-full border border-stone-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Akun: <strong>{auth.user.name}</strong></span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <a href={`/login?redirect=/katalog/${paper.id}`} className="text-xs text-stone-600 hover:text-rose-700 font-semibold transition">
                                Masuk (Login)
                            </a>
                            <a href={`/register?redirect=/katalog/${paper.id}`} className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm transition">
                                Daftar
                            </a>
                        </div>
                    )}
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
                    {/* ── LOCKED PAPER: show only abstract preview ── */}
                    {isLocked ? (
                        <>
                            {/* Abstract Preview */}
                            {abstractHtml ? (
                                <div className="mb-6">
                                    <div className="ck-content" dangerouslySetInnerHTML={{ __html: abstractHtml }} />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-3xl font-bold text-stone-900 mb-4">{paper.title}</h1>
                                    <p className="text-stone-500 mb-4">Penulis: {paper.uploader?.name}</p>
                                    {paper.abstract && (
                                        <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 mb-6">
                                            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Abstrak</p>
                                            <p className="text-sm text-stone-700 leading-relaxed">{paper.abstract}</p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Paywall Section */}
                            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center flex flex-col items-center mt-4">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600 shadow-inner">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-2">Konten Selanjutnya Terkunci (Paywall)</h3>
                                <p className="text-stone-600 mb-6 max-w-md text-sm">
                                    Paper ini adalah publikasi Closed Access. Masuk dengan akun Anda dan bayar sekali untuk membaca serta mengunduh naskah lengkap.
                                </p>

                                {pendingPurchase ? (
                                    <div className="w-full max-w-md bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm text-left mb-2">
                                        <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-sm">
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                                            <span>Menunggu Konfirmasi Pembayaran</span>
                                        </div>
                                        <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                                            Tagihan aktif telah dibuat (<strong>{pendingPurchase.invoice_number}</strong>).
                                            Jika Anda sudah menyelesaikan pembayaran di DOKU, klik tombol di bawah untuk langsung membuka naskah.
                                        </p>
                                        <div className="flex flex-col gap-2.5">
                                            <button
                                                onClick={handleCheckPayment}
                                                disabled={isCheckingReaderPayment}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-70 cursor-pointer"
                                            >
                                                {isCheckingReaderPayment ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> <span>Memverifikasi Pembayaran...</span></>
                                                ) : (
                                                    <><CheckCircle2 className="w-4 h-4" /> <span>Saya Sudah Membayar (Buka Naskah)</span></>
                                                )}
                                            </button>
                                            <a
                                                href={pendingPurchase.payment_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-2.5 px-4 rounded-xl transition text-center text-xs flex items-center justify-center gap-1.5 border border-stone-200"
                                            >
                                                <span>Lanjutkan ke Halaman Pembayaran DOKU</span>
                                                <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleBuy}
                                        disabled={isBuying}
                                        className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3.5 rounded-xl font-bold shadow-md transition flex items-center justify-center min-w-[240px] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isBuying ? (
                                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Menyiapkan Pembayaran...</>
                                        ) : (
                                            `Beli Akses Penuh - Rp ${price.toLocaleString("id-ID")}`
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── OPEN ACCESS / UNLOCKED: show full paginated template ── */
                        <>
                            {hasPurchased && (
                                <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-800 text-sm font-semibold shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                        <span>Anda telah memiliki hak akses naskah ini.</span>
                                    </div>
                                    <Link
                                        href={`/paper/${paper.id}/read`}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-sm text-xs transition flex items-center gap-1.5 whitespace-nowrap"
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span>Buka Halaman Full Reader</span>
                                    </Link>
                                </div>
                            )}

                            {/* Paginated template viewer */}
                            {renderedTemplate && (
                                <div className="mb-8">
                                    {/* Page Controls */}
                                    {totalPages > 1 && (
                                        <div className="flex items-center justify-between mb-4 bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
                                            <span className="text-sm font-semibold text-stone-600">
                                                Halaman {currentPage} dari {totalPages}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                    disabled={currentPage <= 1}
                                                    className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-40 transition"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                {Array.from({ length: totalPages }, (_, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setCurrentPage(i + 1)}
                                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition ${currentPage === i + 1 ? "bg-rose-700 text-white" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                                <button
                                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                    disabled={currentPage >= totalPages}
                                                    className="p-2 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 disabled:opacity-40 transition"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* A4 Page Simulation */}
                                    <div
                                        className="mx-auto bg-white shadow-md border border-stone-100"
                                        style={{
                                            maxWidth: "794px",
                                            minHeight: "1123px",
                                            padding: "96px 96px 96px 96px",
                                            fontFamily: "'Times New Roman', Times, serif",
                                            fontSize: "11pt",
                                            lineHeight: "1.6",
                                            color: "#1c1917",
                                            position: "relative",
                                        }}
                                    >
                                        <div className="ck-content" dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] || "" }} />
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
                                            }}
                                        >
                                            Halaman {currentPage}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="mt-8">
                                <div className="w-full border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col bg-white">
                                    <div className="bg-stone-50/80 px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200/50">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-0.5">Akses Naskah Lengkap</h3>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                    <p className="text-xs text-stone-500 font-medium">
                                                        Tersedia ({paper.access_type === 'CLOSED_ACCESS' ? 'Hak Akses Telah Dibeli' : 'Open Access Publik'})
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center gap-3">
                                            <Link
                                                href={`/paper/${paper.id}/read`}
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm text-white font-bold bg-emerald-600 hover:bg-emerald-700 px-6 py-3 rounded-xl transition-all shadow-md"
                                            >
                                                Baca Naskah (Full Reader)
                                            </Link>
                                            <a
                                                href={`/paper/${paper.id}/pdf`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm text-stone-700 font-bold hover:text-rose-700 bg-white border border-stone-300 hover:border-rose-400 px-6 py-3 rounded-xl transition-all shadow-sm"
                                            >
                                                <Download className="w-4 h-4 mr-1" />
                                                Unduh PDF Jurnal
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modal Autentikasi Diperlukan untuk Closed Access */}
            {showAuthModal && (
                <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-200 text-center relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowAuthModal(false)}
                            className="absolute top-5 right-5 text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 shadow-inner">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-stone-900 mb-2">Akun Diperlukan untuk Pembelian</h3>
                        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
                            Untuk membeli hak akses naskah Closed Access ini, silakan Masuk atau Buat Akun terlebih dahulu agar naskah tersimpan secara permanen di akun Anda.
                        </p>
                        <div className="flex flex-col gap-3">
                            <a
                                href={`/login?redirect=/katalog/${paper.id}`}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" />
                                <span>Masuk ke Akun (Login)</span>
                            </a>
                            <a
                                href={`/register?redirect=/katalog/${paper.id}`}
                                className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 border border-stone-200"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>Daftar Akun Baru (Register)</span>
                            </a>
                            <button
                                type="button"
                                onClick={() => setShowAuthModal(false)}
                                className="text-stone-400 hover:text-stone-600 text-xs font-semibold mt-2 transition"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .ck-content h1 { color: #881337; font-size: 22px; font-weight: 900; text-align: center; margin: 18px 0; line-height: 1.3; }
                .ck-content h2 { color: #881337; font-size: 15px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                .ck-content h3 { color: #881337; font-size: 14px; font-weight: bold; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                .ck-content table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                .ck-content th { background-color: #881337; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 12px; }
                .ck-content td { padding: 8px 12px; border: 1px solid #e7e5e4; font-size: 12px; }
            `}</style>
        </div>
    );
}

