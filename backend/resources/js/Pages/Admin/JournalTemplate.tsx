import React, { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/Layouts/AppLayout';
import { CheckCircle2, Save, Download } from 'lucide-react';
import { Head, router } from '@inertiajs/react';

export default function JournalTemplate({ initialTemplate = "" }: { initialTemplate?: string }) {
    const [editorData, setEditorData] = useState<string>(initialTemplate);
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorInstanceRef = useRef<any>(null);

    useEffect(() => {
        let isCancelled = false;
        let timer: any = null;

        const initCKEditor5 = () => {
            if (isCancelled || !editorContainerRef.current || editorInstanceRef.current) return;
            if (typeof window === 'undefined' || !(window as any).CKEDITOR || !(window as any).CKEDITOR.ClassicEditor) return;

            (window as any).CKEDITOR.ClassicEditor.create(editorContainerRef.current, {
                licenseKey: 'GPL',
                toolbar: {
                    items: [
                        'sourceEditing', '|',
                        'findAndReplace', 'selectAll', '|',
                        'heading', '|',
                        'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', 'highlight', '|',
                        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'code', 'removeFormat', '|',
                        'alignment', '|',
                        'bulletedList', 'numberedList', 'todoList', '|',
                        'outdent', 'indent', '|',
                        'insertTable', 'blockQuote', 'codeBlock', 'horizontalLine', 'pageBreak', 'specialCharacters', '|',
                        'link', '|',
                        'undo', 'redo'
                    ],
                    shouldNotGroupWhenFull: true
                },
                removePlugins: [
                    'AIAssistant', 'CKBox', 'CKFinder', 'EasyImage', 'RealTimeCollaborativeComments',
                    'RealTimeCollaborativeTrackChanges', 'RealTimeCollaborativeRevisionHistory',
                    'PresenceList', 'Comments', 'TrackChanges', 'TrackChangesData', 'RevisionHistory',
                    'Pagination', 'WProofreader', 'MathType', 'SlashCommand', 'Template',
                    'DocumentOutline', 'FormatPainter', 'TableOfContents', 'PasteFromOfficeEnhanced', 'CaseChange',
                    'ExportPdf', 'ExportWord', 'MultiLevelList', 'MergeTags'
                ],
                table: {
                    contentToolbar: [
                        'tableColumn', 'tableRow', 'mergeTableCells',
                        'tableProperties', 'tableCellProperties'
                    ]
                },
                fontSize: {
                    options: [
                        9, 10, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32
                    ],
                    supportAllValues: true
                },
                fontFamily: {
                    options: [
                        'default',
                        'Times New Roman, Times, serif',
                        'Palatino Linotype, Book Antiqua, Palatino, serif',
                        'Arial, Helvetica, sans-serif',
                        'Courier New, Courier, monospace',
                        'Georgia, serif',
                        'Lucida Sans Unicode, Lucida Grande, sans-serif',
                        'Tahoma, Geneva, sans-serif',
                        'Trebuchet MS, Helvetica, sans-serif',
                        'Verdana, Geneva, sans-serif'
                    ],
                    supportAllValues: true
                },
                htmlSupport: {
                    allow: [{ name: /.*/, attributes: true, classes: true, styles: true }]
                }
            }).then((editor: any) => {
                if (isCancelled) {
                    editor.destroy();
                    return;
                }
                editorInstanceRef.current = editor;

                if (editor.disableReadOnlyMode && editor._readOnlyLocks) {
                    for (const lock of Array.from(editor._readOnlyLocks)) {
                        editor.disableReadOnlyMode(lock);
                    }
                }

                if (initialTemplate) {
                    editor.setData(initialTemplate);
                }

                editor.model.document.on('change:data', () => {
                    setEditorData(editor.getData());
                });
            }).catch((error: any) => {
                console.error("CKEditor initialization error:", error);
            });
        };

        const checkScript = () => {
            if (isCancelled) return;
            if (typeof window !== 'undefined' && (window as any).CKEDITOR && (window as any).CKEDITOR.ClassicEditor) {
                initCKEditor5();
            } else {
                timer = setTimeout(checkScript, 100);
            }
        };

        checkScript();
        
        return () => {
            isCancelled = true;
            if (timer) clearTimeout(timer);
            if (editorInstanceRef.current) {
                editorInstanceRef.current.destroy();
                editorInstanceRef.current = null;
            }
        };
    }, [initialTemplate]);

    const handleDownloadWord = () => {
        let processedHtml = editorData;

        // 1. Hapus tag figure bawaan CKEditor
        processedHtml = processedHtml.replace(/<\/?figure[^>]*>/gi, '');

        // 2. HAPUS tag <thead> dan <tbody> agar Word tidak membuat baris hantu/benjolan di atas tabel
        processedHtml = processedHtml.replace(/<\/?(thead|tbody)[^>]*>/gi, '');

        // 3. Ubah semua <th> menjadi <td> dengan styling header marun resmi Word yang kokoh
        processedHtml = processedHtml.replace(/<th[^>]*>/gi, '<td bgcolor="#881337" style="background-color: #881337; color: #ffffff; font-weight: bold; border: 1px solid #78716c; padding: 6pt 10pt; font-size: 10pt; text-align: left;">');
        processedHtml = processedHtml.replace(/<\/th>/gi, '</td>');

        // 4. Pastikan semua <td> yang bukan header memiliki border tegas dan padding yang rapi
        processedHtml = processedHtml.replace(/<td(?![^>]*bgcolor)([^>]*)>/gi, '<td style="border: 1px solid #78716c; padding: 6pt 10pt; font-size: 10pt; vertical-align: top;"$1>');

        // 5. Pastikan tag <table> memiliki atribut tabel Word yang presisi
        processedHtml = processedHtml.replace(/<table[^>]*>/gi, '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse: collapse; width: 100%; border: 1px solid #78716c; margin: 12pt 0;">');

        const wordStyles = `
            <style>
                @page {
                    size: A4;
                    margin: 2.5cm 2.5cm 2.5cm 2.5cm;
                }
                body {
                    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
                    font-size: 11pt;
                    line-height: 1.5;
                    color: #1c1917;
                }
                table {
                    border-collapse: collapse !important;
                    width: 100% !important;
                    margin: 12pt 0 !important;
                    border: 1px solid #78716c !important;
                }
                td {
                    border: 1px solid #78716c !important;
                    padding: 6pt 10pt !important;
                }
            </style>
        `;

        const header = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>Template Naskah Jurnal</title>
                ${wordStyles}
            </head>
            <body>
        `;
        const footer = "</body></html>";
        const fullContent = header + processedHtml + footer;

        const blob = new Blob(['\ufeff' + fullContent], {
            type: 'application/msword;charset=utf-8'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Template_Naskah_Jurnal_2026.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleSave = () => {
        setIsLoading(true);
        router.post('/admin/journal-template', { template: editorData }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsLoading(false);
                setToastMessage('✓ Template jurnal berhasil diperbarui!');
                setTimeout(() => setToastMessage(null), 3000);
            },
            onError: () => {
                setIsLoading(false);
                setToastMessage('✗ Gagal menyimpan template.');
                setTimeout(() => setToastMessage(null), 3000);
            }
        });
    };

    return (
        <AppLayout defaultRole="admin">
            <Head title="Kelola Template Jurnal" />
            <div className="p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-stone-900">Kelola Template Jurnal</h1>
                    <p className="text-sm text-stone-500 mt-1">
                        Atur format standar naskah, panduan penulisan, dan struktur publikasi jurnal secara visual.
                    </p>
                </div>

                <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm mb-6">
                    <div className="ck-editor-container min-h-[400px]">
                        <div ref={editorContainerRef}></div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        onClick={handleDownloadWord}
                        className="bg-stone-800 hover:bg-stone-900 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm flex items-center space-x-2 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span>Unduh Template (.doc)</span>
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm flex items-center space-x-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{isLoading ? 'Menyimpan...' : 'Simpan Template'}</span>
                    </button>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                    <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-[70]">
                        <CheckCircle2 className="w-5 h-5 text-emerald-100" />
                        <span className="font-medium text-sm">{toastMessage}</span>
                    </div>
                )}
            </div>
            
            {/* Inject minimal css to fix ckeditor height and look */}
            <style>{`
                .ck-editor__editable_inline {
                    min-height: 800px !important;
                    max-width: 850px !important;
                    margin: 20px auto !important;
                    padding: 40px 60px !important;
                    background: #ffffff !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif !important;
                    color: #1c1917 !important;
                    line-height: 1.6 !important;
                }
                .ck-content h1 {
                    color: #881337 !important;
                    font-size: 22px !important;
                    font-weight: 800 !important;
                    text-align: center !important;
                    margin: 18px 0 !important;
                    line-height: 1.3 !important;
                }
                .ck-content h2 {
                    color: #881337 !important;
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    margin-top: 24px !important;
                    margin-bottom: 8px !important;
                    border-bottom: 1px solid #fecdd3 !important;
                    padding-bottom: 4px !important;
                }
                .ck-content table th {
                    background-color: #881337 !important;
                    color: #ffffff !important;
                    font-weight: 700 !important;
                    text-align: left !important;
                    padding: 8px 12px !important;
                }
                .ck-content table td {
                    padding: 8px 12px !important;
                    border: 1px solid #e7e5e4 !important;
                    font-size: 12px !important;
                }
            `}</style>
        </AppLayout>
    );
}
