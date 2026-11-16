<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Undangan Reviewer</title>
</head>
<body style="font-family: sans-serif; color: #333; line-height: 1.6;">
    <div style="max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #be123c;">Undangan Peer Review</h2>
        <p>Yth. <strong>{{ $reviewerName }}</strong>,</p>
        <p>Anda diundang oleh Dewan Redaksi untuk mereview naskah berikut:</p>
        
        <div style="background-color: #f5f5f4; padding: 15px; border-left: 4px solid #be123c; margin: 20px 0;">
            <p style="margin: 0;"><strong>Judul:</strong> {{ $paper->title }}</p>
        </div>

        <p>Anda dapat mengakses dan membaca dokumen tersebut secara langsung dengan mengklik tautan (Magic Link) di bawah ini tanpa perlu memasukkan kata sandi.</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ $magicLink }}" style="background-color: #be123c; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Akses Paper Sekarang</a>
        </div>

        <p style="font-size: 0.9em; color: #666;">
            <em>Tautan ini bersifat rahasia, tertaut dengan email Anda, dan akan kedaluwarsa dalam 7 hari.</em><br>
            Jika tombol tidak berfungsi, salin dan tempel URL berikut di peramban Anda:<br>
            <span style="color: #0284c7; word-break: break-all;">{{ $magicLink }}</span>
        </p>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.85em; color: #999;">
            Salam hormat,<br>
            <strong>Tim AI Paper Analyzer</strong>
        </p>
    </div>
</body>
</html>
