import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Download, Quote, ChevronLeft, ChevronRight, FileText, BookOpen } from "lucide-react";

export default function PaperReader({ paper, renderedTemplate }: any) {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const contentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (contentRef.current) {
            // Wait for images/styles to load and calculate columns
            setTimeout(() => {
                if (contentRef.current) {
                    const scrollW = contentRef.current.scrollWidth;
                    const clientW = contentRef.current.clientWidth;
                    const calculatedPages = Math.ceil(scrollW / clientW);
                    setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
                }
            }, 300);
        }
    }, [renderedTemplate]);

    const handleCopyCitation = () => {
        const year = paper.publication_year || new Date().getFullYear();
        const author = paper.uploader?.name || "Unknown Author";
        const citation = `${author}. (${year}). ${paper.title}. Transactions on AI & Software Engineering.`;
        navigator.clipboard.writeText(citation);
        alert("Format sitasi berhasil disalin ke clipboard!");
    };


    return (
        <div className="h-screen bg-[#f8f7f4] text-stone-900 font-sans flex flex-col overflow-hidden">
            <Head title={`Reader: ${paper.title}`} />

            {/* Header */}
            <header className="flex-none bg-white border-b border-stone-200 shadow-sm px-6 py-4 flex items-center justify-between z-10">
                <Link
                    href={`/katalog/${paper.id}`}
                    className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Detail
                </Link>

                <div className="flex items-center gap-2">
                    {/* View mode toggle */}
                    

                    <button
                        onClick={handleCopyCitation}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-sm font-semibold transition"
                    >
                        <Quote className="w-4 h-4" />
                        Sitasi
                    </button>

                    

                    
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-auto bg-stone-200/70">
                {renderedTemplate ? (
                    <div className="py-8 px-4">
                        {/* Pagination controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="flex items-center gap-1 px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-40 hover:bg-stone-50 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Sebelumnya
                                </button>

                                <div className="flex items-center gap-1.5">
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold transition ${currentPage === i + 1 ? "bg-rose-700 text-white shadow" : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="flex items-center gap-1 px-4 py-2 bg-white border border-stone-300 rounded-lg text-sm font-semibold shadow-sm disabled:opacity-40 hover:bg-stone-50 transition"
                                >
                                    Berikutnya
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* A4 Page View (CSS Column Pagination) */}
                        <div 
                            className="bg-white shadow-xl rounded-sm overflow-hidden relative"
                            style={{
                                width: "794px",
                                height: "1123px",
                                boxSizing: "border-box",
                            }}
                        >
                            <div 
                                ref={contentRef}
                                className="ck-content h-full"
                                style={{
                                    columnWidth: "794px",
                                    columnGap: "0",
                                    columnFill: "auto",
                                    height: "1123px",
                                    padding: "96px", // 2.54cm margins
                                    boxSizing: "border-box",
                                    fontFamily: "'Times New Roman', Times, serif",
                                    fontSize: "11pt",
                                    lineHeight: "1.6",
                                    color: "#1c1917",
                                    transform: `translateX(-${(currentPage - 1) * 794}px)`,
                                    transition: "transform 0.4s ease-in-out",
                                    width: "794px"
                                }}
                                dangerouslySetInnerHTML={{ __html: renderedTemplate || "" }}
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
                                {paper.title || "Naskah Jurnal"} &mdash; Halaman {currentPage}
                            </div>
                        </div>

                        {/* Page dots */}
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${currentPage === i + 1 ? "bg-rose-700 scale-125" : "bg-stone-400 hover:bg-stone-600"}`}
                                        title={`Halaman ${i + 1}`}
                                    />
                                ))}
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
                .ck-content h3 { color: #881337; font-size: 14px; font-weight: bold; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                .ck-content table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                .ck-content th { background-color: #881337; color: #ffffff; font-weight: 700; text-align: left; padding: 8px 12px; }
                .ck-content td { padding: 8px 12px; border: 1px solid #e7e5e4; font-size: 12px; }
            `}</style>
        </div>
    );
}


