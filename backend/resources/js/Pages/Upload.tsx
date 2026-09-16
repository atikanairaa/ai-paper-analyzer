import React, { useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
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
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      setError("Hanya file PDF yang diperbolehkan!");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Hanya file PDF yang diperbolehkan!");
    }
  };

  const pollPaperStatus = (id: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/papers/${id}`);
        const currentStatus = response.data?.status;
        if (currentStatus === 'ANALYZED') {
          clearInterval(interval);
          setStatus('analyzed');
          setPaperId(id);
        } else if (currentStatus === 'FAILED') {
          clearInterval(interval);
          setError('Analisis AI gagal diproses. Silakan coba lagi.');
          setStatus('idle');
        }
      } catch {
        clearInterval(interval);
        setError('Gagal memeriksa status analisis.');
        setStatus('idle');
      }
    }, 3000);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setError(null);
    setStatus('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_submission', uploadPurpose === 'journal' ? '1' : '0');

      const response = await axios.post('/api/papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newPaperId = response.data?.paper?.id;
      setStatus('processing');

      if (newPaperId) {
        pollPaperStatus(newPaperId);
      } else {
        setTimeout(() => setStatus('analyzed'), 9000);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Terjadi kesalahan saat mengunggah file.';
      setError(msg);
      setStatus('idle');
    }
  };

  return (
    <AppLayout defaultRole="peneliti">
      <div className="max-w-3xl mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Unggah Paper</h2>
          <p className="text-slate-500 mt-1">Sistem AI akan menganalisis dan mengekstrak informasi dari paper Anda secara otomatis.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center">
            {error}
          </div>
        )}

        {status === 'idle' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8">
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors ${
                  dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:bg-slate-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  accept=".pdf"
                  onChange={handleChange}
                />
                
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <File className="w-12 h-12 text-indigo-500 mb-3" />
                    <p className="font-semibold text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-xs text-indigo-600 font-medium mt-3 cursor-pointer">Klik untuk mengganti file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <UploadCloud className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="text-lg font-medium text-slate-700">Seret dan lepas file PDF di sini</p>
                    <p className="text-sm text-slate-500 mt-1">atau klik untuk menelusuri</p>
                    <p className="text-xs text-slate-400 mt-4">Maksimal ukuran file: 20MB · Hanya format .pdf</p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Tujuan Analisis</h3>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="purpose" value="study" checked={uploadPurpose === 'study'} onChange={() => setUploadPurpose('study')} className="w-4 h-4 text-indigo-600" />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-slate-900">Studi Pribadi</span>
                      <span className="block text-xs text-slate-500">Analisis cepat untuk keperluan membaca dan merangkum.</span>
                    </div>
                  </label>
                  <label className="flex items-center p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="purpose" value="journal" checked={uploadPurpose === 'journal'} onChange={() => setUploadPurpose('journal')} className="w-4 h-4 text-indigo-600" />
                    <div className="ml-3">
                      <span className="block text-sm font-medium text-slate-900">Kirim ke Jurnal</span>
                      <span className="block text-xs text-slate-500">Evaluasi mendalam menggunakan kriteria reviewer jurnal.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={handleSubmit}
                disabled={!file}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm"
              >
                Mulai Analisis
              </button>
            </div>
          </div>
        )}

        {status !== 'idle' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
            {status === 'uploading' && (
              <>
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Mengunggah Dokumen...</h3>
                <p className="text-slate-500 mt-2">Harap tunggu, file sedang dikirim ke server.</p>
              </>
            )}
            {status === 'processing' && (
              <>
                <div className="relative mb-6">
                  <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-700">AI</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900">AI sedang membaca paper Anda...</h3>
                <p className="text-slate-500 mt-2">Mengekstrak struktur, menganalisis metodologi, dan mengevaluasi temuan.</p>
                <div className="w-full max-w-md bg-slate-100 rounded-full h-2 mt-8 overflow-hidden">
                  <div className="h-2 bg-indigo-500 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-xs text-slate-400 mt-3 animate-pulse">Memeriksa status secara berkala setiap 3 detik...</p>
              </>
            )}
            {status === 'analyzed' && (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">Analisis Selesai!</h3>
                <p className="text-slate-500 mt-2 mb-6">Paper Anda berhasil dianalisis oleh AI.</p>
                <Link 
                  href={paperId ? `/detail/${paperId}` : '/detail'} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm"
                >
                  Lihat Hasil Analisis
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
