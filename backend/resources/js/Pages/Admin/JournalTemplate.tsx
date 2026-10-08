import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "@/Layouts/AppLayout";
import { CheckCircle2, Save, Download, Printer } from "lucide-react";
import { Head, router } from "@inertiajs/react";

declare global {
    interface Window { CKEDITOR: any; }
}



export default function JournalTemplate({ initialTemplate = "" }: { initialTemplate?: string }) {
    const [editorData, setEditorData] = useState<string>(initialTemplate);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [previewMode, setPreviewMode] = useState<"editor" | "paginated">("editor");
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const contentRef = useRef<HTMLDivElement>(null);

    const editorRef = useRef<HTMLTextAreaElement>(null);
    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (previewMode === "paginated" && contentRef.current) {
            setTimeout(() => {
                if (contentRef.current) {
                    const scrollW = contentRef.current.scrollWidth;
                    const clientW = contentRef.current.clientWidth;
                    const calculatedPages = Math.ceil(scrollW / clientW);
                    setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
                }
            }, 300);
        }
    }, [editorData, previewMode]);

    useEffect(() => {
        if (typeof window === "undefined" || !window.CKEDITOR || !editorRef.current) return;
        if (editorInstanceRef.current) return;

        const editorConfig = {
            language: "en",
            height: 840,
            width: "100%",
            bodyClass: "ck4-body",
            bodyId: "ck4-editor-body",
            extraPlugins: "pagebreak,print,justify,colorbutton,font,tableresize",
            toolbar: [
                { name: "document", items: ["Source", "-", "Print"] },
                { name: "clipboard", items: ["Cut", "Copy", "Paste", "PasteText", "PasteFromWord", "-", "Undo", "Redo"] },
                { name: "editing", items: ["Find", "Replace", "-", "SelectAll"] },
                "/",
                { name: "basicstyles", items: ["Bold", "Italic", "Underline", "Strike", "Subscript", "Superscript", "-", "CopyFormatting", "RemoveFormat"] },
                { name: "paragraph", items: ["NumberedList", "BulletedList", "-", "Outdent", "Indent", "-", "Blockquote", "-", "JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock"] },
                { name: "links", items: ["Link", "Unlink", "Anchor"] },
                { name: "insert", items: ["Image", "Table", "HorizontalRule", "SpecialChar", "PageBreak"] },
                "/",
                { name: "styles", items: ["Styles", "Format", "Font", "FontSize"] },
                { name: "colors", items: ["TextColor", "BGColor"] },
                { name: "tools", items: ["ShowBlocks"] },
            ],
            contentsCss: [
                "data:text/css," + encodeURIComponent(`
                    body {
                        font-family: 'Times New Roman', Times, serif;
                        font-size: 11pt;
                        line-height: 1.6;
                        color: #1c1917;
                        background: #d1d5db;
                        margin: 0;
                        padding: 24px;
                    }
                    h1 { color: #881337; font-size: 22px; font-weight: 900; text-align: center; margin: 18px 0; }
                    h2 { color: #881337; font-size: 15px; font-weight: 700; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                    h3 { color: #881337; font-size: 14px; font-weight: bold; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                    table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                    th { background-color: #881337; color: #fff; font-weight: bold; padding: 8px 12px; border: 1px solid #9f1239; }
                    td { padding: 8px 12px; border: 1px solid #e7e5e4; font-size: 12px; }
                    div.page-break { page-break-after: always; border-top: 2px dashed #dc2626; margin: 20px 0; clear: both; }
                `)
            ],
        };

        const editor = window.CKEDITOR.replace(editorRef.current, editorConfig);

        editor.on("instanceReady", () => {
            editor.setData(initialTemplate);
        });

        editor.on("change", () => {
            setEditorData(editor.getData());
        });

        editorInstanceRef.current = editor;

        return () => {
            if (editorInstanceRef.current) {
                try { editorInstanceRef.current.destroy(true); } catch (e) { /* ignore */ }
                editorInstanceRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (editorInstanceRef.current && initialTemplate) {
            editorInstanceRef.current.setData(initialTemplate);
            setEditorData(initialTemplate);
        }
    }, [initialTemplate]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleSave = () => {
        setIsLoading(true);
        const content = editorInstanceRef.current ? editorInstanceRef.current.getData() : editorData;
        router.post("/admin/journal-template", { template: content }, {
            preserveScroll: true,
            onSuccess: () => { setIsLoading(false); showToast("Template jurnal berhasil diperbarui!"); },
            onError: () => { setIsLoading(false); showToast("Gagal menyimpan template."); },
        });
    };

    const handleDownloadWord = () => {
        const content = editorInstanceRef.current ? editorInstanceRef.current.getData() : editorData;
        let processedHtml = content;
        processedHtml = processedHtml.replace(/<\/?figure[^>]*>/gi, "");
        processedHtml = processedHtml.replace(/<\/?(thead|tbody)[^>]*>/gi, "");
        processedHtml = processedHtml.replace(/<th[^>]*>/gi, '<td bgcolor="#881337" style="background-color:#881337;color:#fff;font-weight:bold;border:1px solid #78716c;padding:6pt 10pt;font-size:10pt;text-align:left;">');
        processedHtml = processedHtml.replace(/<\/th>/gi, "</td>");
        processedHtml = processedHtml.replace(/<td(?![^>]*bgcolor)([^>]*)>/gi, '<td style="border:1px solid #78716c;padding:6pt 10pt;font-size:10pt;vertical-align:top;">');
        processedHtml = processedHtml.replace(/<table[^>]*>/gi, '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;border:1px solid #78716c;margin:12pt 0;">');
        processedHtml = processedHtml.replace(/<div[^>]*class="page-break"[^>]*>.*?<\/div>/gi, '<br style="page-break-before:always;" clear="all" />');

        const wordStyles = `<style>@page{size:A4;margin:2.5cm 2.5cm 2.5cm 2.5cm;}body{font-family:'Palatino Linotype','Book Antiqua',Palatino,serif;font-size:11pt;line-height:1.5;color:#1c1917;}table{border-collapse:collapse!important;width:100%!important;margin:12pt 0!important;border:1px solid #78716c!important;}td{border:1px solid #78716c!important;padding:6pt 10pt!important;}</style>`;
        const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Template Naskah Jurnal</title>${wordStyles}</head><body>`;
        const footer = "</body></html>";
        const blob = new Blob(["\ufeff" + header + processedHtml + footer], { type: "application/msword;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Template_Naskah_Jurnal_2026.doc";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleGeneratePdf = () => {
        setIsGeneratingPdf(true);
        const content = editorInstanceRef.current ? editorInstanceRef.current.getData() : editorData;
        const printWindow = window.open("", "_blank", "width=900,height=700");
        if (!printWindow) {
            setIsGeneratingPdf(false);
            showToast("Gagal membuka jendela print. Izinkan pop-up di browser.");
            return;
        }
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Template Jurnal - PDF Preview</title><style>
            @page{size:A4;margin:2.5cm 2.5cm 2.5cm 2.5cm;}
            *{box-sizing:border-box;}
            body{font-family:'Times New Roman',Times,serif;font-size:11pt;line-height:1.6;color:#1c1917;margin:0;padding:20px;background:#f5f5f5;}
            .page{background:white;width:210mm;min-height:297mm;margin:0 auto 20px;padding:25mm;box-shadow:0 2px 20px rgba(0,0,0,0.15);page-break-after:always;position:relative;}
            .page-footer{position:absolute;bottom:15mm;left:25mm;right:25mm;text-align:center;font-size:9pt;color:#78716c;border-top:1px solid #e7e5e4;padding-top:4px;}
            @media print{body{background:white;padding:0;}.page{margin:0;box-shadow:none;}.no-print{display:none!important;}}
            h1{color:#881337;font-size:22px;font-weight:900;text-align:center;margin:18px 0;}
            h2,h3{color:#881337;border-bottom:1px solid #fecdd3;padding-bottom:4px;}
            table{border-collapse:collapse;width:100%;margin:12pt 0;}
            th{background-color:#881337;color:#fff;font-weight:bold;padding:8px 12px;border:1px solid #9f1239;}
            td{padding:8px 12px;border:1px solid #e7e5e4;font-size:12px;}
            .print-btn{position:fixed;top:16px;right:16px;z-index:9999;background:#881337;color:white;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:bold;cursor:pointer;}
        </style></head><body>
        <button class="print-btn no-print" onclick="window.print()">Cetak / Simpan PDF</button>
        <div class="page">${content}<div class="page-footer">Template Naskah Jurnal &mdash; Halaman 1</div></div>
        </body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        setIsGeneratingPdf(false);
    };

    return (
        <AppLayout defaultRole="admin">
            <Head title="Kelola Template Jurnal" />
            <div className="p-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">Kelola Template Jurnal</h1>
                        <p className="text-sm text-stone-500 mt-1">
                            Format standar naskah jurnal &mdash; CKEditor 4.22.{" "}
                            <span className="text-rose-600 font-medium">Insert &rarr; Page Break untuk batas halaman A4.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                        <button
                            onClick={() => setPreviewMode("editor")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${previewMode === "editor" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
                        >
                            Editor
                        </button>
                        <button
                            onClick={() => setPreviewMode("paginated")}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${previewMode === "paginated" ? "bg-white shadow text-stone-900" : "text-stone-500 hover:text-stone-700"}`}
                        >
                            Preview Halaman
                        </button>
                    </div>
                </div>

                {previewMode === "editor" ? (
                    <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm mb-6">
                        <div className="mb-3 flex items-center gap-2 text-xs text-stone-400">
                            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-1 rounded font-bold">CKEditor 4.22</span>
                            <span>Gunakan toolbar Insert &gt; Page Break untuk menambah batas halaman A4.</span>
                        </div>
                        <textarea ref={editorRef} name="editor-content" defaultValue={initialTemplate} style={{ display: "none" }} />
                    </div>
                ) : (
                    <div className="bg-stone-200 rounded-2xl p-6 shadow-sm mb-6 min-h-[600px]">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-stone-600">
                                Preview A4 &mdash; Halaman {currentPage} dari {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="px-4 py-2 rounded-lg bg-white border border-stone-300 text-sm font-semibold disabled:opacity-40 hover:bg-stone-50 transition"
                                >
                                    Sebelumnya
                                </button>
                                <span className="px-4 py-2 bg-rose-700 text-white rounded-lg text-sm font-bold">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="px-4 py-2 rounded-lg bg-white border border-stone-300 text-sm font-semibold disabled:opacity-40 hover:bg-stone-50 transition"
                                >
                                    Berikutnya
                                </button>
                            </div>
                        </div>

                        <div 
                            className="bg-white shadow-xl rounded-sm overflow-hidden relative mb-6 mx-auto"
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
                                dangerouslySetInnerHTML={{ __html: editorData || "" }}
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
                                Preview Naskah &mdash; Halaman {currentPage}
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-3 h-3 rounded-full transition-all ${currentPage === i + 1 ? "bg-rose-700 scale-125" : "bg-stone-400 hover:bg-stone-600"}`}
                                        title={`Halaman ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end flex-wrap gap-3">
                    <button
                        onClick={handleGeneratePdf}
                        disabled={isGeneratingPdf}
                        className="bg-indigo-700 hover:bg-indigo-800 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Printer className="w-4 h-4" />
                        <span>{isGeneratingPdf ? "Membuat..." : "Generate PDF (Preview)"}</span>
                    </button>
                    <button
                        onClick={handleDownloadWord}
                        className="bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh Template (.doc)</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{isLoading ? "Menyimpan..." : "Simpan Template"}</span>
                    </button>
                </div>

                {toastMessage && (
                    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[70]">
                        <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                        <span className="font-medium text-sm">{toastMessage}</span>
                    </div>
                )}
            </div>

            <style>{`
                .cke_editable {
                    font-family: 'Times New Roman', Times, serif !important;
                    font-size: 11pt !important;
                    line-height: 1.6 !important;
                    color: #1c1917 !important;
                }
                .ck-content h1 { color: #881337; font-size: 22px; font-weight: 900; text-align: center; }
                .ck-content h2, .ck-content h3 { color: #881337; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; }
                .ck-content table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                .ck-content th { background-color: #881337; color: #fff; font-weight: 700; padding: 8px 12px; }
                .ck-content td { padding: 8px 12px; border: 1px solid #e7e5e4; font-size: 12px; }
            `}</style>
        </AppLayout>
    );
}
