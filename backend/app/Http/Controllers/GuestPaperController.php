<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paper;
use App\Models\Purchase;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class GuestPaperController extends Controller
{
    private function getDefaultTemplate(): string
    {
        return "<div style=\"font-family: 'Times New Roman', Times, serif; color: #1c1917; line-height: 1.6;\">
            <div style=\"display:flex; justify-content:space-between; border-bottom: 2px solid #881337; padding-bottom: 8px; font-size: 11px; color: #881337; margin-bottom: 24px;\">
                <span><strong>Transactions on AI &amp; Software Engineering</strong> | e-ISSN: 2985-XXXX</span>
                <span>Vol. 1, No. 1 ({article.year}) | pp. 1-10</span>
            </div>
            <div style=\"text-align:center; margin-bottom: 30px; background-color: #fff1f2; padding: 20px; border-radius: 8px; border: 1px dashed #fda4af;\">
                <h4 style=\"margin: 0 0 5px 0; color: #881337; font-size: 18px; font-weight: 800;\">AI RESEARCH PAPER PUBLISHING</h4>
                <p style=\"margin: 0; font-size: 11px; color: #9f1239; text-transform: uppercase; font-weight: bold;\">International Journal of Computational Intelligence &amp; Software</p>
            </div>
            <h1 style=\"text-align:center; font-size: 22px; color: #881337; margin-bottom: 15px; font-weight: 900; line-height: 1.3;\">{article.title}</h1>
            <p style=\"text-align:center; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #1c1917;\">{article.author}</p>
            <p style=\"text-align:center; font-size: 11px; color: #57534e; margin-bottom: 4px; font-style: italic;\">1 Department of Computer Science, Faculty of Engineering, University Name, City, Country</p>
            <p style=\"text-align:center; font-size: 11px; color: #e11d48; font-style: italic; margin-bottom: 25px;\">* Penulis Korespondensi: <u>email@university.ac.id</u></p>
            <div style=\"border: 2px solid #881337; background-color: #fff1f2; padding: 20px; margin: 30px 0; border-radius: 8px;\">
                <p style=\"margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #881337; text-align: center; text-transform: uppercase;\">ABSTRAK / ABSTRACT</p>
                <p style=\"margin: 0 0 15px 0; font-size: 11px; text-align: justify; color: #1c1917;\">{article.abstract}</p>
                <p style=\"margin: 0; font-size: 11px; color: #1c1917;\"><strong style=\"color: #881337;\">Keywords:</strong> {article.keywords}</p>
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">1. Introduction</h3>
                {article.introduction}
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">2. Methods</h3>
                {article.methodology}
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">3. Results and Discussion</h3>
                {article.results}
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">4. Conclusion</h3>
                {article.conclusion}
            </div>
        </div>";
    }

    /**
     * Membersihkan teks bagian artikel dari judul bab / nomor bab di awal paragraf
     * agar tidak terjadi duplikasi heading (misal "1. Pendahuluan " di bawah heading 1. Introduction).
     */
    private function cleanSectionContent(?string $text): string
    {
        if (empty($text)) {
            return 'Data belum tersedia.';
        }

        $cleaned = trim($text);

        // 1. Pola nomor bab bertingkat/romawi/huruf + kata kunci judul (misal: "5.1. Kesimpulan", "Bab V Kesimpulan", "1. Pendahuluan")
        $numberedHeadingRegex = '/^\s*(?:bab\s+)?(?:[0-9]+|[IVXLCDM]+|[A-Za-z])(?:\.[0-9]+)*[\.\:\)]*\s+(?:pendahuluan|introduction|latar\s+belakang|metode(?:\s+penelitian)?|methods?(?:\s+and\s+materials)?|methodology|hasil(?:\s+dan\s+pembahasan)?|results?(?:\s+and\s+discussion)?|kesimpulan(?:\s+dan\s+saran)?|conclusion(?:\s+and\s+recommendations?)?|ringkasan|summary|diskusi|discussion)\s*[\.\:\-]*\s*/iu';

        // 2. Pola kata kunci judul mandiri tanpa nomor (harus diikuti tanda baca . : - atau baris baru)
        $standaloneHeadingRegex = '/^\s*(?:pendahuluan|introduction|latar\s+belakang|metode(?:\s+penelitian)?|methods?(?:\s+and\s+materials)?|methodology|hasil(?:\s+dan\s+pembahasan)?|results?(?:\s+and\s+discussion)?|kesimpulan(?:\s+dan\s+saran)?|conclusion(?:\s+and\s+recommendations?)?|ringkasan|summary|diskusi|discussion)\s*(?:[\.\:\-]\s*|[\r\n]+\s*)/iu';

        for ($i = 0; $i < 3; $i++) {
            $before = $cleaned;
            $cleaned = preg_replace($numberedHeadingRegex, '', $cleaned, 1);
            $cleaned = preg_replace($standaloneHeadingRegex, '', $cleaned, 1);
            $cleaned = trim($cleaned);
            if ($cleaned === $before) {
                break;
            }
        }

        // 3. Bersihkan sisa nomor urut poin tunggal di paling awal jika ada (misal: "1. Terdapat..." -> "Terdapat...")
        $cleaned = preg_replace('/^\s*[0-9]+[\.\)]\s*/u', '', $cleaned);

        // 4. Pisahkan sub-bagian "Saran" (misal "5.2. Saran Saran pengembangan...") menjadi paragraf baru yang bersih
        $cleaned = preg_replace('/(?:\s*(?:[0-9]+(?:\.[0-9]+)*[\.\:\)]*\s*)?saran\s*[\.\:\-]*\s*)(saran\s+)?/iu', "\n\nSaran ", $cleaned);

        return trim($cleaned);
    }

    /**
     * Memformat teks bagian menjadi beberapa paragraf yang terstruktur rapi dan wajar.
     */
    private function formatSectionParagraphs(?string $text, int $targetCharsPerPara = 850): string
    {
        $cleanText = $this->cleanSectionContent($text);
        if (empty($cleanText) || $cleanText === 'Data belum tersedia.') {
            return '<p style="text-align: justify; margin-bottom: 12px;">Data belum tersedia.</p>';
        }

        if (strpos($cleanText, '<p>') !== false || strpos($cleanText, '<p ') !== false) {
            return $cleanText;
        }

        $rawBlocks = preg_split('/(\r?\n){2,}/', trim($cleanText));
        $paragraphs = [];

        foreach ($rawBlocks as $block) {
            $block = trim($block);
            if (empty($block)) continue;

            if (mb_strlen($block) <= $targetCharsPerPara * 1.2) {
                $paragraphs[] = $block;
                continue;
            }

            $sentences = preg_split('/(?<=[.?!])\s+(?=[A-Z0-9"“\(])/u', $block);
            $currentPara = '';

            foreach ($sentences as $sentence) {
                $sentence = trim($sentence);
                if (empty($sentence)) continue;

                if (empty($currentPara)) {
                    $currentPara = $sentence;
                } else {
                    $currentPara .= ' ' . $sentence;
                }

                if (mb_strlen($currentPara) >= $targetCharsPerPara) {
                    $paragraphs[] = $currentPara;
                    $currentPara = '';
                }
            }

            if (!empty($currentPara)) {
                if (mb_strlen($currentPara) < 250 && count($paragraphs) > 0) {
                    $paragraphs[count($paragraphs) - 1] .= ' ' . $currentPara;
                } else {
                    $paragraphs[] = $currentPara;
                }
            }
        }

        $htmlOutput = '';
        foreach ($paragraphs as $para) {
            $para = trim($para);
            if (!empty($para)) {
                $htmlOutput .= "<p style=\"text-align: justify; text-indent: 28px; margin-bottom: 12px; line-height: 1.6;\">" . $para . "</p>";
            }
        }

        return $htmlOutput ?: "<p style=\"text-align: justify; margin-bottom: 12px;\">{$cleanText}</p>";
    }

    private function buildReplacements(Paper $paper): array
    {
        $authorsStr = $paper->uploader->name ?? 'Unknown';
        $sections   = $paper->sections ?? collect();

        $getSection = function ($name) use ($sections) {
            $sec = $sections->where('section_name', $name)->first();
            return $sec ? $this->formatSectionParagraphs($sec->summary) : '<p style="text-align: justify; margin-bottom: 12px;">Data belum tersedia.</p>';
        };

        $keywordsStr = 'Tidak ada kata kunci.';
        if ($paper->analyses && $paper->analyses->isNotEmpty()) {
            $analysis = $paper->analyses->first();
            $kwArray  = json_decode($analysis->keywords, true);
            if (is_array($kwArray)) {
                $keywordsStr = implode(', ', $kwArray);
            } elseif (is_string($analysis->keywords)) {
                $keywordsStr = $analysis->keywords;
            }
        }

        return [
            '{article.title}'        => $paper->title ?? 'Untitled',
            '{article.author}'       => $authorsStr,
            '{article.year}'         => $paper->publication_year ?? date('Y'),
            '{article.journal}'      => $paper->journal ?? 'Jurnal Default',
            '{article.abstract}'     => $paper->abstract ?? 'Tidak ada abstrak.',
            '{article.keywords}'     => $keywordsStr,
            '{article.introduction}' => $getSection('Research Problem'),
            '{article.methodology}'  => $getSection('Methodology'),
            '{article.results}'      => $getSection('Results'),
            '{article.conclusion}'   => $getSection('Conclusion'),
        ];
    }

    private function loadTemplate(): string
    {
        return Storage::exists('journal_template.html')
            ? Storage::get('journal_template.html')
            : $this->getDefaultTemplate();
    }

    private function renderTemplate(string $template, array $replacements): string
    {
        return str_replace(array_keys($replacements), array_values($replacements), $template);
    }

    /**
     * Katalog publik: semua paper PUBLISHED.
     */
    public function index()
    {
        $papers = Paper::with('uploader')
            ->where('submission_status', 'PUBLISHED')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('Guest/Catalog', ['papers' => $papers]);
    }

    /**
     * Detail paper publik.
     * - OPEN_ACCESS  -> renderedTemplate (full), abstractHtml
     * - CLOSED_ACCESS -> renderedTemplate = null, abstractHtml (preview)
     */
    public function show($id)
    {
        $paper = Paper::with(['uploader', 'analyses', 'sections'])
            ->where('submission_status', 'PUBLISHED')
            ->findOrFail($id);

        $hasPurchased = false;
        if (Auth::check()) {
            $hasPurchased = Purchase::where('user_id', Auth::id())
                ->where('paper_id', $paper->id)
                ->where('payment_status', 'PAID')
                ->exists();
        }

        // Paper terkunci HANYA jika tipenya CLOSED_ACCESS dan user belum membeli
        $isLocked = ($paper->access_type === 'CLOSED_ACCESS') && !$hasPurchased;
        $template    = $this->loadTemplate();
        $replacements = $this->buildReplacements($paper);

        $renderedTemplate = $this->renderTemplate($template, $replacements);

        // Abstract-only preview for paywall preview
        $abstractOnlyTemplate = "<div style=\"font-family: 'Times New Roman', Times, serif; color: #1c1917; line-height: 1.6; padding: 16px 0;\">
            <h1 style=\"text-align:center; font-size: 22px; color: #881337; margin-bottom: 15px; font-weight: 900; line-height: 1.3;\">{article.title}</h1>
            <p style=\"text-align:center; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #1c1917;\">{article.author}</p>
            <p style=\"text-align:center; font-size: 11px; color: #57534e; margin-bottom: 25px; font-style: italic;\">
                Published in: {article.journal} ({article.year})
            </p>
            <div style=\"border: 2px solid #881337; background-color: #fff1f2; padding: 20px; margin: 20px 0; border-radius: 8px;\">
                <p style=\"margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #881337; text-align: center; text-transform: uppercase;\">ABSTRAK / ABSTRACT</p>
                <p style=\"margin: 0 0 15px 0; font-size: 11px; text-align: justify; color: #1c1917;\">{article.abstract}</p>
                <p style=\"margin: 0; font-size: 11px; color: #1c1917;\"><strong style=\"color: #881337;\">Keywords:</strong> {article.keywords}</p>
            </div>
        </div>";

        $abstractHtml = $this->renderTemplate($abstractOnlyTemplate, $replacements);
        $price = ($paper->price && $paper->price > 0) ? (int)$paper->price : 25000;

        return Inertia::render('Guest/PaperDetail', [
            'paper'            => $paper,
            'isLocked'         => $isLocked,
            'hasPurchased'     => $hasPurchased,
            'price'            => $price,
            'renderedTemplate' => $isLocked ? null : $renderedTemplate,
            'abstractHtml'     => $abstractHtml,
        ]);
    }

    /**
     * Full reader — hanya diakses setelah bayar (CLOSED_ACCESS) atau gratis (OPEN_ACCESS).
     */
    public function read(Request $request, $id)
    {
        $paper = Paper::with(['uploader', 'analyses', 'sections'])
            ->where('submission_status', 'PUBLISHED')
            ->findOrFail($id);

        $hasPurchased = false;
        if (Auth::check()) {
            $hasPurchased = Purchase::where('user_id', Auth::id())
                ->where('paper_id', $paper->id)
                ->where('payment_status', 'PAID')
                ->exists();
        } elseif ($request->filled('token')) {
            $hasPurchased = Purchase::where('access_token', $request->input('token'))
                ->where('paper_id', $paper->id)
                ->where('payment_status', 'PAID')
                ->exists();
        }

        if ($paper->access_type !== 'OPEN_ACCESS' && !$hasPurchased) {
            return redirect()->route('guest.catalog.show', $id)
                ->with('error', 'Silakan beli naskah ini terlebih dahulu.');
        }

        $template     = $this->loadTemplate();
        $replacements = $this->buildReplacements($paper);
        $renderedTemplate = $this->renderTemplate($template, $replacements);

        return Inertia::render('Guest/PaperReader', [
            'paper'            => $paper,
            'renderedTemplate' => $renderedTemplate,
        ]);
    }

    /**
     * Generate file PDF utuh dari template jurnal berisikan metadata dan teks artikel hasil ekstraksi AI.
     */
    public function generatePdf(Paper $paper): string
    {
        $template = $this->loadTemplate();
        $replacements = $this->buildReplacements($paper);
        $htmlContent = $this->renderTemplate($template, $replacements);

        $html = "<!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>" . htmlspecialchars($paper->title ?? 'Naskah Jurnal') . "</title>
            <style>
                @page { size: A4; margin: 20mm 20mm 20mm 20mm; }
                body { font-family: 'DejaVu Serif', 'Times New Roman', serif; font-size: 10pt; line-height: 1.5; color: #1c1917; }
                table { border-collapse: collapse; width: 100%; margin: 10pt 0; }
                th { background-color: #881337; color: #ffffff; font-weight: bold; padding: 6pt 8pt; border: 1px solid #9f1239; font-size: 9pt; }
                td { padding: 6pt 8pt; border: 1px solid #e7e5e4; font-size: 9pt; }
                h1 { color: #881337; font-size: 16pt; font-weight: bold; text-align: center; margin: 12pt 0; line-height: 1.3; }
                h2, h3 { color: #881337; font-size: 11pt; font-weight: bold; border-bottom: 1px solid #fecdd3; padding-bottom: 3pt; margin-top: 14pt; margin-bottom: 6pt; }
                p { margin-bottom: 8pt; text-align: justify; }
            </style>
        </head>
        <body>
            " . $htmlContent . "
        </body>
        </html>";

        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('defaultFont', 'serif');

        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }

    /**
     * Download / Stream PDF hasil generate template jurnal untuk paper tertentu.
     */
    public function downloadPdf(Request $request, $id)
    {
        $paper = Paper::with(['uploader', 'analyses', 'sections'])
            ->where('submission_status', 'PUBLISHED')
            ->findOrFail($id);

        $hasPurchased = false;
        if (Auth::check()) {
            $hasPurchased = Purchase::where('user_id', Auth::id())
                ->where('paper_id', $paper->id)
                ->where('payment_status', 'PAID')
                ->exists();
        } elseif ($request->filled('token')) {
            $hasPurchased = Purchase::where('access_token', $request->input('token'))
                ->where('paper_id', $paper->id)
                ->where('payment_status', 'PAID')
                ->exists();
        }

        if ($paper->access_type !== 'OPEN_ACCESS' && !$hasPurchased) {
            return redirect()->route('guest.catalog.show', $id)
                ->with('error', 'Silakan beli naskah ini terlebih dahulu.');
        }

        $generatedDir = storage_path('app/generated_papers');
        if (!file_exists($generatedDir)) {
            mkdir($generatedDir, 0755, true);
        }

        $cleanFilename = preg_replace('/[^a-zA-Z0-9_-]/', '_', substr($paper->title ?? 'paper', 0, 40));
        $cacheFile = $generatedDir . '/paper_' . $paper->id . '.pdf';

        if (!file_exists($cacheFile) || $request->has('regenerate')) {
            $pdfContent = $this->generatePdf($paper);
            file_put_contents($cacheFile, $pdfContent);
        }

        $isDownload = $request->query('download', '0') === '1';
        $disposition = $isDownload ? 'attachment' : 'inline';

        return response()->file($cacheFile, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition . '; filename="Jurnal_' . $cleanFilename . '.pdf"'
        ]);
    }
}
