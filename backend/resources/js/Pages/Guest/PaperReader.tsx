import React, { useState, useEffect, useMemo, useRef } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Download, Quote, ChevronLeft, ChevronRight } from "lucide-react";

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

export default function PaperReader({ paper, renderedTemplate }: any) {
    const pages = useMemo(() => splitHtmlIntoPages(renderedTemplate || "", 4200), [renderedTemplate]);
    const totalPages = pages.length;
    const [currentPage, setCurrentPage] = useState(1);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const changePage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    };

    const handleCopyCitation = () => {
        const year = paper.publication_year || new Date().getFullYear();
        const author = paper.uploader?.name || "Unknown Author";
        const citation = `${author}. (${year}). ${paper.title}. Transactions on AI & Software Engineering.`;
        navigator.clipboard.writeText(citation);
        alert("Format sitasi berhasil disalin ke clipboard!");
    };

    return (
        <div className="h-screen bg-[#f1efe9] text-stone-900 font-sans flex flex-col overflow-hidden">
            <Head title={`Reader: ${paper.title}`} />

            {/* Top Navigation Bar */}
            <header className="flex-none bg-white border-b border-stone-200 shadow-sm px-6 py-3.5 flex items-center justify-between z-20">
                <Link
                    href={`/katalog/${paper.id}`}
                    className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Detail</span>
                </Link>

                {/* Page Navigation in Header */}
                {totalPages > 1 && (
                    <div className="hidden sm:flex items-center gap-2 bg-stone-100/80 px-3 py-1.5 rounded-xl border border-stone-200/80">
                        <button
                            onClick={() => changePage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-1 rounded-md text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
                            title="Halaman Sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-stone-700 px-2">
                            Halaman {currentPage} dari {totalPages}
                        </span>
                        <button
                            onClick={() => changePage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-1 rounded-md text-stone-600 hover:bg-white hover:text-stone-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
                            title="Halaman Berikutnya"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleCopyCitation}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-xl text-xs font-semibold transition"
                    >
                        <Quote className="w-3.5 h-3.5" />
                        Sitasi
                    </button>

                    <a
                        href={`/paper/${paper.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white hover:bg-rose-800 rounded-xl text-xs font-semibold transition shadow-sm"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Unduh PDF Jurnal
                    </a>
                </div>
            </header>

            {/* Main scrollable area */}
            <main ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8">
                {renderedTemplate ? (
                    <div className="max-w-4xl mx-auto flex flex-col items-center">
                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center flex-wrap gap-2 mb-6 bg-white py-2 px-4 rounded-2xl shadow-sm border border-stone-200">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 transition"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    Sebelumnya
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => {
                                        const pNum = i + 1;
                                        // Show condensed page numbers if more than 10 pages
                                        if (totalPages > 10) {
                                            if (
                                                pNum !== 1 &&
                                                pNum !== totalPages &&
                                                Math.abs(pNum - currentPage) > 2
                                            ) {
                                                if (pNum === 2 || pNum === totalPages - 1) {
                                                    return <span key={i} className="px-1 text-stone-400 text-xs">...</span>;
                                                }
                                                return null;
                                            }
                                        }
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => changePage(pNum)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                                                    currentPage === pNum
                                                        ? "bg-rose-700 text-white shadow-sm"
                                                        : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                                                }`}
                                            >
                                                {pNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-30 transition"
                                >
                                    Berikutnya
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Centered A4 Sheet Simulation */}
                        <div
                            className="bg-white shadow-xl rounded-sm border border-stone-200 w-full mb-8 relative transition-all"
                            style={{
                                maxWidth: "794px",
                                minHeight: "1123px",
                                padding: "96px 96px 96px 96px",
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

                            {/* Page Footer */}
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
                                {paper.title || "Naskah Jurnal"} &mdash; Halaman {currentPage} dari {totalPages}
                            </div>
                        </div>

                        {/* Bottom Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between w-full max-w-[794px] mb-8 text-xs text-stone-500 font-medium">
                                <button
                                    onClick={() => changePage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="flex items-center gap-1 px-4 py-2 bg-white rounded-xl shadow-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-30 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Halaman Sebelumnya
                                </button>
                                <span>
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <button
                                    onClick={() => changePage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="flex items-center gap-1 px-4 py-2 bg-white rounded-xl shadow-sm border border-stone-200 hover:bg-stone-50 disabled:opacity-30 transition"
                                >
                                    Halaman Berikutnya
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-stone-500">
                        <p>Dokumen tidak ditemukan.</p>
                    </div>
                )}
            </main>

            <style>{`
                .ck-content h1 { color: #881337; font-size: 22px; font-weight: 900; text-align: center; margin: 18px 0; line-height: 1.3; }
                .ck-content h2 { color: #881337; font-size: 15px; font-weight: 700; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                .ck-content h3 { color: #881337; font-size: 14px; font-weight: bold; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; margin-top: 20px; margin-bottom: 10px; }
                .ck-content table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                .ck-content th { background-color: #881337; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 12px; }
                .ck-content td { padding: 8px 12px; border: 1px solid #e7e5e4; font-size: 12px; }
                .ck-content p { margin-bottom: 12px; text-align: justify; line-height: 1.6; }
            `}</style>
        </div>
    );
}


