import React from "react";
import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Download, Quote } from "lucide-react";

export default function PaperReader({ paper, renderedTemplate }: any) {
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
            
            <header className="flex-none bg-white border-b border-stone-200 shadow-sm px-6 py-4 flex items-center justify-between z-10">
                <Link 
                    href={`/katalog/${paper.id}`}
                    className="flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition font-medium text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Detail
                </Link>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleCopyCitation}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-sm font-semibold transition"
                    >
                        <Quote className="w-4 h-4" />
                        Sitasi
                    </button>
                    {paper.file_path && (
                        <a 
                            href={`/storage/${paper.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            Unduh PDF Asli
                        </a>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full bg-stone-200/50">
                {paper.file_path ? (
                    <iframe 
                        src={`/storage/${paper.file_path}#toolbar=1&navpanes=0&view=FitH`} 
                        className="w-full h-full border-0"
                        title={`PDF Reader: ${paper.title}`}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-stone-500">
                        <p>Dokumen PDF tidak ditemukan.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
