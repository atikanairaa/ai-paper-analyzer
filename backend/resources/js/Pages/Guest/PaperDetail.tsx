import React from 'react';
import { Download, Head, Link } from '@inertiajs/react';
import { Lock, FileText, ArrowLeft } from 'lucide-react';

export default function PaperDetail({
 paper, isLocked, price, renderedTemplate }: { paper: any, isLocked: boolean, price: number, renderedTemplate?: string }) {
    
    const handleDownloadWord = () => {
        if (!renderedTemplate) return;
        
        let processedHtml = renderedTemplate;

        // 1. Hapus tag figure
        processedHtml = processedHtml.replace(/<\/?figure[^>]*>/gi, '');
        // 2. HAPUS tag <thead> dan <tbody>
        processedHtml = processedHtml.replace(/<\/?(thead|tbody)[^>]*>/gi, '');
        // 3. Ubah semua <th> menjadi <td>
        processedHtml = processedHtml.replace(/<th[^>]*>/gi, '<td bgcolor="#881337" style="background-color: #881337; color: #ffffff; font-weight: bold; border: 1px solid #78716c; padding: 6pt 10pt; font-size: 10pt; text-align: left;">');
        processedHtml = processedHtml.replace(/<\/th>/gi, '</td>');
        // 4. Pastikan semua <td> yang bukan header memiliki border
        processedHtml = processedHtml.replace(/<td(?![^>]*bgcolor)([^>]*)>/gi, '<td style="border: 1px solid #78716c; padding: 6pt 10pt; font-size: 10pt; vertical-align: top;"$1>');
        // 5. Pastikan tag <table>
        processedHtml = processedHtml.replace(/<table[^>]*>/gi, '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%; border: 1px solid #78716c; margin: 12pt 0;">');

        const wordStyles = `
            <style>
                @page { size: A4; margin: 2.5cm 2.5cm 2.5cm 2.5cm; }
                body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #1c1917; }
                table { border-collapse: collapse !important; width: 100% !important; margin: 12pt 0 !important; border: 1px solid #78716c !important; }
                td { border: 1px solid #78716c !important; padding: 6pt 10pt !important; }
            </style>
        `;

        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Draft Template Naskah</title>${wordStyles}</head>
            <body>
        `;
        const footer = "</body></html>";
        const fullContent = header + processedHtml + footer;

        const blob = new Blob(['\ufeff' + fullContent], { type: 'application/msword;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Jurnal_Terpublikasi_${paper?.id || 'Unknown'}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                    {renderedTemplate ? (
                        <div className="mb-8 ck-content" dangerouslySetInnerHTML={{ __html: renderedTemplate }} />
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold text-stone-900 mb-4">{paper.title}</h1>
                            <p className="text-stone-500 mb-8">Penulis: {paper.uploader?.name}</p>
                        </>
                    )}

                    {isLocked ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center flex flex-col items-center mt-8">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 mb-2">Konten Terkunci (Paywall)</h3>
                            <p className="text-stone-600 mb-6 max-w-md">Paper ini adalah publikasi Closed Access. Anda harus membayar untuk membaca dokumen selengkapnya.</p>
                            <button className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-rose-700 transition">
                                Beli Akses - Rp {price.toLocaleString('id-ID')}
                            </button>
                        </div>
                    ) : (
                        <div className="mt-12">
                            <div className="w-full border border-stone-200 rounded-2xl overflow-hidden shadow-sm flex flex-col bg-white">
                                {/* Custom PDF Toolbar */}
                                <div className="bg-stone-50/80 border-b border-stone-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200/50">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-widest mb-0.5">Naskah Lengkap</h3>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                <p className="text-xs text-stone-500 font-medium">Akses Terbuka (Open Access)</p>
                                            </div>
                                        </div>
                                    </div>
                                    <a 
                                        href={`/storage/${paper.file_path}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="flex items-center justify-center gap-2 text-sm text-stone-700 font-bold hover:text-emerald-700 bg-white border border-stone-300 hover:border-emerald-500 px-5 py-2.5 rounded-xl transition-all shadow-sm"
                                    >
                                        Unduh Naskah Asli (PDF)
                                    </a>
                                </div>
                                
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
