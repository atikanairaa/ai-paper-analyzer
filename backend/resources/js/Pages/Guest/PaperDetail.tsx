import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Lock, FileText, ArrowLeft } from 'lucide-react';

export default function PaperDetail({ paper, isLocked, price }: { paper: any, isLocked: boolean, price: number }) {
    return (
        <div className="min-h-screen bg-[#faf8f5]">
            <Head title={paper.title} />
            <div className="max-w-4xl mx-auto py-12 px-4">
                <Link href="/katalog" className="inline-flex items-center space-x-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Katalog</span>
                </Link>
                
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-200">
                    <h1 className="text-3xl font-bold text-stone-900 mb-4">{paper.title}</h1>
                    <p className="text-stone-500 mb-8">Penulis: {paper.uploader?.name}</p>

                    {isLocked ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                                <Lock className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 mb-2">Konten Terkunci (Paywall)</h3>
                            <p className="text-stone-600 mb-6 max-w-md">Paper ini adalah publikasi Closed Access. Anda harus membayar untuk membaca dokumen selengkapnya.</p>
                            <button className="bg-rose-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-rose-700 transition">
                                Beli Akses - Rp {price.toLocaleString('id-ID')}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center flex flex-col items-center">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4 text-emerald-600">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 mb-2">Open Access</h3>
                            <p className="text-stone-600 mb-6">Paper ini dapat dibaca secara gratis oleh publik.</p>
                            <a href={`/storage/${paper.file_path}`} target="_blank" rel="noreferrer" className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-emerald-700 transition">
                                Baca PDF Sekarang
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
