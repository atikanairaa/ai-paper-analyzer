import React, { useState } from "react";
import { Download, Head, Link } from "@inertiajs/react";
import { Lock, FileText, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
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
    price,
    renderedTemplate,
    abstractHtml,
    auth,
}: {
    paper: any;
    isLocked: boolean;
    price: number;
    renderedTemplate?: string;
    abstractHtml?: string;
    auth?: any;
}) {
    const [isBuying, setIsBuying] = useState(false);
    const [showGuestForm, setShowGuestForm] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [currentPage, setCurrentPage] = useState(1);


    // Split the rendered template into A4 pages
    const pages = splitHtmlIntoPages(renderedTemplate || "");
    const totalPages = pages.length;

    const handleBuy = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!auth?.user && (!guestName || !guestEmail)) {
            alert("Silakan isi Nama dan Email untuk melanjutkan pembayaran.");
            return;
        }
        setIsBuying(true);
        try {
            const res = await axios.post(`/papers/${paper.id}/buy`, {
                guest_name: guestName,
                guest_email: guestEmail,
            });
            if (res.data.already_paid && res.data.redirect_url) {
                window.location.href = res.data.redirect_url;
                return;
            }
            if (res.data.payment_url) {
                window.location.href = res.data.payment_url;
            }
        } catch (err: any) {
            alert(err.response?.data?.error || "Gagal membuat tagihan pembayaran. Silakan coba lagi.");
        } finally {
            setIsBuying(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#faf8f5]">
            <Head title={paper.title} />
            <div className="max-w-4xl mx-auto py-12 px-4">
                <Link href="/katalog" className="inline-flex items-center space-x-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Katalog</span>
                </Link>

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
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                                    <Lock className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-stone-900 mb-2">Konten Selanjutnya Terkunci (Paywall)</h3>
                                <p className="text-stone-600 mb-6 max-w-md">
                                    Paper ini adalah publikasi Closed Access. Bayar sekali untuk membaca naskah lengkap dalam format jurnal resmi.
                                </p>

                                {!auth?.user && showGuestForm ? (
                                    <form onSubmit={handleBuy} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-sm border border-stone-200 flex flex-col gap-4 text-left">
                                        <h4 className="font-bold text-stone-800 text-center mb-2">Guest Checkout</h4>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-600 mb-1">Nama Lengkap</label>
                                            <input
                                                type="text" required value={guestName}
                                                onChange={(e) => setGuestName(e.target.value)}
                                                className="w-full rounded-xl border border-stone-300 focus:border-rose-500 focus:ring focus:ring-rose-200 shadow-sm px-4 py-2"
                                                placeholder="Masukkan nama..."
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-600 mb-1">Email Aktif</label>
                                            <input
                                                type="email" required value={guestEmail}
                                                onChange={(e) => setGuestEmail(e.target.value)}
                                                className="w-full rounded-xl border border-stone-300 focus:border-rose-500 focus:ring focus:ring-rose-200 shadow-sm px-4 py-2"
                                                placeholder="Tautan akses akan dikirim ke sini..."
                                            />
                                        </div>
                                        <button
                                            type="submit" disabled={isBuying}
                                            className="bg-rose-600 text-white w-full py-3 mt-2 rounded-xl font-bold shadow-md hover:bg-rose-700 transition flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isBuying ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" /> Memproses...</>) : (`Bayar Rp ${price.toLocaleString("id-ID")}`)}
                                        </button>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => (auth?.user ? handleBuy() : setShowGuestForm(true))}
                                        disabled={isBuying}
                                        className="bg-rose-600 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-rose-700 transition flex items-center justify-center min-w-[220px] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isBuying ? (
                                            <><Loader2 className="w-5 h-5 animate-spin mr-2" />Memproses...</>
                                        ) : (
                                            `Beli Akses Penuh - Rp ${price.toLocaleString("id-ID")}`
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        /* ── OPEN ACCESS: show full paginated template ── */
                        <>
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
                                                    <p className="text-xs text-stone-500 font-medium">Tersedia (Open Access)</p>
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
                                            
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

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

