/**
 * Utility untuk konversi dan ekspor HTML ke Microsoft Word (.doc)
 * dengan mempertahankan warna teks (HEX/RGB/HSL), border tabel,
 * heading color, dan background box template jurnal.
 */

function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function rgbToHex(r: number, g: number, b: number): string {
    return (
        "#" +
        [r, g, b]
            .map((x) => {
                const hex = Math.round(Number(x)).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
    );
}

/**
 * Memproses HTML agar kompatibel penuh dengan mesin rendering Microsoft Word HTML
 */
export function prepareHtmlForWord(rawHtml: string): string {
    if (!rawHtml) return "";
    let html = rawHtml;

    // 1. Konversi semua warna HSL / HSLA dari CKEditor menjadi HEX 6 digit
    html = html.replace(
        /hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%(?:\s*,\s*[\d\.]+)?\s*\)/gi,
        (_match, h, s, l) => {
            return hslToHex(parseFloat(h), parseFloat(s), parseFloat(l));
        }
    );

    // 2. Konversi semua warna RGB / RGBA menjadi HEX 6 digit
    html = html.replace(
        /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d\.]+)?\s*\)/gi,
        (_match, r, g, b) => {
            return rgbToHex(parseInt(r, 10), parseInt(g, 10), parseInt(b, 10));
        }
    );

    // 3. Hapus wrapper <figure class="table"> bawaan CKEditor
    html = html.replace(/<\/?figure[^>]*>/gi, "");

    // 4. Hapus <thead> dan <tbody> agar tabel tidak glitch di MS Word
    html = html.replace(/<\/?(thead|tbody)[^>]*>/gi, "");

    // 5. Ubah <th> menjadi <td> dengan styling header eksplisit dan background warna maroon
    html = html.replace(/<th([^>]*)>/gi, (_match, attrs) => {
        return `<td bgcolor="#881337" style="background-color: #881337; color: #ffffff; font-weight: bold; border: 1px solid #9f1239; padding: 6pt 10pt; font-size: 10pt; text-align: left;"${attrs}>`;
    });
    html = html.replace(/<\/th>/gi, "</td>");

    // 6. Propagasi background-color dari <tr style="..."> ke setiap child <td> (MS Word mengabaikan warna di <tr>)
    html = html.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/gi, (_match, trAttrs, trContent) => {
        const bgMatch = trAttrs.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8})/i);
        if (bgMatch) {
            const hexColor = bgMatch[1];
            trContent = trContent.replace(/<td([^>]*)>/gi, (_tdMatch, tdAttrs) => {
                let newAttrs = tdAttrs;
                if (!/bgcolor/i.test(newAttrs)) {
                    newAttrs = ` bgcolor="${hexColor}"` + newAttrs;
                }
                if (/style\s*=\s*"/i.test(newAttrs)) {
                    if (!/background/i.test(newAttrs)) {
                        newAttrs = newAttrs.replace(/style\s*=\s*"/i, `style="background-color: ${hexColor}; `);
                    }
                } else {
                    newAttrs += ` style="background-color: ${hexColor};"`;
                }
                return `<td${newAttrs}>`;
            });
        }
        return `<tr${trAttrs}>${trContent}</tr>`;
    });

    // 7. Pastikan setiap tag <td> memiliki border dan padding tanpa menduplikasi atribut style=""
    html = html.replace(/<td([^>]*)>/gi, (_match, attrs) => {
        if (/style\s*=\s*"/i.test(attrs)) {
            let updated = attrs;
            if (!/border/i.test(attrs)) {
                updated = updated.replace(/style\s*=\s*"/i, 'style="border: 1px solid #78716c; ');
            }
            if (!/padding/i.test(attrs)) {
                updated = updated.replace(/style\s*=\s*"/i, 'style="padding: 6pt 10pt; ');
            }
            if (!/vertical-align/i.test(attrs)) {
                updated = updated.replace(/style\s*=\s*"/i, 'style="vertical-align: top; ');
            }
            return `<td${updated}>`;
        } else {
            return `<td style="border: 1px solid #78716c; padding: 6pt 10pt; font-size: 10pt; vertical-align: top;"${attrs}>`;
        }
    });

    // Bersihkan jika ada atribut style ganda yang tersisa
    html = html.replace(/<td([^>]*)style="([^"]*)"([^>]*)style="([^"]*)"([^>]*)>/gi, '<td$1$3$5 style="$2; $4">');

    // 8. Pastikan <table> memiliki border, cellspacing, dan cellpadding untuk MS Word
    html = html.replace(/<table([^>]*)>/gi, (_match, attrs) => {
        let newAttrs = attrs;
        if (!/border=/i.test(newAttrs)) newAttrs += ' border="1"';
        if (!/cellspacing=/i.test(newAttrs)) newAttrs += ' cellspacing="0"';
        if (!/cellpadding=/i.test(newAttrs)) newAttrs += ' cellpadding="6"';
        if (/style\s*=\s*"/i.test(newAttrs)) {
            newAttrs = newAttrs.replace(/style\s*=\s*"/i, 'style="border-collapse: collapse; width: 100%; margin: 12pt 0; ');
        } else {
            newAttrs += ' style="border-collapse: collapse; width: 100%; border: 1px solid #78716c; margin: 12pt 0;"';
        }
        return `<table${newAttrs}>`;
    });

    // 9. Konversi header bar (display: flex) menjadi tabel 2 kolom MS Word
    html = html.replace(/<div([^>]*display\s*:\s*flex[^>]*)>([\s\S]*?)<\/div>/gi, (match, _divAttrs, divContent) => {
        const spans = divContent.match(/<span[^>]*>([\s\S]*?)<\/span>/gi);
        if (spans && spans.length >= 2) {
            return `
            <table border="0" cellspacing="0" cellpadding="0" width="100%" style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #881337; margin-bottom: 18pt;">
                <tr>
                    <td align="left" style="border: none; border-bottom: 2px solid #881337; color: #881337; font-size: 8.5pt; padding-bottom: 6pt; text-align: left;">
                        ${spans[0]}
                    </td>
                    <td align="right" style="border: none; border-bottom: 2px solid #881337; color: #881337; font-size: 8.5pt; padding-bottom: 6pt; text-align: right;">
                        ${spans[1]}
                    </td>
                </tr>
            </table>`;
        }
        return match;
    });

    // 10. Konversi callout box / panel berbingkai (div dengan background atau border) menjadi tabel 1 sel
    // MS Word tidak mendukung background-color dan border pada tag <div>
    html = html.replace(/<div([^>]*style="[^"]*(?:background(?:-color)?|border)[^"]*"[^>]*)>([\s\S]*?)<\/div>/gi, (match, divAttrs, divContent) => {
        if (/display\s*:\s*flex/i.test(divAttrs)) return match;
        const bgMatch = divAttrs.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{3,8})/i);
        const borderMatch = divAttrs.match(/border(?:-color)?\s*:\s*([^;"]+)/i);
        const hexBg = bgMatch ? bgMatch[1] : "#fff1f2";
        const borderStyle = borderMatch ? borderMatch[1] : "1px solid #fda4af";

        return `
        <table border="1" cellspacing="0" cellpadding="14" width="100%" bgcolor="${hexBg}" style="width: 100%; border: ${borderStyle}; background-color: ${hexBg}; margin: 16pt 0; border-collapse: collapse; mso-shading: ${hexBg};">
            <tr>
                <td bgcolor="${hexBg}" style="background-color: ${hexBg}; border: ${borderStyle}; padding: 14pt; mso-shading: ${hexBg};">
                    ${divContent}
                </td>
            </tr>
        </table>`;
    });

    // 11. Bungkus teks berwarna (span style="color: #hex") dengan tag <font color="#hex">
    // Mesin Word 97-2003 merender <font color="..."> secara native dan tidak mengabaikannya
    html = html.replace(/<span([^>]*style="[^"]*color\s*:\s*(#[0-9a-f]{3,8})[^"]*"[^>]*)>([\s\S]*?)<\/span>/gi, (match, spanAttrs, colorHex, spanContent) => {
        if (/<font\s+color=/i.test(spanContent)) return match;
        return `<span${spanAttrs}><font color="${colorHex}">${spanContent}</font></span>`;
    });

    // 12. Pastikan tag judul (h1..h4) mempertahankan warna maroon (#881337) atau warna kustomnya
    html = html.replace(/<(h[1-4])([^>]*)>([\s\S]*?)<\/\1>/gi, (_match, tag, attrs, content) => {
        const colorMatch = attrs.match(/color\s*:\s*(#[0-9a-f]{3,8})/i);
        const color = colorMatch ? colorMatch[1] : "#881337";
        let newAttrs = attrs;
        if (!/style\s*=/i.test(newAttrs)) {
            newAttrs += ` style="color: ${color}; font-family: 'Times New Roman', serif;"`;
        } else if (!/color\s*:/i.test(newAttrs)) {
            newAttrs = newAttrs.replace(/style\s*=\s*"/i, `style="color: ${color}; `);
        }
        if (/<font\s+color=/i.test(content)) {
            return `<${tag}${newAttrs}>${content}</${tag}>`;
        }
        return `<${tag}${newAttrs}><font color="${color}">${content}</font></${tag}>`;
    });

    // 13. Dukungan page break jika ada pembatas halaman dari CKEditor
    html = html.replace(/<div[^>]*class="page-break"[^>]*>.*?<\/div>/gi, '<br style="page-break-before:always;" clear="all" />');

    return html;
}

/**
 * Menghasilkan file Word .doc dan memicu download di browser
 */
export function downloadWordDocument(filename: string, rawHtml: string, title = "Draft Naskah Jurnal") {
    const processedHtml = prepareHtmlForWord(rawHtml);

    const wordStyles = `
        <style>
            @page {
                size: A4;
                margin: 2.5cm 2.5cm 2.5cm 2.5cm;
                mso-page-orientation: portrait;
            }
            body {
                font-family: 'Times New Roman', Times, serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #1c1917;
            }
            h1, .h1 {
                color: #881337 !important;
                font-family: 'Times New Roman', Times, serif;
                font-size: 18pt;
                font-weight: bold;
                text-align: center;
                margin: 16pt 0 8pt 0;
                mso-color-alt: #881337;
            }
            h2, .h2 {
                color: #881337 !important;
                font-family: 'Times New Roman', Times, serif;
                font-size: 13pt;
                font-weight: bold;
                margin: 14pt 0 6pt 0;
                mso-color-alt: #881337;
            }
            h3, .h3 {
                color: #881337 !important;
                font-family: 'Times New Roman', Times, serif;
                font-size: 12pt;
                font-weight: bold;
                margin: 12pt 0 4pt 0;
                mso-color-alt: #881337;
            }
            h4, .h4 {
                color: #881337 !important;
                font-family: 'Times New Roman', Times, serif;
                font-size: 11pt;
                font-weight: bold;
                margin: 10pt 0 4pt 0;
                mso-color-alt: #881337;
            }
            p {
                margin-bottom: 6pt;
                line-height: 1.5;
            }
            table {
                border-collapse: collapse !important;
                width: 100% !important;
                margin: 12pt 0 !important;
            }
            th {
                background-color: #881337 !important;
                color: #ffffff !important;
                font-weight: bold !important;
                padding: 6pt 10pt !important;
                font-size: 10pt !important;
                border: 1px solid #9f1239 !important;
            }
            td {
                padding: 6pt 10pt !important;
                font-size: 10pt !important;
                vertical-align: top !important;
            }
            font[color] {
                mso-color-alt: auto;
            }
        </style>
    `;

    const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
            <meta charset='utf-8'>
            <title>${title}</title>
            <!--[if gte mso 9]>
            <xml>
                <w:WordDocument>
                    <w:View>Print</w:View>
                    <w:Zoom>100</w:Zoom>
                    <w:DoNotOptimizeForBrowser/>
                </w:WordDocument>
            </xml>
            <![endif]-->
            ${wordStyles}
        </head>
        <body>
    `;
    const footer = "</body></html>";
    const fullContent = header + processedHtml + footer;

    const blob = new Blob(["\ufeff" + fullContent], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".doc") ? filename : `${filename}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
