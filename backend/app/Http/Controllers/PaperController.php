<?php

namespace App\Http\Controllers;

use App\Models\Paper;
use App\Models\PaperAuthor;
use App\Jobs\ProcessPaperJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class PaperController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        $query = Paper::with('authors')->orderBy('id', 'desc');
        
        if ($userId) {
            $query->where('uploaded_by', $userId);
        }
        
        $papers = $query->get();
        return response()->json($papers);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:pdf|max:20480', // Maks 20MB
            'is_submission' => 'nullable|boolean',
            'access_type' => 'nullable|in:OPEN_ACCESS,CLOSED_ACCESS',
        ]);

        // 1. Simpan file PDF fisik ke storage
        $path = $request->file('file')->store('papers', 'public');

        // 2. Buat data awal paper dengan status PROCESSING
        $paper = Paper::create([
            'uploaded_by'   => auth()->id() ?? 1, // ID user yang login
            'title'         => $request->file('file')->getClientOriginalName(),
            'file_path'     => $path,
            'status'        => 'PROCESSING',
            'is_submission' => $request->boolean('is_submission', false),
        ]);

        // 3. Catat audit log
        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id() ?? 1,
            'action'     => 'UPLOAD_PAPER',
            'paper_id'   => $paper->id,
            'created_at' => now(),
        ]);

        // 4. LEMPAR KE QUEUE (Async Background Job)!
        \App\Jobs\AnalyzePaperJob::dispatch($paper->id);

        // 5. LANGSUNG RESPONS KE FRONTEND (Sesuai Brief Halaman 6!)
        return response()->json([
            'status'   => 'processing',
            'paper_id' => $paper->id,
            'message'  => 'Paper berhasil diunggah dan sedang dianalisis oleh AI.',
        ], 202);
    }

    public function show($id)
    {
        $paper = Paper::with(['authors', 'analyses', 'scores', 'findings'])->findOrFail($id);
        return response()->json($paper);
    }

    public function showWeb($id)
    {
        // Intercept simulated Python DOKU redirect for Readers
        if (str_ends_with($id, '-READ')) {
            $realId = str_replace('-READ', '', $id);
            $latestPurchase = \App\Models\Purchase::where('paper_id', $realId)->latest()->first();
            
            if ($latestPurchase) {
                // Tandai lunas khusus untuk mode simulasi ini
                $latestPurchase->update(['payment_status' => 'PAID']);
                
                $redirectUrl = route('guest.paper.read', ['id' => $realId]);
                if ($latestPurchase->access_token && !$latestPurchase->user_id) {
                    $redirectUrl .= '?token=' . $latestPurchase->access_token;
                }
                return redirect($redirectUrl)->with('success', 'Pembayaran berhasil! Selamat membaca naskah.');
            }
            return redirect('/katalog')->with('success', 'Pembayaran selesai.');
        }

        $paper = Paper::with(['authors', 'analyses', 'scores', 'findings', 'sections', 'references', 'latestJob', 'reviews.reviewer', 'uploader'])->findOrFail($id);
        
        // --- Template Rendering Logic ---
        $defaultTemplate = "<div style=\"font-family: 'Times New Roman', Times, serif; color: #1c1917; line-height: 1.6;\">     <div style=\"display:flex; justify-content:space-between; border-bottom: 2px solid #881337; padding-bottom: 8px; font-size: 11px; color: #881337; margin-bottom: 24px;\">         <span><strong>Transactions on AI &amp; Software Engineering</strong> | e-ISSN: 2985-XXXX</span>         <span>Vol. 1, No. 1 ({article.year}) | pp. 1-10</span>     </div>      <div style=\"text-align:center; margin-bottom: 30px; background-color: #fff1f2; padding: 20px; border-radius: 8px; border: 1px dashed #fda4af;\">         <h4 style=\"margin: 0 0 5px 0; color: #881337; font-size: 18px; font-weight: 800; letter-spacing: 2px;\">? AI RESEARCH PAPER PUBLISHING ?</h4>         <p style=\"margin: 0; font-size: 11px; color: #9f1239; letter-spacing: 1px; text-transform: uppercase; font-weight: bold;\">International Journal of Computational Intelligence &amp; Software</p>     </div>      <h1 style=\"text-align:center; font-size: 22px; color: #881337; margin-bottom: 15px; font-weight: 900; line-height: 1.3;\">         {article.title}     </h1>      <p style=\"text-align:center; font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #1c1917;\">         {article.author}     </p>     <p style=\"text-align:center; font-size: 11px; color: #57534e; margin-bottom: 4px; font-style: italic;\">         1 Department of Computer Science, Faculty of Engineering, University Name, City, Country     </p>     <p style=\"text-align:center; font-size: 11px; color: #e11d48; font-style: italic; margin-bottom: 25px;\">         * Penulis Korespondensi: <u>{article.correspondence_email}</u>     </p>      <figure class=\"table\">         <table style=\"width:100%; border: 1px solid #9f1239; border-collapse: collapse;\">             <tbody>                 <tr style=\"background-color: #fff1f2;\">                     <td style=\"width:15%; font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Received:</td>                     <td style=\"width:35%; color: #57534e; border: 1px solid #fda4af; padding: 8px;\">{article.received_date}</td>                     <td style=\"width:15%; font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Revised:</td>                     <td style=\"width:35%; color: #57534e; border: 1px solid #fda4af; padding: 8px;\">{article.revised_date}</td>                 </tr>                 <tr style=\"background-color: #fff1f2;\">                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Accepted:</td>                     <td style=\"color: #57534e; border: 1px solid #fda4af; padding: 8px;\">{article.accepted_date}</td>                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px;\">Published:</td>                     <td style=\"color: #57534e; border: 1px solid #fda4af; padding: 8px;\">{article.published_date}</td>                 </tr>                 <tr>                     <td style=\"font-weight:bold; color: #881337; border: 1px solid #fda4af; padding: 8px; background-color: #fff1f2;\">How to cite:</td>                     <td colspan=\"3\" style=\"border: 1px solid #fda4af; padding: 8px; font-size: 10px; color: #57534e;\">                         [Diisi oleh Editor] {article.author}. (2026). {article.title}. Transactions on AI &amp; Software Engineering, 1(1), 1-10.                     </td>                 </tr>             </tbody>         </table>     </figure>      <div style=\"border: 2px solid #881337; background-color: #fff1f2; padding: 20px; margin: 30px 0; border-radius: 8px;\">         <p style=\"margin: 0 0 10px 0; font-size: 14px; font-weight: 900; color: #881337; text-align: center; text-transform: uppercase;\">             ABSTRAK / ABSTRACT         </p>         <p style=\"margin: 0 0 15px 0; font-size: 11px; text-align: justify; color: #1c1917;\">             {article.abstract}         </p>         <p style=\"margin: 0; font-size: 11px; color: #1c1917;\">             <strong style=\"color: #881337;\">Keywords:</strong> {article.keywords}         </p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">1. Introduction</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.introduction}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">2. Methods</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.methodology}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">3. Results and Discussion</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.results}</p>     </div>      <div style=\"margin-bottom: 20px;\">         <h3 style=\"font-size: 14px; font-weight: bold; color: #881337; border-bottom: 1px solid #fda4af; padding-bottom: 4px; margin-bottom: 10px;\">4. Conclusion</h3>         <p style=\"font-size: 11px; text-align: justify; margin: 0;\">{article.conclusion}</p>     </div> </div>";
        $template = \Illuminate\Support\Facades\Storage::exists('journal_template.html') 
            ? \Illuminate\Support\Facades\Storage::get('journal_template.html') 
            : $defaultTemplate;

        // Render template variables
        $authorsStr = $paper->authors->pluck('name')->implode(', ');
        if (empty($authorsStr)) {
            $authorsStr = $paper->uploader->name ?? 'Unknown';
        }

        // Keywords Extraction
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

        // Sections Extraction
        $cleanSectionContent = function(?string $text): string {
            if (empty($text)) {
                return '<i>Bagian ini belum diekstrak oleh AI.</i>';
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
        };

        $formatSectionParagraphs = function(?string $text) use ($cleanSectionContent): string {
            $cleaned = $cleanSectionContent($text);
            if (empty($cleaned) || $cleaned === '<i>Bagian ini belum diekstrak oleh AI.</i>') {
                return '<p style="text-align: justify; margin-bottom: 12px;"><i>Bagian ini belum diekstrak oleh AI.</i></p>';
            }
            if (strpos($cleaned, '<p>') !== false || strpos($cleaned, '<p ') !== false) {
                return $cleaned;
            }
            $rawBlocks = preg_split('/(\r?\n){2,}/', trim($cleaned));
            $paragraphs = [];
            foreach ($rawBlocks as $block) {
                $block = trim($block);
                if (empty($block)) continue;
                if (mb_strlen($block) <= 1000) {
                    $paragraphs[] = $block;
                    continue;
                }
                $sentences = preg_split('/(?<=[.?!])\s+(?=[A-Z0-9"“\(])/u', $block);
                $currentPara = '';
                foreach ($sentences as $sentence) {
                    $sentence = trim($sentence);
                    if (empty($sentence)) continue;
                    $currentPara = empty($currentPara) ? $sentence : $currentPara . ' ' . $sentence;
                    if (mb_strlen($currentPara) >= 850) {
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
            $output = '';
            foreach ($paragraphs as $para) {
                $para = trim($para);
                if (!empty($para)) {
                    $output .= "<p style=\"text-align: justify; text-indent: 28px; margin-bottom: 12px; line-height: 1.6;\">" . $para . "</p>";
                }
            }
            return $output ?: "<p style=\"text-align: justify; margin-bottom: 12px;\">{$cleaned}</p>";
        };

        $sections = $paper->sections ?? collect();
        $getSection = function($name) use ($sections, $formatSectionParagraphs) {
            $sec = $sections->where('section_name', $name)->first();
            return $sec ? $formatSectionParagraphs($sec->summary) : '<p style="text-align: justify; margin-bottom: 12px;"><i>Bagian ini belum diekstrak oleh AI.</i></p>';
        };

        // Prioritaskan teks lengkap 'Introduction', jika belum ada fallback ke 'Research Problem'
        $introSec = $sections->where('section_name', 'Introduction')->first();
        if ($introSec && !empty(trim($introSec->summary))) {
            $intro = $formatSectionParagraphs($introSec->summary);
        } else {
            $intro = $getSection('Research Problem');
        }

        $methodology = $getSection('Methodology');
        $results = $getSection('Results');
        $conclusion = $getSection('Conclusion');

        // 1. Email Penulis Korespondensi (Email peneliti)
        $correspondenceEmail = $paper->uploader->email ?? '-';

        // 2. Received: Tanggal peneliti submit ke system
        $receivedDateRaw = \Illuminate\Support\Facades\DB::table('audit_logs')
            ->where('paper_id', $paper->id)
            ->where('action', 'SUBMIT_TO_JOURNAL')
            ->oldest('created_at')
            ->value('created_at');
        if (!$receivedDateRaw) {
            $receivedDateRaw = $paper->created_at;
        }
        $receivedDate = $receivedDateRaw
            ? \Carbon\Carbon::parse($receivedDateRaw)->locale('id')->translatedFormat('d F Y')
            : '-';

        // 3. Revised: Di-strip jika tidak ada tercatat revisi
        $revisedDateRaw = \Illuminate\Support\Facades\DB::table('audit_logs')
            ->where('paper_id', $paper->id)
            ->where('action', 'SUBMIT_REVISION')
            ->latest('created_at')
            ->value('created_at');
        $revisedDate = $revisedDateRaw
            ? \Carbon\Carbon::parse($revisedDateRaw)->locale('id')->translatedFormat('d F Y')
            : '-';

        // 4. Accepted: Pas di-acc reviewer
        $acceptedReview = \App\Models\Review::where('paper_id', $paper->id)
            ->whereIn('recommendation', ['ACCEPT', 'ACCEPTED'])
            ->latest('updated_at')
            ->first();
        $acceptedDateRaw = $acceptedReview ? ($acceptedReview->updated_at ?? $acceptedReview->created_at) : null;
        if (!$acceptedDateRaw && in_array($paper->submission_status, ['ACCEPTED', 'ACCEPT', 'PUBLISHED'])) {
            $acceptedDateRaw = $paper->updated_at;
        }
        $acceptedDate = $acceptedDateRaw
            ? \Carbon\Carbon::parse($acceptedDateRaw)->locale('id')->translatedFormat('d F Y')
            : '-';

        // 5. Published: Tanggal admin publish paper
        $publishedDate = '-';
        if ($paper->submission_status === 'PUBLISHED') {
            $publishDateRaw = \Illuminate\Support\Facades\DB::table('audit_logs')
                ->where('paper_id', $paper->id)
                ->where(function ($q) {
                    $q->where('action', 'like', '%diterbitkan%')
                      ->orWhere('action', 'like', '%PUBLISH%');
                })
                ->latest('created_at')
                ->value('created_at');
            $publishDateRaw = $publishDateRaw ?: $paper->updated_at;
            $publishedDate = $publishDateRaw
                ? \Carbon\Carbon::parse($publishDateRaw)->locale('id')->translatedFormat('d F Y')
                : '-';
        }

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
                '{article.conclusion}',
                '{article.correspondence_email}',
                '{article.author_email}',
                '{article.received_date}',
                '{article.revised_date}',
                '{article.accepted_date}',
                '{article.published_date}',
                'email@university.ac.id'
            ],
            [
                $paper->title ?? 'Untitled', 
                $authorsStr, 
                $paper->publication_year ?? date('Y'), 
                $paper->journal ?? 'Jurnal Default', 
                $paper->abstract ?? 'Tidak ada abstrak.',
                $keywordsStr,
                $intro,
                $methodology,
                $results,
                $conclusion,
                $correspondenceEmail,
                $correspondenceEmail,
                $receivedDate,
                $revisedDate,
                $acceptedDate,
                $publishedDate,
                $correspondenceEmail
            ],
            $template
        );

        // Fallback jika template masih menyimpan format teks statis [Diisi oleh Editor]
        $renderedTemplate = preg_replace('/(Received:.*?<td[^>]*>)\s*\[Diisi oleh Editor\]/isu', '${1}' . $receivedDate, $renderedTemplate);
        $renderedTemplate = preg_replace('/(Revised:.*?<td[^>]*>)\s*\[Diisi oleh Editor\]/isu', '${1}' . $revisedDate, $renderedTemplate);
        $renderedTemplate = preg_replace('/(Accepted:.*?<td[^>]*>)\s*\[Diisi oleh Editor\]/isu', '${1}' . $acceptedDate, $renderedTemplate);
        $renderedTemplate = preg_replace('/(Published:.*?<td[^>]*>)\s*\[Diisi oleh Editor\]/isu', '${1}' . $publishedDate, $renderedTemplate);
        // --------------------------------

        return \Inertia\Inertia::render('PaperDetail', [
            'paper' => $paper,
            'renderedTemplate' => $renderedTemplate
        ]);
    }
    public function exportReview($id)
    {
        $paper = Paper::findOrFail($id);
        $review = \App\Models\Review::with('reviewer')->where('paper_id', $id)->first();
        return view('export-review', compact('paper', 'review'));
    }

    public function update(Request $request, $id)
    {
        $paper = Paper::findOrFail($id);
        
        $request->validate([
            'title' => 'sometimes|string|max:255',
            'authors' => 'sometimes|array',
            'authors.*.name' => 'required_with:authors|string'
        ]);

        if ($request->has('title')) {
            $paper->update(['title' => $request->title]);
        }

        if ($request->has('authors')) {
            // Delete old authors and insert new ones
            $paper->authors()->delete();
            foreach ($request->authors as $author) {
                $paper->authors()->create(['name' => $author['name']]);
            }
        }

        return response()->json($paper->load('authors'));
    }

    public function destroy($id)
    {
        $paper = Paper::findOrFail($id);
        
        if (Storage::exists($paper->file_path)) {
            Storage::delete($paper->file_path);
        }
        
        \App\Helpers\AuditLogger::log('Delete paper', $paper->id);
        
        $paper->delete();

        return response()->json(['message' => 'Paper deleted']);
    }

    public function qa(Request $request, $id)
    {
        $request->validate([
            'question' => 'required|string',
        ]);

        $paper = Paper::findOrFail($id);
        $filePath = \Illuminate\Support\Facades\Storage::disk('public')->path($paper->file_path);
        
        $fastApiUrl = config('services.fastapi.url');
        $token = config('services.fastapi.token');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(180)
                ->withToken($token)
                ->attach('file', file_get_contents($filePath), basename($filePath))
                ->post("{$fastApiUrl}/api/v1/qa", [
                    'paper_id' => $paper->id,
                    'question' => $request->question,
                    'request_id' => (string) \Illuminate\Support\Str::uuid(),
                ]);

            if ($response->failed()) {
                return response()->json(['error' => 'Gagal menghubungi AI Server'], 500);
            }

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'QA_ANALYSIS',
                'paper_id' => $paper->id,
                'created_at' => now(),
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function submitToJournal($id)
    {
        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);
        
        if ($paper->status !== 'ANALYZED' || !$paper->is_submission) {
            return response()->json(['error' => 'Paper tidak memenuhi syarat untuk disubmit.'], 400);
        }

        $paper->update(['submission_status' => 'SUBMITTED']);

        \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
            'user_id' => auth()->id(),
            'action' => 'SUBMIT_TO_JOURNAL',
            'paper_id' => $paper->id,
            'created_at' => now(),
        ]);

        $admins = \App\Models\User::role('admin')->get();
        \Illuminate\Support\Facades\Notification::send($admins, new \App\Notifications\JournalSubmittedNotification($paper->id, $paper->title, auth()->user()->name));

        return response()->json(['message' => 'Paper berhasil disubmit ke Jurnal', 'paper' => $paper]);
    }

    public function withdrawSubmission($id)
    {
        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);
        
        if ($paper->submission_status !== 'DRAFT') {
            return response()->json(['error' => 'Hanya paper DRAFT yang dapat ditarik.'], 400);
        }

        $paper->update([
            'is_submission' => false,
            'submission_status' => 'DRAFT'
        ]);

        \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
            'user_id' => auth()->id(),
            'action' => 'WITHDRAW_SUBMISSION',
            'paper_id' => $paper->id,
            'created_at' => now(),
        ]);

        return response()->json(['message' => 'Paper berhasil ditarik untuk studi mandiri', 'paper' => $paper]);
    }

    public function compareView()
    {
        $papers = Paper::where('uploaded_by', auth()->id())
            ->where('status', 'ANALYZED')
            ->orderBy('id', 'desc')
            ->get();
            
        return \Inertia\Inertia::render('Compare', [
            'papers' => $papers
        ]);
    }

    public function compareProcess(Request $request)
    {
        $request->validate([
            'file_a' => 'required|file|mimes:pdf|max:10240',
            'file_b' => 'required|file|mimes:pdf|max:10240'
        ]);

        $fileA = $request->file('file_a');
        $fileB = $request->file('file_b');

        $fastApiUrl = config('services.fastapi.url');
        $token = config('services.fastapi.token');

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(300)
                ->withToken($token)
                ->attach('file_a', file_get_contents($fileA->getRealPath()), $fileA->getClientOriginalName())
                ->attach('file_b', file_get_contents($fileB->getRealPath()), $fileB->getClientOriginalName())
                ->post("{$fastApiUrl}/api/v1/compare", [
                    'paper_a_title' => $fileA->getClientOriginalName(),
                    'paper_b_title' => $fileB->getClientOriginalName()
                ]);

            if ($response->failed()) {
                \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                    'user_id' => auth()->id() ?? 1,
                    'action' => 'COMPARE_FAILED',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                return response()->json(['error' => 'Gagal menghubungi AI Server untuk membandingkan paper', 'details' => $response->body()], 500);
            }

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'COMPARE_PAPERS',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json($response->json());
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id() ?? 1,
                'action' => 'COMPARE_FAILED',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function submitRevision(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf|max:10240'
        ]);

        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Hapus file lama
            if (\Illuminate\Support\Facades\Storage::exists($paper->file_path)) {
                \Illuminate\Support\Facades\Storage::delete($paper->file_path);
            }

            $path = $file->store('papers', 'public');
            
            $paper->update([
                'file_path' => $path,
                'status' => 'PROCESSING',
                'submission_status' => 'IN_REVIEW' // Kembalikan statusnya ke review
            ]);

            \Illuminate\Support\Facades\DB::table('audit_logs')->insert([
                'user_id' => auth()->id(),
                'action' => 'SUBMIT_REVISION',
                'paper_id' => $paper->id,
                'created_at' => now(),
            ]);

            // Bersihkan analisis lama
            $paper->aiJobs()->delete();
            $paper->analyses()->delete();
            $paper->findings()->delete();

            // Jalankan ulang AI
            dispatch(new \App\Jobs\AnalyzePaperJob($paper->id));

            // Notifikasi ulang ke Reviewer lama
            $reviews = \Illuminate\Support\Facades\DB::table('reviews')
                        ->where('paper_id', $paper->id)
                        ->get();
            
            foreach ($reviews as $review) {
                $reviewer = \App\Models\User::find($review->reviewer_id);
                if ($reviewer) {
                    $reviewer->notify(new \App\Notifications\PaperAssignedNotification($paper->id, $paper->title . " (Revisi)"));
                    try {
                        \Illuminate\Support\Facades\Mail::to($reviewer->email)->send(
                            new \App\Mail\ReviewerInvitationMail($paper, $reviewer->name, $reviewer->email)
                        );
                    } catch (\Exception $e) {
                        \Illuminate\Support\Facades\Log::error('Gagal mengirim email undangan revisi: ' . $e->getMessage());
                    }
                }
            }

            return response()->json(['message' => 'File revisi berhasil diunggah, paper sedang dianalisis ulang dan ditugaskan kembali.']);
        }
        
        return response()->json(['message' => 'Gagal mengunggah file revisi.'], 400);
    }

    public function viewWatermarkedPdf($id)
    {
        $paper = Paper::findOrFail($id);
        
        $paths = [
            storage_path('app/private/' . $paper->file_path),
            storage_path('app/public/' . $paper->file_path),
            storage_path('app/' . $paper->file_path),
            public_path('storage/' . $paper->file_path),
            public_path($paper->file_path),
        ];
        
        $pdfPath = null;
        foreach ($paths as $path) {
            if (file_exists($path)) {
                $pdfPath = $path;
                break;
            }
        }
        
        if (!$pdfPath || empty($paper->file_path)) {
            return $this->viewPdf($id); // Fallback ke tampilan seeder
        }
        
        $fastApiUrl = config('services.fastapi.url', 'http://127.0.0.1:8001');
        $token = config('services.fastapi.token');
        
        try {
            $response = \Illuminate\Support\Facades\Http::withToken($token)
                ->attach('file', file_get_contents($pdfPath), basename($pdfPath))
                ->post("{$fastApiUrl}/api/v1/pdf/watermark", [
                    'watermark_text' => 'CONFIDENTIAL'
                ]);
                
            if ($response->successful()) {
                return response($response->body(), 200, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="watermarked_' . basename($pdfPath) . '"'
                ]);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Gagal watermark PDF: " . $e->getMessage());
        }
        
        // Fallback jika gagal watermark
        return response()->file($pdfPath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . basename($pdfPath) . '"'
        ]);
    }

    public function viewPdf($id)
    {
        $paper = Paper::findOrFail($id);

        $filePath = $paper->file_path;

        // Bersihkan prefix jika tersimpan 'storage/' atau 'public/' di database
        $cleanPath = ltrim(preg_replace('#^(public/|storage/)#', '', $filePath), '/');

        $candidatePaths = [
            // Storage public disk
            Storage::disk('public')->path($cleanPath),
            storage_path('app/public/' . $cleanPath),
            // Storage local/private disk (Laravel 11 default)
            storage_path('app/private/' . $cleanPath),
            storage_path('app/' . $cleanPath),
            Storage::disk('local')->path($cleanPath),
            // Public path langsung
            public_path('storage/' . $cleanPath),
            public_path($cleanPath),
        ];

        foreach ($candidatePaths as $path) {
            if (file_exists($path) && is_file($path)) {
                return response()->file($path, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="' . basename($path) . '"'
                ]);
            }
        }
        
        return response("
          <html><body style='margin:0;display:flex;height:100vh;align-items:center;justify-content:center;font-family:sans-serif;background:#faf8f5;color:#78716c;text-align:center;padding:24px;'>
            <div style='max-width:420px;background:white;padding:32px;border-radius:16px;border:1px solid #e8e4dc;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);'>
              <div style='font-size:36px;margin-bottom:12px;'>ðŸ“„</div>
              <h3 style='color:#1c1917;margin:0 0 8px 0;font-size:18px;font-weight:700;'>Pratinjau PDF Belum Tersedia</h3>
              <p style='font-size:13px;line-height:1.6;margin:0;color:#57534e;'>Paper ini merupakan data contoh dari seeder sehingga file dokumen .pdf aslinya belum tersimpan di disk lokal Anda.<br><br>Untuk melihat dokumen PDF asli di penampil ini, silakan unggah file paper baru melalui menu <b>Unggah Paper</b>.</p>
            </div>
          </body></html>
        ", 200, ['Content-Type' => 'text/html']);
    }

    /**
     * Peneliti menentukan jenis akses publikasi (OPEN_ACCESS atau CLOSED_ACCESS).
     */
    public function chooseAccess(Request $request, Paper $paper)
    {
        if ($paper->uploaded_by !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'access_type' => 'required|in:OPEN_ACCESS,CLOSED_ACCESS',
        ]);

        $paper->update([
            'access_type' => $request->access_type,
        ]);

        // Jika Peneliti memilih CLOSED_ACCESS:
        // Kirim notifikasi ke Admin bahwa paper sudah siap diterbitkan!
        if ($request->access_type === 'CLOSED_ACCESS') {
            $admins = \App\Models\User::role('admin')->get();
            if ($admins->isEmpty()) {
                $admins = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->get();
            }
            $researcherName = auth()->user()->name ?? 'Peneliti';
            \Illuminate\Support\Facades\Notification::send(
                $admins,
                new \App\Notifications\PaperReadyToPublishNotification($paper->id, $paper->title, $researcherName, 'CLOSED_ACCESS')
            );

            \App\Helpers\AuditLogger::log('Peneliti mengonfirmasi Closed Access (Menunggu penerbitan Admin)', $paper->id);

            return response()->json([
                'message' => 'Pilihan Closed Access berhasil dikonfirmasi. Notifikasi telah dikirim ke Admin untuk proses penerbitan.',
                'paper'   => $paper,
            ]);
        }

        \App\Helpers\AuditLogger::log('Peneliti memilih Open Access', $paper->id);

        return response()->json([
            'message' => 'Pilihan Open Access berhasil disimpan. Silakan lanjutkan pembayaran publikasi.',
            'paper'   => $paper,
        ]);
    }

    /**
     * Terbitkan paper ke katalog jurnal.
     * HANYA BISA DILAKUKAN OLEH ADMIN!
     * Syarat: submission_status = ACCEPTED dan (access_type = CLOSED_ACCESS atau payment_status = PAID).
     */
    public function publishPaper(Request $request, Paper $paper)
    {
        // 1. Otorisasi ketat: Hanya Admin yang berwenang menerbitkan paper
        if (!auth()->user()->hasRole('admin')) {
            return response()->json(['error' => 'Akses ditolak. Hanya Admin yang memiliki wewenang untuk menerbitkan naskah jurnal.'], 403);
        }

        // 2. Validasi status paper
        if ($paper->submission_status !== 'ACCEPTED' && $paper->submission_status !== 'ACCEPT') {
            return response()->json(['error' => 'Paper belum diterima (ACCEPTED) oleh reviewer.'], 422);
        }

        // 3. Validasi administrasi pembayaran jika Open Access
        if ($paper->access_type === 'OPEN_ACCESS' && ($paper->payment_status ?? 'UNPAID') !== 'PAID') {
            return response()->json(['error' => 'Paper berstatus Open Access belum diselesaikan pembayarannya oleh peneliti.'], 422);
        }

        // 4. Terbitkan paper dan set tahun terbit jurnal (tahun saat ini)
        $paper->update([
            'submission_status' => 'PUBLISHED',
            'publication_year'  => (int)date('Y'),
        ]);

        \App\Helpers\AuditLogger::log('Paper diterbitkan ke katalog oleh Admin', $paper->id);

        // 5. Kirim notifikasi ke Peneliti
        if ($paper->uploader) {
            $paper->uploader->notify(new \App\Notifications\PaperPublishedNotification($paper->id, $paper->title));
        }

        return response()->json(['message' => 'Paper berhasil dipublikasikan ke katalog jurnal!', 'paper' => $paper]);
    }

    /**
     * Re-analyze paper dengan kriteria prompt AI terbaru.
     */
    public function reanalyze($id)
    {
        $paper = Paper::where('uploaded_by', auth()->id())->findOrFail($id);

        if ($paper->status === 'PROCESSING') {
            return response()->json(['message' => 'Paper sedang dalam proses analisis.'], 422);
        }

        // Update status paper menjadi PROCESSING
        $paper->update(['status' => 'PROCESSING']);

        // Catat Audit Log
        DB::table('audit_logs')->insert([
            'user_id'    => auth()->id(),
            'action'     => 'REANALYZE_PAPER',
            'paper_id'   => $paper->id,
            'created_at' => now(),
        ]);

        // Hapus cache PDF yang pernah di-generate sebelumnya agar diperbarui
        $cacheFile = storage_path('app/generated_papers/paper_' . $paper->id . '.pdf');
        if (file_exists($cacheFile)) {
            @unlink($cacheFile);
        }

        // Dispatch background job AI
        \App\Jobs\AnalyzePaperJob::dispatch($paper->id);

        return response()->json([
            'status'   => 'processing',
            'paper_id' => $paper->id,
            'message'  => 'Analisis ulang berhasil dimulai dengan kriteria AI terbaru.',
        ]);
    }
}

