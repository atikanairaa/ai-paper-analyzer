import React, { useState } from 'react';
import { Upload, X, FileText, Send } from 'lucide-react';

interface RevisionUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (file: File | null, notes: string) => void;
}

export const RevisionUploadModal: React.FC<RevisionUploadModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    if (!isOpen) return null;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
            }
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type === 'application/pdf') {
                setFile(selectedFile);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(file, notes);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#e8e4dc] w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gradient-to-r from-stone-50 to-[#faf8f5] px-6 py-5 border-b border-[#e8e4dc] flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900">Unggah Revisi Paper</h2>
                        <p className="text-sm text-stone-500 mt-1">Sertakan dokumen terbaru dan catatan respons untuk reviewer</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-stone-400 hover:text-stone-700 bg-white hover:bg-stone-100 p-2 rounded-full transition-colors border border-transparent hover:border-[#e8e4dc]"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto bg-[#faf8f5] flex-1 space-y-6">
                    {/* File Upload Zone */}
                    <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Dokumen Naskah Revisi (.pdf)</label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors ${
                                isDragging ? 'border-rose-400 bg-rose-50' : 'border-stone-300 bg-white hover:bg-stone-50'
                            }`}
                        >
                            {file ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                                        <FileText className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-bold text-stone-900">{file.name}</p>
                                    <p className="text-xs text-stone-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="mt-4 text-xs font-semibold text-rose-600 hover:text-rose-800"
                                    >
                                        Ganti File
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mb-3">
                                        <Upload className="w-6 h-6 text-stone-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-stone-700 mb-1">Tarik & Lepas file PDF di sini</p>
                                    <p className="text-xs text-stone-500 mb-4">atau klik tombol di bawah</p>
                                    <label className="cursor-pointer bg-white border border-stone-300 text-stone-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-50 transition shadow-sm">
                                        Pilih File PDF
                                        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notes Textarea */}
                    <div>
                        <label className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2">Catatan Respons untuk Reviewer (Point-by-point response)</label>
                        <textarea
                            required
                            rows={6}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tuliskan respons Anda terhadap komentar reviewer secara detail..."
                            className="w-full rounded-xl border border-[#e8e4dc] bg-white px-4 py-3 text-sm text-stone-900 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none transition resize-y shadow-sm"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#e8e4dc]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-stone-600 bg-white border border-[#e8e4dc] hover:bg-stone-50 transition"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={!file || !notes.trim()}
                            className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-rose-700 hover:bg-rose-800 border border-transparent shadow-sm flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            <span>Kirim Naskah Revisi</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
