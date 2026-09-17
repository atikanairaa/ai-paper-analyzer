import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { UploadCloud, File, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadPurpose, setUploadPurpose] = useState<'study' | 'journal'>('study');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'analyzed'>('idle');
  const [paperId, setPaperId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type === 'application/pdf') { setFile(droppedFile); setError(null); }
    else { setError('Hanya file PDF yang diperbolehkan!'); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') { setFile(selectedFile); setError(null); }
    else { setError('Hanya file PDF yang diperbolehkan!'); }
  };

  const pollPaperStatus = (id: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/papers/${id}`);
        const currentStatus = response.data?.status;
        if (currentStatus === 'ANALYZED') { clearInterval(interval); setStatus('analyzed'); setPaperId(id); }
        else if (currentStatus === 'FAILED') { clearInterval(interval); setError('Analisis AI gagal. Silakan coba lagi.'); setStatus('idle'); }
      } catch { clearInterval(interval); setError('Gagal memeriksa status analisis.'); setStatus('idle'); }
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setError(null); setStatus('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_submission', uploadPurpose === 'journal' ? '1' : '0');
      const response = await axios.post('/api/papers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const newPaperId = response.data?.paper_id || response.data?.paper?.id;
      setStatus('processing');
      if (newPaperId) { pollPaperStatus(newPaperId); }
      else { setTimeout(() => setStatus('analyzed'), 9000); }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Terjadi kesalahan saat mengunggah file.');
      setStatus('idle');
    }
  };

  return (
    <AppLayout defaultRole="peneliti">
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stone-900">Unggah Paper</h2>
          <p className="text-stone-500 mt-1">Sistem AI akan menganalisis dan mengekstrak informasi dari paper Anda secara otomatis.</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {status === 'idle' && (
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
            <div className="p-8">
              {/* Dropzone */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                  dragActive ? 'border-rose-400 bg-rose-50' : 'border-stone-200 hover:bg-stone-50'
                }`}
                onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
              >
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept=".pdf" onChange={handleChange} />
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <File className="w-12 h-12 text-rose-500 mb-3" />
                    <p className="font-semibold text-stone-800">{file.name}</p>
                    <p className="text-sm text-stone-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-xs text-rose-600 font-medium mt-3">Klik untuk mengganti file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <UploadCloud className="w-12 h-12 text-stone-300 mb-3" />
                    <p className="text-lg font-medium text-stone-700">Seret dan lepas file PDF di sini</p>
                    <p className="text-sm text-stone-400 mt-1">atau klik untuk menelusuri</p>
                    <p className="text-xs text-stone-400 mt-4">Maksimal ukuran file: 20MB · Hanya format .pdf</p>
                  </div>
                )}
              </div>

              {/* Purpose */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">Tujuan Pengunggahan</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'study', title: 'Studi & Analisis', desc: 'Analisis mendalam untuk keperluan riset internal.' },
                    { value: 'journal', title: 'Submission Jurnal', desc: 'Paper akan dinilai untuk pengiriman ke jurnal.' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        uploadPurpose === opt.value
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-[#e8e4dc] hover:border-stone-300 bg-white'
                      }`}
                    >
                      <input type="radio" name="purpose" value={opt.value} checked={uploadPurpose === opt.value} onChange={() => setUploadPurpose(opt.value as any)} className="mt-0.5 accent-rose-600" />
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{opt.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex justify-end border-t border-stone-100 pt-6">
                <button
                  onClick={handleSubmit}
                  disabled={!file}
                  className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-8 rounded-xl transition-colors flex items-center space-x-2 shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Analisis Paper Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-12 flex flex-col items-center text-center">
            <Loader2 className="w-14 h-14 text-rose-500 animate-spin mb-5" />
            <h3 className="text-xl font-bold text-stone-900 mb-2">
              {status === 'uploading' ? 'Mengunggah file...' : 'AI Sedang Menganalisis...'}
            </h3>
            <p className="text-stone-500 text-sm max-w-sm">
              {status === 'uploading' ? 'Mohon tunggu, file sedang dikirim ke server.' : 'AI sedang membaca dan menganalisis paper Anda. Proses ini membutuhkan 30-60 detik.'}
            </p>
          </div>
        )}

        {status === 'analyzed' && (
          <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl p-12 flex flex-col items-center text-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-600 mb-5" />
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Analisis Selesai!</h3>
            <p className="text-stone-500 text-sm mb-8">Paper Anda telah berhasil dianalisis oleh sistem AI.</p>
            <Link
              href={paperId ? `/upload/${paperId}` : '/upload'}
              className="bg-rose-700 hover:bg-rose-800 text-white font-semibold py-2.5 px-8 rounded-xl transition-colors shadow-sm"
            >
              Lihat Hasil Analisis
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
