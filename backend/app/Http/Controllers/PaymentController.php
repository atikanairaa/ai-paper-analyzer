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
        $pythonUrl = env('PYTHON_API_URL', 'http://127.0.0.1:8001') . '/api/payment/invoice';
        $token = env('INTERNAL_SERVICE_TOKEN');

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

        $secretKey         = env('DOKU_SECRET_KEY', '');
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
                Log::warning("DOKU Webhook: Invoice '{$invoiceNumber}' tidak ditemukan di database.");
            }
        }

        // -------------------------------------------------------
        // LANGKAH 5: Selalu kembalikan HTTP 200 kepada DOKU
        // agar DOKU tidak melakukan retry berulang.
        // -------------------------------------------------------
        return response()->json(['message' => 'OK'], 200);
    }
}
