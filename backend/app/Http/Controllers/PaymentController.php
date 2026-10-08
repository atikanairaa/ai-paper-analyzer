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
            $paper = Paper::where('invoice_id', $invoiceNumber)->first();

            if ($paper) {
                $paper->update(['payment_status' => 'PAID']);
                Log::info("Paper #{$paper->id} berhasil ditandai PAID via DOKU Webhook.");
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
            $redirectUrl = route('guest.paper.read', ['id' => $purchase->paper_id]);
            if ($purchase->access_token && !$purchase->user_id) {
                $redirectUrl .= '?token=' . $purchase->access_token;
            }
            return redirect($redirectUrl)->with('success', 'Pembayaran berhasil! Selamat membaca naskah.');
        }

        // Cek apakah ini pembayaran Author (Paper)
        $paper = \App\Models\Paper::where('invoice_id', $invoiceNumber)->first();
        if ($paper) {
            return redirect()->route('paper.detail.show', ['id' => $paper->id])->with('success', 'Pembayaran APC berhasil!');
        }

        return redirect('/katalog')->with('success', 'Pembayaran berhasil dikonfirmasi.');
    }

    public function generateReaderInvoice(Request $request, Paper $paper)
    {
        // 1. Tangkap input dari user/guest
        $guestName = $request->input('guest_name');
        $guestEmail = $request->input('guest_email');
        
        $userId = null;
        $userName = $guestName;
        $userEmail = $guestEmail;

        if (auth()->check()) {
            $user = auth()->user();
            $userId = $user->id;
            $userName = $user->name;
            $userEmail = $user->email;
        }

        // Jika tidak login, pastikan nama dan email diisi
        if (!$userId && (!$userName || !$userEmail)) {
            return response()->json(['error' => 'Nama dan Email wajib diisi untuk Guest Checkout.'], 400);
        }

        // Cek apakah sudah pernah beli dan LUNAS (berdasarkan ID user atau Email guest)
        $query = \App\Models\Purchase::where('paper_id', $paper->id);
        if ($userId) {
            $query->where('user_id', $userId);
        } else {
            $query->where('guest_email', $userEmail);
        }
        $existingPurchase = $query->first();

        if ($existingPurchase && $existingPurchase->payment_status === 'PAID') {
            $redirectUrl = route('guest.paper.read', $paper->id);
            if (!$userId && $existingPurchase->access_token) {
                $redirectUrl .= '?token=' . $existingPurchase->access_token;
            }
            return response()->json([
                'message' => 'Anda sudah membeli naskah ini.',
                'already_paid' => true,
                'redirect_url' => $redirectUrl
            ]);
        }

        // Jika ada transaksi menggantung, berikan ulang
        if ($existingPurchase && $existingPurchase->payment_status === 'UNPAID' && $existingPurchase->payment_url) {
            return response()->json([
                'invoice_number' => $existingPurchase->invoice_number,
                'payment_url' => $existingPurchase->payment_url
            ]);
        }

        // Jika belum ada record sama sekali, buat baru
        $amount = $paper->price && $paper->price > 0 ? (float)$paper->price : 50000;
        
        $identifier = $userId ? "U{$userId}" : "G" . substr(md5($userEmail), 0, 6);
        $invoiceNumber = 'READ-' . date('YmdHis') . '-' . $identifier . '-' . $paper->id;
        $accessToken = $userId ? null : bin2hex(random_bytes(16)); // Token untuk guest

        $purchase = \App\Models\Purchase::create([
            'user_id' => $userId,
            'paper_id' => $paper->id,
            'guest_name' => $userId ? null : $userName,
            'guest_email' => $userId ? null : $userEmail,
            'amount' => $amount,
            'invoice_number' => $invoiceNumber,
            'payment_status' => 'UNPAID',
            'access_token' => $accessToken
        ]);

        // Tembak API Python DOKU
        $pythonUrl = config('services.python.url', 'http://127.0.0.1:8001') . '/api/payment/invoice';
        $token = config('services.python.token');

        try {
            $response = Http::withToken($token)->post($pythonUrl, [
                'paper_id' => (string) $paper->id . '-READ', // pembeda
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
