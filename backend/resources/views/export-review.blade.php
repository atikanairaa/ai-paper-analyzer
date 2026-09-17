<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Review - {{ $paper->title }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0 0 10px 0; color: #2c3e50; font-size: 24px; }
        .header p { margin: 0; color: #7f8c8d; font-size: 14px; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 16px; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; color: #2980b9; text-transform: uppercase; }
        .row { display: flex; margin-bottom: 10px; }
        .label { font-weight: bold; width: 180px; flex-shrink: 0; color: #34495e; }
        .value { flex-grow: 1; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .badge-accept { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .badge-reject { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .badge-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
        .comments-box { background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 5px; white-space: pre-wrap; font-size: 14px; }
        .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; text-align: right; font-size: 12px; color: #95a5a6; }
        .score { font-size: 24px; font-weight: bold; color: #27ae60; }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: right; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #2980b9; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Cetak PDF</button>
    </div>

    <div class="header">
        <h1>HASIL REVIEW JURNAL</h1>
        <p>Dicetak pada: {{ now()->format('d F Y H:i') }}</p>
    </div>

    <div class="section">
        <div class="section-title">Informasi Paper</div>
        <div class="row">
            <div class="label">Judul Paper</div>
            <div class="value">{{ $paper->title }}</div>
        </div>
        <div class="row">
            <div class="label">Jurnal Tujuan</div>
            <div class="value">{{ $paper->journal ?? '-' }}</div>
        </div>
        <div class="row">
            <div class="label">Tanggal Submit</div>
            <div class="value">{{ $paper->created_at->format('d F Y') }}</div>
        </div>
    </div>

    @if($review)
    <div class="section">
        <div class="section-title">Hasil Keputusan Reviewer</div>
        
        <div class="row" style="align-items: center; margin-bottom: 20px;">
            <div class="label">Status Kelayakan</div>
            <div class="value">
                @php
                    $badgeClass = 'badge-warning';
                    if ($review->recommendation === 'ACCEPT') $badgeClass = 'badge-accept';
                    if ($review->recommendation === 'REJECT') $badgeClass = 'badge-reject';
                @endphp
                <span class="badge {{ $badgeClass }}">{{ str_replace('_', ' ', $review->recommendation) }}</span>
            </div>
        </div>

        <div class="row" style="align-items: center; margin-bottom: 20px;">
            <div class="label">Skor Akhir</div>
            <div class="value">
                <span class="score">{{ $review->score }}</span> <span style="color: #7f8c8d;">/ 100</span>
            </div>
        </div>

        <div class="row">
            <div class="label">Komentar & Catatan</div>
            <div class="value">
                <div class="comments-box">{{ $review->comments ?? 'Tidak ada komentar tambahan.' }}</div>
            </div>
        </div>
        
        <div class="row" style="margin-top: 20px;">
            <div class="label">Direview Oleh</div>
            <div class="value">{{ $review->reviewer->name ?? 'Anonim' }} <br><small style="color: #7f8c8d;">(Bidang: {{ $review->reviewer->expertise ?? '-' }})</small></div>
        </div>
    </div>
    @else
    <div class="section">
        <p style="color: #e74c3c;">Paper ini belum direview.</p>
    </div>
    @endif

    <div class="footer">
        Dokumen ini dihasilkan secara otomatis oleh Sistem AI Research Paper Analyzer.<br>
        &copy; {{ date('Y') }} All Rights Reserved.
    </div>
    
    <script>
        // Optional: Auto print when opened
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
