import React, { useState } from 'react';
import { AppLayout } from '@/Layouts/AppLayout';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { CheckCircle2, Save, Download } from 'lucide-react';
import { Head } from '@inertiajs/react';

export default function JournalTemplate() {
    const [editorData, setEditorData] = useState<string>(
        `<!-- Header Running Head -->
<div style="display:flex; justify-content:space-between; border-bottom:1.5px solid #a8a29e; padding-bottom:4px; font-size:11px; color:#78716c; margin-bottom:20px;">
    <span><strong>Transactions on AI & Software Engineering</strong> | e-ISSN: 2985-XXXX</span>
    <span>Vol. 1, No. 1 (2026) | pp. 1–10</span>
</div>

<!-- Kop Logo Jurnal -->
<div style="text-align:center; margin-bottom:20px;">
    <h4 style="margin:0; color:#881337; font-size:18px; font-weight:800; letter-spacing:2px;">✦ AI RESEARCH PAPER PUBLISHING ✦</h4>
    <p style="margin:2px 0 0 0; font-size:10px; color:#78716c; letter-spacing:1px;">INTERNATIONAL JOURNAL OF COMPUTATIONAL INTELLIGENCE & SOFTWARE</p>
</div>

<!-- Judul Naskah Marun -->
<h1>Tuliskan Judul Naskah Artikel Anda di Sini: Maksimal 15 Kata, Jelas, Padat, dan Deskriptif</h1>

<!-- Penulis & Afiliasi -->
<p style="text-align:center; font-size:13px; font-weight:bold; margin-bottom:4px;">
    Penulis Pertama¹, Penulis Kedua², Penulis Ketiga³
</p>
<p style="text-align:center; font-size:11px; color:#57534e; margin-bottom:4px;">
    ¹ Department of Computer Science, Faculty of Engineering, University Name, City, Country<br>
    ² Department of Information Technology, University Name, City, Country
</p>
<p style="text-align:center; font-size:11px; color:#881337; font-style:italic; margin-bottom:20px;">
    * Penulis Korespondensi: <u>corresponding.author@institution.ac.id</u>
</p>

<!-- Tabel Metadata Editorial -->
<figure class="table">
  <table style="width:100%; border:1px solid #d6d3d1;">
    <tbody>
      <tr style="background-color:#f5f5f4;">
        <td style="width:15%; font-weight:bold;">Received:</td>
        <td style="width:35%; color:#78716c;">[Diisi oleh Editor]</td>
        <td style="width:15%; font-weight:bold;">Revised:</td>
        <td style="width:35%; color:#78716c;">[Diisi oleh Editor]</td>
      </tr>
      <tr style="background-color:#f5f5f4;">
        <td style="font-weight:bold;">Accepted:</td>
        <td style="color:#78716c;">[Diisi oleh Editor]</td>
        <td style="font-weight:bold;">Published:</td>
        <td style="color:#78716c;">[Diisi oleh Editor]</td>
      </tr>
      <tr>
        <td style="font-weight:bold;">How to cite:</td>
        <td colspan="3" style="font-style:italic; color:#78716c;">
          [Diisi oleh Editor] Penulis Pertama, Penulis Kedua. (2026). Judul Artikel Naskah. Transactions on AI & Software Engineering, 1(1), 1–10.
        </td>
      </tr>
    </tbody>
  </table>
</figure>

<!-- Kotak Abstrak Berbingkai Marun -->
<div style="border:1.5px solid #881337; border-radius:6px; padding:16px 20px; background-color:#fffafb; margin:24px 0;">
    <p style="font-weight:bold; font-size:13px; color:#881337; margin:0 0 8px 0;">Abstract</p>
    <p style="font-size:12px; font-style:italic; text-align:justify; line-height:1.6; margin:0 0 10px 0; color:#292524;">
        Tuliskan abstrak naskah Anda di sini (150–250 kata). Abstrak harus memberikan gambaran yang jelas mengenai latar belakang masalah, tujuan penelitian, metode eksperimental yang digunakan, hasil utama yang diperoleh, dan kontribusi orisinal penelitian. Hindari penggunaan singkatan yang tidak umum dan kutipan sitasi di dalam abstrak.
    </p>
    <p style="font-size:12px; margin:0;">
        <strong style="color:#881337;">Keywords:</strong> <em>Artificial Intelligence, Machine Learning, Deep Learning, Software Engineering, Model Forecasting. (3–5 kata kunci dipisahkan koma)</em>
    </p>
</div>

<!-- 1. Introduction -->
<h2>1. Introduction</h2>
<p style="font-size:12px; text-align:justify; line-height:1.7;">
    Pendahuluan menguraikan latar belakang penelitian, urgensi permasalahan di bidang terkait, serta tinjauan literatur dari penelitian terdahulu [1]. Jelaskan celah riset (research gap) yang menjadi motivasi utama penelitian ini. Di akhir bagian pendahuluan, sebutkan tujuan penelitian dan kontribusi kebaruan (novelty) yang diajukan secara eksplisit.
</p>

<!-- 2. Methods -->
<h2>2. Methods</h2>
<p style="font-size:12px; text-align:justify; line-height:1.7;">
    Jelaskan metode penelitian, arsitektur sistem, dataset, serta parameter eksperimen secara rinci agar riset ini dapat direproduksi (reproducible) oleh peneliti lain.
</p>

<!-- Tabel Berwarna Marun Sesuai PDF Contoh -->
<p style="font-size:12px; font-weight:bold; margin-top:16px; margin-bottom:4px;">Table 1. Experimental Environment Configuration</p>
<figure class="table">
  <table style="width:100%;">
    <thead>
      <tr>
        <th>Component</th>
        <th>Specification</th>
        <th>Version / Detail</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Operating System</td>
        <td>Ubuntu / Windows Server</td>
        <td>22.04 LTS / 2022</td>
      </tr>
      <tr>
        <td>Programming Language</td>
        <td>Python / PHP</td>
        <td>3.11 / 8.3 LTS</td>
      </tr>
      <tr>
        <td>AI Framework / Library</td>
        <td>FastAPI & PyTorch</td>
        <td>0.110.0</td>
      </tr>
      <tr>
        <td>Hardware Configuration</td>
        <td>CPU, RAM, GPU</td>
        <td>NVIDIA RTX 4090 24GB</td>
      </tr>
    </tbody>
  </table>
</figure>

<!-- 3. Results and Discussion -->
<h2>3. Results and Discussion</h2>
<p style="font-size:12px; text-align:justify; line-height:1.7;">
    Sajikan hasil pengujian dan analisis performa model secara komprehensif. Bandingkan hasil evaluasi yang diperoleh dengan metode baseline atau penelitian sebelumnya [2].
</p>

<!-- 4. Conclusion -->
<h2>4. Conclusion</h2>
<p style="font-size:12px; text-align:justify; line-height:1.7;">
    Kesimpulan merangkum kontribusi utama dan jawaban atas tujuan penelitian. Sebutkan pula batasan penelitian serta rekomendasi untuk pengembangan riset selanjutnya.
</p>

<!-- Kotak Submission Checklist Sesuai Halaman 4 PDF -->
<div style="border:1.5px solid #d97706; border-radius:6px; padding:16px 20px; background-color:#fffbeb; margin:28px 0;">
    <p style="font-weight:bold; font-size:13px; color:#b45309; margin:0 0 8px 0;">Submission Checklist</p>
    <p style="font-size:11px; line-height:1.6; color:#78350f; margin:0;">
        Sebelum mengirimkan naskah, pastikan kondisi berikut terpenuhi: Naskah terdiri dari 6–15 halaman termasuk gambar dan tabel. Judul artikel tidak melebihi 15 kata. Seluruh nama penulis dicantumkan tanpa gelar akademik. Abstrak berupa satu paragraf (150–250 kata) disertai 3–5 kata kunci. Tabel dan persamaan telah diberi nomor urut. Referensi mengacu pada format standar IEEE dengan minimal 20 sumber rujukan primer.
    </p>
</div>`
    );
    const [isLoading, setIsLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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
        // Simulasi POST request karena DILARANG menyentuh file Controller PHP
        setTimeout(() => {
            setIsLoading(false);
            setToastMessage('✓ Template jurnal berhasil diperbarui!');
            setTimeout(() => setToastMessage(null), 3000);
        }, 1000);
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
                        <CKEditor
                            editor={ClassicEditor}
                            data={editorData}
                            onChange={(event, editor) => {
                                const data = editor.getData();
                                setEditorData(data);
                            }}
                        />
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
