# AI Paper Analyzer

AI Paper Analyzer adalah sebuah sistem aplikasi berbasis web yang membantu peneliti (*researcher*), dewan redaksi jurnal (*admin*), dan *reviewer* dalam mengelola, menganalisis, serta menelaah karya tulis ilmiah (paper) secara otomatis menggunakan teknologi kecerdasan buatan (AI) dari Google Gemini.

Sistem ini terdiri dari dua layanan utama:
1. **Backend (Web & API)**: Dibangun menggunakan Laravel, React, dan Inertia.js.
2. **AI Service**: Dibangun menggunakan FastAPI (Python) yang bertugas mengekstraksi dan mengevaluasi dokumen PDF menggunakan Google Gemini API.

---

## 🏗️ Arsitektur Sistem

Aplikasi ini menggunakan arsitektur *microservices* sederhana:
- **Client/Frontend**: Menggunakan React.js dipadukan dengan Inertia.js dan Tailwind CSS yang terintegrasi di dalam Laravel.
- **Backend/Core API**: Menggunakan framework Laravel (PHP) untuk menangani manajemen pengguna, manajemen peran (Spatie), autentikasi, serta logika bisnis pengajuan jurnal.
- **AI Service**: Menggunakan FastAPI (Python) dan library `PyMuPDF` (fitz) untuk membaca file PDF, serta integrasi dengan `google-generativeai` untuk melakukan telaah akademik secara mendalam. Komunikasi antara Backend dan AI Service dilakukan secara asinkron (menggunakan Laravel Queue).

---

## 📂 Struktur Folder

```text
ai-paper-analyzer/
├── backend/                  # Repositori Utama (Laravel + React)
│   ├── app/                  # Logika aplikasi backend (Controllers, Models, Jobs, Notifications)
│   ├── bootstrap/            # File bootstrap Laravel
│   ├── config/               # Konfigurasi aplikasi
│   ├── database/             # Migrasi dan Seeder (MySQL)
│   ├── public/               # File statis dan hasil build Vite
│   ├── resources/
│   │   ├── css/              # Konfigurasi Tailwind & CSS
│   │   └── js/               # Frontend React (Pages, Components, Layouts)
│   ├── routes/               # Rute web dan API
│   ├── storage/              # Tempat penyimpanan file PDF paper yang diunggah
│   └── artisan               # CLI Laravel
│
└── ai-service/               # Repositori Microservice AI (FastAPI)
    ├── app/                  # Direktori utama API
    │   ├── main.py           # Endpoint FastAPI
    │   └── services/         # Logika AI & interaksi dengan Gemini API
    ├── requirements.txt      # Dependency Python (fastapi, uvicorn, pymupdf, google-generativeai)
    └── .env                  # Environment API key Gemini
```

---

## 🔄 Alur Kerja Sistem (Workflow)

Sistem ini memfasilitasi alur kerja pengajuan jurnal dari awal hingga akhir:

1. **Unggah Paper (Upload)**
   - *Researcher* mengunggah file PDF paper dan memilih tujuan: **Studi & Analisis** atau **Submission Jurnal**.
   - Backend menyimpan PDF, mencatat entri paper (status `PROCESSING`), dan mendorong *Job* ke dalam antrean (Queue).

2. **Analisis AI (Automated Review)**
   - Laravel Queue Worker memanggil endpoint FastAPI `/api/analyze`.
   - FastAPI membaca teks dari PDF dan mengirimkannya ke Google Gemini API dengan prompt instruksi akademik yang ketat.
   - Hasil kembalian berupa JSON yang berisi metrik, kelebihan, kelemahan spesifik (beserta rujukan halaman/bab), persentase orisinalitas, dll, dikirim kembali ke Backend.
   - Status paper berubah menjadi `ANALYZED`.

3. **Keputusan Researcher (Review Mandiri)**
   - Researcher melihat detail evaluasi AI secara lengkap.
   - Jika paper diajukan untuk jurnal, researcher bisa menekan **"Tarik & Revisi Mandiri"** (membatalkan submission) atau **"Lanjut Kirim ke Reviewer"** (mengubah status menjadi `SUBMITTED`).
   - Apabila di-submit, Admin (Dewan Redaksi) akan menerima notifikasi.

4. **Penugasan Reviewer (Assign Paper)**
   - Admin membuka halaman Master Paper / Assign Paper.
   - Sistem akan mencocokkan *Domain/Bidang* paper hasil analisis AI dengan bidang keahlian (*expertise*) masing-masing Reviewer untuk memberikan **Rekomendasi Matchmaking**.
   - Admin menugaskan paper kepada Reviewer, merubah status menjadi `IN_REVIEW`.

5. **Peer Review (Tinjauan Ahli)**
   - Reviewer menerima notifikasi dan dapat membaca ringkasan AI sebagai panduan awal.
   - Reviewer memberikan skor final, catatan, dan keputusan akhir (*Accept*, *Reject*, atau *Revision*).
   - Setelah selesai, status berubah menjadi `REVIEWED`.

---

## 🚀 Cara Menjalankan Aplikasi

### Persyaratan Sistem
- **PHP** >= 8.2 & Composer
- **Node.js** >= 18 & NPM
- **Python** >= 3.10
- **MySQL** / MariaDB
- Kunci API Google Gemini Studio

### 1. Menjalankan Backend (Laravel & React)
Buka terminal dan arahkan ke folder `backend`:
```bash
cd backend
composer install
npm install

# Salin konfigurasi environment
cp .env.example .env
php artisan key:generate

# Konfigurasi database di file .env (DB_DATABASE, DB_USERNAME, dll)
# Jalankan migrasi dan seeder awal (Admin & Roles)
php artisan migrate --seed

# Jalankan server
php artisan serve
```

Buka terminal kedua (masih di folder `backend`) untuk menjalankan Vite (Frontend) dan Queue Worker (untuk AI processing):
```bash
# Menjalankan frontend bundler (Hot Module Replacement)
npm run dev

# Menjalankan worker antrean (di terminal ketiga)
php artisan queue:work
```

### 2. Menjalankan AI Service (FastAPI)
Buka terminal baru dan arahkan ke folder `ai-service`:
```bash
cd ai-service

# Buat virtual environment (Direkomendasikan)
python -m venv venv

# Aktifkan virtual environment (Windows)
.\venv\Scripts\activate
# (Mac/Linux) source venv/bin/activate

# Instal dependensi
pip install -r requirements.txt

# Siapkan file .env dan masukkan GEMINI_API_KEY
echo GEMINI_API_KEY=apikeyanda > .env

# Jalankan uvicorn server
python -m uvicorn app.main:app --port 8001 --reload
```

---

## 👥 Hak Akses dan Peran (Roles)

1. **Researcher (Peneliti):** Dapat mengunggah paper, melihat hasil analisis AI, mengajukan paper ke jurnal, dan melihat riwayat (My Papers).
2. **Reviewer (Mitra Bestari):** Ditugaskan oleh Admin untuk menilai kelayakan karya tulis berdasarkan data mentah PDF dan dibantu ringkasan dari AI.
3. **Admin (Redaksi):** Mengelola master paper, menugaskan reviewer, mengelola daftar pengguna, dan melihat audit log.

---

## 🛠️ Tech Stack & Library Utama
- **Backend**: Laravel 11, Spatie Permission
- **Frontend**: React 18, Inertia.js, TailwindCSS, Lucide Icons, Vite
- **Database**: MySQL
- **AI Backend**: Python, FastAPI, PyMuPDF (fitz), Google Generative AI (Gemini 1.5 Flash/Pro)
