<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paper;
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
                <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.introduction}</p>
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">2. Methods</h3>
                <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.methodology}</p>
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">3. Results and Discussion</h3>
                <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.results}</p>
            </div>
            <div style=\"margin-bottom: 20px;\">
                <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">4. Conclusion</h3>
                <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.conclusion}</p>
            </div>
        </div>";
    }

    private function buildReplacements(Paper $paper): array
    {
        $authorsStr = $paper->uploader->name ?? 'Unknown';
        $sections   = $paper->sections ?? collect();

        $getSection = function ($name) use ($sections) {
            $sec = $sections->where('section_name', $name)->first();
            return $sec ? $sec->summary : 'Data belum tersedia.';
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

        $isLocked    = $paper->access_type === 'CLOSED_ACCESS';
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

        return Inertia::render('Guest/PaperDetail', [
            'paper'            => $paper,
            'isLocked'         => $isLocked,
            'price'            => $paper->price ?? 0,
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
        if (auth()->check()) {
            $hasPurchased = \App\Models\Purchase::where('user_id', auth()->id())
                ->where('paper_id', $paper->id)
                ->where('payment_status', 'PAID')
                ->exists();
        } elseif ($request->has('token')) {
            $hasPurchased = \App\Models\Purchase::where('access_token', $request->token)
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
}
