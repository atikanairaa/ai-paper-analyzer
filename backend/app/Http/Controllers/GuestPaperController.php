<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paper;
use Inertia\Inertia;

class GuestPaperController extends Controller
{
    /**
     * Mengambil semua paper yang status = 'PUBLISHED' untuk ditampilkan ke katalog publik.
     */
    public function index()
    {
        $papers = Paper::with('uploader')
            ->where('submission_status', 'PUBLISHED')
            ->orderBy('created_at', 'desc')
            ->get();
            
        return Inertia::render('Guest/Catalog', [
            'papers' => $papers
        ]);
    }

    /**
     * Cek status paper. Jika OPEN_ACCESS, berikan akses link PDF. Jika CLOSED_ACCESS, kirimkan sinyal bahwa naskah terkunci (paywall).
     */
        public function show($id)
    {
        $paper = Paper::with('uploader')->where('submission_status', 'PUBLISHED')->findOrFail($id);
        
        $isLocked = $paper->access_type === 'CLOSED_ACCESS';

        $defaultTemplate = "<div style=\"font-family: 'Times New Roman', Times, serif; color: #1c1917; line-height: 1.6;\">     <div style=\"display:flex; justify-content:space-between; border-bottom: 2px solid #881337; padding-bottom: 8px; font-size: 11px; color: #881337; margin-bottom: 24px;\">         <span><strong>Transactions on AI &amp; Software Engineering</strong> | e-ISSN: 2985-XXXX</span>         <span>Vol. 1, No. 1 ({article.year}) | pp. 1-10</span>     </div>      <div style=\"text-align:center; margin-bottom: 30px; background-color: #fff1f2; padding: 20px; border-radius: 8px; border: 1px dashed #fda4af;\">         <h4 style=\"margin: 0 0 5px 0; color: #881337; font-size: 18px; font-weight: 800; letter-spacing: 2px;\">? AI RESEARCH PAPER PUBLISHING ?</h4>         <p style=\"margin: 0; font-size: 11px; color: #9f1239; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;\">International Journal of Computational Intelligence &amp; Software</p>     </div>      <h1 style=\"text-align:center; font-size: 22px; color: #881337; margin-bottom: 15px; font-weight: 900; line-height: 1.3;\">         {article.title}     </h1>      <p style=\"text-align:center; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #1c1917;\">         {article.author}     </p>     <p style=\"text-align:center; font-size: 11px; color: #57534e; margin-bottom: 4px; font-style: italic;\">         1 Department of Computer Science, Faculty of Engineering, University Name, City, Country     </p>     <p style=\"text-align:center; font-size: 11px; color: #e11d48; font-style: italic; margin-bottom: 25px;\">         * Penulis Korespondensi: <u>email@university.ac.id</u>     </p>      <figure class=\"table\">         <table style=\"width:100%; border: 1px solid #9f1239; border-collapse: collapse;\">             <tbody>                 <tr style=\"background-color: #fff1f2;\">                     <td style=\"width:15%; font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Received:</td>                     <td style=\"width:35%; color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                     <td style=\"width:15%; font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Revised:</td>                     <td style=\"width:35%; color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                 </tr>                 <tr style=\"background-color: #fff1f2;\">                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Accepted:</td>                     <td style=\"color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Published:</td>                     <td style=\"color: #57534e; border: 1px solid #fda4af; padding: 8px;\">[Diisi oleh Editor]</td>                 </tr>                 <tr>                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px; background-color: #fff1f2;\">How to cite:</td>                     <td colspan=\"3\" style=\"border: 1px solid #fda4af; padding: 8px; font-size: 10px; color: #57534e;\">                         [Diisi oleh Editor] {article.author}. (2026). {article.title}. Transactions on AI &amp; Software Engineering, 1(1), 1-10.                     </td>                 </tr>             </tbody>         </table>     </figure>      <div style=\"border: 2px solid #881337; background-color: #fff1f2; padding: 20px; margin: 30px 0; border-radius: 8px;\">         <p style=\"margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #881337; text-align: center; text-transform: uppercase;\">             ABSTRAK / ABSTRACT         </p>         <p style=\"margin: 0 0 15px 0; font-size: 11px; text-align: justify; color: #1c1917;\">             {article.abstract}         </p>         <p style=\"margin: 0; font-size: 11px; color: #1c1917;\">             <strong style=\"color: #881337;\">Keywords:</strong> {article.keywords}         </p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">1. Introduction</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.introduction}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">2. Methods</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.methodology}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">3. Results and Discussion</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.results}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">4. Conclusion</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.conclusion}</p>     </div> </div>";
        $template = \Illuminate\Support\Facades\Storage::exists('journal_template.html') 
            ? \Illuminate\Support\Facades\Storage::get('journal_template.html') 
            : $defaultTemplate;

        
        $authorsStr = $paper->uploader->name ?? 'Unknown';
        // Ekstraksi data section (Introduction, Method, Result, Conclusion) dari AI
        $sections = $paper->sections ?? collect();
        
        $getSection = function($name) use ($sections) {
            $sec = $sections->where('section_name', $name)->first();
            return $sec ? $sec->summary : 'Data belum tersedia.';
        };

        $intro = $getSection('Research Problem');
        $methodology = $getSection('Methodology');
        $results = $getSection('Results');
        $conclusion = $getSection('Conclusion');


        $keywordsStr = 'Tidak ada kata kunci.';
        if ($paper->analyses && $paper->analyses->isNotEmpty()) {
            $analysis = $paper->analyses->first();
            $kwArray = json_decode($analysis->keywords, true);
            if (is_array($kwArray)) {
                $keywordsStr = implode(', ', $kwArray);
            } elseif (is_string($analysis->keywords)) {
                $keywordsStr = $analysis->keywords;
            }
        }
        
        // Render template variables
        $renderedTemplate = str_replace(
            [
                '{article.title}', 
                '{article.author}', 
                '{article.year}', 
                '{article.journal}', 
                '{article.abstract}',
                '{article.keywords}',
                '{article.introduction}',
                '{article.methodology}',
                '{article.results}',
                '{article.conclusion}'
            ],
            [
                $paper->title ?? 'Untitled', 
                $authorsStr ?? ($paper->uploader->name ?? 'Unknown'), 
                $paper->publication_year ?? date('Y'), 
                $paper->journal ?? 'Jurnal Default', 
                $paper->abstract ?? 'Tidak ada abstrak.',
                $keywordsStr,
                $intro,
                $methodology,
                $results,
                $conclusion
            ],
            $template
        );

        return Inertia::render('Guest/PaperDetail', [
            'paper' => $paper,
            'isLocked' => $isLocked,
            'price' => $paper->price ?? 0,
            'renderedTemplate' => $renderedTemplate
        ]);
    }
}
