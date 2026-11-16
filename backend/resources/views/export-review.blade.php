<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Review - {{ $paper->title }}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
            --bg-color: #faf8f5;
            --text-main: #1c1917;
            --text-muted: #78716c;
            --border-color: #e8e4dc;
            --accent-rose: #be123c;
            --accent-rose-light: #fff1f2;
            --success-green: #059669;
            --success-green-light: #ecfdf5;
        }

        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.6; 
            color: var(--text-main); 
            background-color: var(--bg-color);
            max-width: 850px; 
            margin: 0 auto; 
            padding: 40px 20px; 
        }
        .paper-container {
            background: white;
            border: 1px solid var(--border-color);
            padding: 50px 60px;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            border-radius: 4px;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid var(--text-main); 
            padding-bottom: 25px; 
            margin-bottom: 35px; 
        }
        .header h1 { 
            font-family: 'Playfair Display', serif;
            margin: 0 0 10px 0; 
            color: var(--text-main); 
            font-size: 28px; 
            font-weight: 700;
            letter-spacing: 0.5px;
        }
        .header p { margin: 0; color: var(--text-muted); font-size: 13px; font-weight: 500; }
        .section { margin-bottom: 35px; }
        .section-title { 
            font-family: 'Playfair Display', serif;
            font-size: 18px; 
            font-weight: 700; 
            border-bottom: 1px solid var(--border-color); 
            padding-bottom: 8px; 
            margin-bottom: 20px; 
            color: var(--accent-rose); 
        }
        .row { display: flex; margin-bottom: 12px; align-items: baseline; }
        .label { font-weight: 600; width: 160px; flex-shrink: 0; color: var(--text-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
        .value { flex-grow: 1; font-size: 15px; font-weight: 500; word-break: break-word; }
        
        .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid transparent; }
        .badge-accept { background: var(--success-green-light); color: var(--success-green); border-color: #d1fae5; }
        .badge-reject { background: var(--accent-rose-light); color: var(--accent-rose); border-color: #ffe4e6; }
        .badge-warning { background: #fffbeb; color: #d97706; border-color: #fef3c7; }
        
        .comments-box { background: var(--bg-color); border: 1px solid var(--border-color); padding: 20px; border-radius: 8px; white-space: pre-wrap; font-size: 14px; color: var(--text-main); line-height: 1.8; }
        .footer { margin-top: 60px; border-top: 1px dashed var(--border-color); padding-top: 20px; text-align: center; font-size: 12px; color: var(--text-muted); }
        .score-box { display: inline-block; background: var(--bg-color); border: 1px solid var(--border-color); padding: 10px 20px; border-radius: 8px; }
        .score { font-size: 28px; font-weight: 700; color: var(--text-main); }
        .score-max { font-size: 14px; color: var(--text-muted); font-weight: 500; }
        
        @media print {
            body { background-color: white; padding: 0; max-width: 100%; }
            .paper-container { border: none; box-shadow: none; padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="text-align: right; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: var(--text-main); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-family: 'Inter', sans-serif;">Cetak / Simpan PDF</button>
    </div>

    <div class="paper-container">
        <div class="header">
            <h1>Laporan Hasil Peer Review</h1>
            <p>Dicetak pada: {{ now()->format('d F Y H:i') }}</p>
        </div>

        <div class="section">
            <div class="section-title">Informasi Paper</div>
            <div class="row">
                <div class="label">Judul Paper</div>
                <div class="value" style="font-weight: 700;">{{ $paper->title }}</div>
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

            <div class="row" style="align-items: center; margin-bottom: 25px;">
                <div class="label">Skor Akhir</div>
                <div class="value">
                    <div class="score-box">
                        <span class="score">{{ $review->score }}</span> <span class="score-max">/ 100</span>
                    </div>
                </div>
            </div>

            <div class="row" style="flex-direction: column;">
                <div class="label" style="margin-bottom: 10px;">Komentar & Catatan Reviewer</div>
                <div class="value" style="width: 100%;">
                    <div class="comments-box">{{ $review->comments ?? 'Tidak ada komentar tambahan.' }}</div>
                </div>
            </div>
            
            <div class="row" style="margin-top: 30px;">
                <div class="label">Direview Oleh</div>
                <div class="value" style="font-weight: 700;">
                    {{ $review->reviewer->name ?? 'Anonim' }} 
                    <br><small style="color: var(--text-muted); font-weight: 500;">(Bidang Keahlian: {{ $review->reviewer->expertise ?? '-' }})</small>
                </div>
            </div>
        </div>
        @else
        <div class="section">
            <p style="color: var(--accent-rose); font-weight: 600;">Paper ini belum direview.</p>
        </div>
        @endif

        <div class="footer">
            Dokumen ini dihasilkan secara otomatis oleh <strong>Sistem AI Research Paper Analyzer</strong>.<br>
            &copy; {{ date('Y') }} All Rights Reserved.
        </div>
    </div>
    
    <script>
        // Optional: Auto print when opened
        // window.onload = function() { window.print(); }
    </script>
</body>
</html>
