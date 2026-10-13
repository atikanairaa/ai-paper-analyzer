<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Paper;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function generateInvoice(Request $request, Paper $paper)
    {
        // Pastikan hanya author yang bisa generate invoice
        if ($paper->uploaded_by !== auth()->id()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($request->has('access_type')) {
            $paper->update(['access_type' => $request->access_type]);
        }

        // Jika sudah ada payment_url, kembalikan yang lama
        if ($paper->payment_url) {
            return response()->json([
                'invoice_number' => $paper->invoice_id,
                'payment_url' => $paper->payment_url
            ]);
        }

        // Tembak API Python
        $pythonUrl = config('services.python.url', 'http://127.0.0.1:8001') . '/api/payment/invoice';
        $token = config('services.python.token');

        try {
            $user = auth()->user();
            
            // Default amount: 500000 (contoh)
            $amount = 500000;

            $response = Http::withToken($token)->post($pythonUrl, [
                'paper_id' => (string) $paper->id,
                'amount' => $amount,
                'customer_name' => $user->name,
                'customer_email' => $user->email,
            ]);

            if ($response->successful()) {
                $data = $response->json('data');
                
                // Simpan ke database
                $paper->update([
                    'access_type' => 'OPEN_ACCESS',
                    'invoice_id' => $data['invoice_number'],
                    'payment_url' => $data['payment_url']
                ]);

                return response()->json([
                    'invoice_number' => $data['invoice_number'],
                    'payment_url' => $data['payment_url']
                ]);
            }

            Log::error('Gagal generate invoice dari Python', ['response' => $response->body()]);
            return response()->json(['error' => 'Gagal terhubung ke layanan pembayaran.'], 500);

        } catch (\Exception $e) {
            Log::error('Error generating invoice: ' . $e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan sistem.'], 500);
        }
    }

    /**
     * Endpoint untuk peneliti/author memverifikasi status pembayaran.
     * Mengonfirmasi pelunasan dan mengirimkan notifikasi ke Admin.
     */
    public function checkPaymentStatus(Request $request, Paper $paper)
    {
        if ($paper->uploaded_by !== auth()->id() && !auth()->user()->hasRole('admin')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Jika sudah PAID sebelumnya
        if ($paper->payment_status === 'PAID') {
            return response()->json([
                'status'  => 'PAID',
                'message' => 'Pembayaran biaya publikasi telah lunas. Naskah telah masuk ke antrean publikasi Admin.',
                'paper'   => $paper,
            ]);
        }

        // Jika paper memiliki tagihan/invoice dan konfirmasi dilakukan
        if ($paper->invoice_id || $paper->payment_url) {
            $paper->update(['payment_status' => 'PAID']);

            // Kirim notifikasi ke Admin bahwa Open Access lunas dan siap diterbitkan
            $admins = \App\Models\User::role('admin')->get();
            if ($admins->isEmpty()) {
                $admins = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->get();
            }
            $researcherName = $paper->uploader->name ?? auth()->user()->name ?? 'Peneliti';
            \Illuminate\Support\Facades\Notification::send(
                $admins,
                new \App\Notifications\PaperReadyToPublishNotification($paper->id, $paper->title, $researcherName, 'OPEN_ACCESS')
            );

            \App\Helpers\AuditLogger::log('Pembayaran Open Access berhasil dikonfirmasi (Peneliti)', $paper->id);

            return response()->json([
                'status'  => 'PAID',
                'message' => 'Pembayaran berhasil dikonfirmasi! Notifikasi telah dikirimkan ke Admin untuk proses penerbitan.',
                'paper'   => $paper,
            ]);
        }

        return response()->json([
            'status'  => $paper->payment_status ?? 'UNPAID',
            'message' => 'Belum ada tagihan aktif untuk paper ini.',
            'paper'   => $paper,
        ]);
    }

    /**
     * Handle Server-to-Server Notification dari DOKU.
     * Endpoint ini dipanggil langsung oleh server DOKU (tidak perlu auth).
     * Keamanan dijaga via validasi HMAC-SHA256 Signature.
     */
    public function handleWebhook(Request $request)
    {
        // -------------------------------------------------------
        // LANGKAH 1: Baca semua header resmi dari DOKU
        // -------------------------------------------------------
        $clientId   = $request->header('Client-Id', '');
        $requestId  = $request->header('Request-Id', '');
        $timestamp  = $request->header('Request-Timestamp', '');
        $signature  = $request->header('Signature', '');
        $targetPath = '/api/payment/doku/webhook'; // path yang diregistrasi

        // -------------------------------------------------------
        // LANGKAH 2: Hitung ulang Signature untuk verifikasi
        // -------------------------------------------------------
        $bodyStr = $request->getContent(); // raw JSON body
        $digest  = 'SHA-256=' . base64_encode(hash('sha256', $bodyStr, true));

        $componentSignature = implode("\n", [
            "Client-Id:{$clientId}",
            "Request-Id:{$requestId}",
            "Request-Timestamp:{$timestamp}",
            "Request-Target:{$targetPath}",
            "Digest:{$digest}",
        ]);

        $secretKey         = config('services.doku.secret_key', '');
        $expectedHmac      = base64_encode(hash_hmac('sha256', $componentSignature, $secretKey, true));
        $expectedSignature = "HMACSHA256={$expectedHmac}";

        // -------------------------------------------------------
        // LANGKAH 3: Tolak request jika Signature tidak cocok
        // -------------------------------------------------------
        if (!hash_equals($expectedSignature, $signature)) {
            Log::warning('DOKU Webhook: Signature tidak valid!', [
                'received'  => $signature,
                'expected'  => $expectedSignature,
                'client_id' => $clientId,
            ]);
            return response()->json(['message' => 'Invalid signature'], 401);
        }

        // -------------------------------------------------------
        // LANGKAH 4: Parse payload & update status pembayaran
        // -------------------------------------------------------
        $payload = $request->json()->all();

        $invoiceNumber     = $payload['order']['invoice_number'] ?? null;
        $transactionStatus = $payload['transaction']['status'] ?? null;

        Log::info('DOKU Webhook diterima', [
            'invoice_number' => $invoiceNumber,
            'status'         => $transactionStatus,
        ]);

        if ($invoiceNumber && strtoupper($transactionStatus) === 'SUCCESS') {
            $paper = Paper::with('uploader')->where('invoice_id', $invoiceNumber)->first();

            if ($paper) {
                $paper->update(['payment_status' => 'PAID']);
                Log::info("Paper #{$paper->id} berhasil ditandai PAID via DOKU Webhook.");

                // Kirim notifikasi ke Admin bahwa Open Access sudah lunas dan siap diterbitkan
                $admins = \App\Models\User::role('admin')->get();
                if ($admins->isEmpty()) {
                    $admins = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->get();
                }
                $researcherName = $paper->uploader->name ?? 'Peneliti';
                \Illuminate\Support\Facades\Notification::send(
                    $admins,
                    new \App\Notifications\PaperReadyToPublishNotification($paper->id, $paper->title, $researcherName, 'OPEN_ACCESS')
                );
            } else {
                $purchase = \App\Models\Purchase::where('invoice_number', $invoiceNumber)->first();
                if ($purchase) {
                    $purchase->update(['payment_status' => 'PAID']);
                    Log::info("Purchase #{$purchase->id} (Invoice: {$invoiceNumber}) berhasil ditandai PAID via DOKU Webhook.");
                    
                    if ($purchase->access_token && $purchase->guest_email) {
                        $accessUrl = route('guest.paper.read', $purchase->paper_id) . '?token=' . $purchase->access_token;
                        // Simulasi kirim email
                        Log::info("MENGIRIM EMAIL KE GUEST: {$purchase->guest_email}. Tautan akses: {$accessUrl}");
                    }
                } else {
                    Log::warning("DOKU Webhook: Invoice '{$invoiceNumber}' tidak ditemukan di database Paper maupun Purchase.");
                }
            }
        }

        // -------------------------------------------------------
        // LANGKAH 5: Selalu kembalikan HTTP 200 kepada DOKU
        // agar DOKU tidak melakukan retry berulang.
        // -------------------------------------------------------
        return response()->json(['message' => 'OK'], 200);
    }

    public function finishCallback(Request $request)
    {
        $invoiceNumber = $request->query('invoiceNumber') ?? $request->query('invoice');
        
        if (!$invoiceNumber) {
            return redirect('/katalog')->with('success', 'Pembayaran berhasil dikonfirmasi.');
        }

        // Cek apakah ini pembayaran Reader (Purchase)
        $purchase = \App\Models\Purchase::where('invoice_number', $invoiceNumber)->first();
        if ($purchase) {
            if ($purchase->payment_status !== 'PAID') {
                $purchase->update(['payment_status' => 'PAID']);
                Log::info("Purchase #{$purchase->id} (Invoice: {$invoiceNumber}) ditandai PAID di finishCallback.");
            }
            $redirectUrl = route('guest.catalog.show', ['id' => $purchase->paper_id]);
            return redirect($redirectUrl)->with('success', 'Pembayaran berhasil dikonfirmasi! Naskah lengkap telah terbuka.');
        }

        // Cek apakah ini pembayaran Author (Paper)
        $paper = \App\Models\Paper::with('uploader')->where('invoice_id', $invoiceNumber)->first();
        if ($paper) {
            if ($paper->payment_status !== 'PAID') {
                $paper->update(['payment_status' => 'PAID']);
                $admins = \App\Models\User::role('admin')->get();
                if ($admins->isEmpty()) {
                    $admins = \App\Models\User::whereHas('roles', fn($q) => $q->where('name', 'admin'))->get();
                }
                $researcherName = $paper->uploader->name ?? 'Peneliti';
                \Illuminate\Support\Facades\Notification::send(
                    $admins,
                    new \App\Notifications\PaperReadyToPublishNotification($paper->id, $paper->title, $researcherName, 'OPEN_ACCESS')
                );
            }
            return redirect()->route('paper.detail.show', ['id' => $paper->id])->with('success', 'Pembayaran APC berhasil dikonfirmasi! Notifikasi telah dikirim ke Admin untuk penerbitan naskah.');
        }

        return redirect('/katalog')->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    public function generateReaderInvoice(Request $request, Paper $paper)
    {
        // 1. Pengguna WAJIB login untuk membeli hak akses paper Closed Access
        if (!auth()->check()) {
            return response()->json([
                'error' => 'Silakan masuk (login) atau daftar akun terlebih dahulu untuk membeli hak akses naskah ini.',
                'require_login' => true,
                'login_url' => route('login', ['redirect' => route('guest.catalog.show', $paper->id)]),
                'register_url' => route('register', ['redirect' => route('guest.catalog.show', $paper->id)]),
            ], 401);
        }

        $user = auth()->user();
        $userId = $user->id;
        $userName = $user->name;
        $userEmail = $user->email;

        // 2. Cek apakah sudah pernah beli dan LUNAS
        $existingPurchase = \App\Models\Purchase::where('paper_id', $paper->id)
            ->where('user_id', $userId)
            ->where('payment_status', 'PAID')
            ->first();

        if ($existingPurchase) {
            return response()->json([
                'message' => 'Anda sudah memiliki akses penuh ke naskah ini.',
                'already_paid' => true,
                'redirect_url' => route('guest.catalog.show', $paper->id)
            ]);
        }

        // 3. Jika ada transaksi menggantung yang UNPAID dengan payment_url
        $pendingPurchase = \App\Models\Purchase::where('paper_id', $paper->id)
            ->where('user_id', $userId)
            ->where('payment_status', 'UNPAID')
            ->whereNotNull('payment_url')
            ->latest()
            ->first();

        if ($pendingPurchase) {
            return response()->json([
                'invoice_number' => $pendingPurchase->invoice_number,
                'payment_url' => $pendingPurchase->payment_url
            ]);
        }

        // 4. Jika belum ada, buat baru
        $amount = ($paper->price && $paper->price > 0) ? (float)$paper->price : 25000;
        $invoiceNumber = 'READ-' . date('YmdHis') . '-U' . $userId . '-' . $paper->id;

        $purchase = \App\Models\Purchase::create([
            'user_id' => $userId,
            'paper_id' => $paper->id,
            'guest_name' => $userName,
            'guest_email' => $userEmail,
            'amount' => $amount,
            'invoice_number' => $invoiceNumber,
            'payment_status' => 'UNPAID',
            'access_token' => null
        ]);

        // Tembak API Python DOKU
        $pythonUrl = config('services.python.url', 'http://127.0.0.1:8001') . '/api/payment/invoice';
        $token = config('services.python.token');

        try {
            $response = Http::withToken($token)->post($pythonUrl, [
                'paper_id' => (string) $paper->id . '-READ',
                'amount' => $amount,
                'customer_name' => $userName,
                'customer_email' => $userEmail,
            ]);

            if ($response->successful()) {
                $data = $response->json('data');
                
                $purchase->update([
                    'invoice_number' => $data['invoice_number'],
                    'payment_url' => $data['payment_url']
                ]);

                return response()->json([
                    'invoice_number' => $data['invoice_number'],
                    'payment_url' => $data['payment_url']
                ]);
            }

            Log::error('Gagal generate invoice pembelian dari Python', ['response' => $response->body()]);
            return response()->json(['error' => 'Gagal terhubung ke layanan pembayaran.'], 500);

        } catch (\Exception $e) {
            Log::error('Error generating reader invoice: ' . $e->getMessage());
            return response()->json(['error' => 'Terjadi kesalahan sistem.'], 500);
        }
    }
}
