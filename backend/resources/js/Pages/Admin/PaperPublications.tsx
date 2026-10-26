import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { ConfirmModal } from '@/Components/ConfirmModal';
import {
    Send, CheckCircle2, AlertCircle, Clock, Search,
    ChevronLeft, ChevronRight, ExternalLink, Globe,
    CreditCard, ShieldCheck, FileText, User, Sparkles,
    X, BookOpen, Printer
} from 'lucide-react';

interface Author {
    id: number;
    name: string;
}

interface Paper {
    id: number;
    title: string;
    submission_status: string;
    access_type?: 'OPEN_ACCESS' | 'CLOSED_ACCESS' | null;
    payment_status?: 'PAID' | 'UNPAID' | null;
    invoice_id?: string | null;
    publication_year?: number | null;
    updated_at: string;
    authors?: Author[];
    uploader?: { id: number; name: string; email: string };
    analyses?: Array<{ research_domain?: string }>;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedPapers {
    data: Paper[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    papers: PaginatedPapers;
    stats: {
        total_ready: number;
        total_unpaid: number;
        total_published: number;
    };
    filters: {
        search: string;
        tab: string;
        paper_id?: number | null;
    };
}

export default function PaperPublications() {
    const { papers, stats, filters, flash } = usePage<any>().props as Props & { flash?: { success?: string; error?: string } };

    const [search, setSearch] = useState(filters.search || '');
    const [selectedTab, setSelectedTab] = useState(filters.tab || 'ready');
    const [isPublishing, setIsPublishing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(flash?.success || null);
    const [alertType, setAlertType] = useState<'success' | 'error' | null>(flash?.success ? 'success' : flash?.error ? 'error' : null);

    useEffect(() => {
        if (flash?.success) {
            setAlertMessage(flash.success);
            setAlertType('success');
        } else if (flash?.error) {
            setAlertMessage(flash.error);
            setAlertType('error');
        }
    }, [flash]);

    const [publishModal, setPublishModal] = useState<{
        isOpen: boolean;
        paper: Paper | null;
    }>({
        isOpen: false,
        paper: null,
    });

    const applyFilter = (newTab: string, newSearch: string) => {
        router.get('/admin/paper-publications', { tab: newTab, search: newSearch }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(selectedTab, search);
    };

    const handleTabChange = (tabKey: string) => {
        setSelectedTab(tabKey);
        applyFilter(tabKey, search);
    };

    const handleOpenPublishModal = (paper: Paper) => {
        setPublishModal({
            isOpen: true,
            paper,
        });
    };

    const handleConfirmPublish = () => {
        if (!publishModal.paper || isPublishing) return;
        const targetTitle = publishModal.paper.title;
        setIsPublishing(true);

        router.post(`/admin/paper-publications/${publishModal.paper.id}/publish`, {}, {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const successMsg = page?.props?.flash?.success || `Naskah "${targetTitle}" berhasil dipublikasikan ke katalog jurnal!`;
                setAlertMessage(successMsg);
                setAlertType('success');
            },
            onFinish: () => {
                setIsPublishing(false);
                setPublishModal({ isOpen: false, paper: null });
            },
        });
    };

    // Helper untuk mengecek apakah paper memenuhi syarat untuk diterbitkan
    const isReadyToPublish = (p: Paper): boolean => {
        if (p.submission_status !== 'ACCEPTED' && p.submission_status !== 'ACCEPT') return false;
        if (p.access_type === 'CLOSED_ACCESS') return true;
        if (p.access_type === 'OPEN_ACCESS' && p.payment_status === 'PAID') return true;
        return false;
    };

    return (
        <AppLayout defaultRole="admin">
            <Head title="Publikasi Paper" />

            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">

                {/* ── Modal Konfirmasi Penerbitan ── */}
                <ConfirmModal
                    isOpen={publishModal.isOpen}
                    title="Terbitkan Naskah ke Katalog Jurnal?"
                    message={`Apakah Anda yakin ingin menerbitkan naskah "${publishModal.paper?.title}" ke katalog jurnal publik? Peneliti akan menerima notifikasi bahwa naskah mereka telah resmi terbit.`}
                    confirmLabel={isPublishing ? "Menerbitkan..." : "Ya, Terbitkan Naskah"}
                    cancelLabel="Batal"
                    variant="success"
                    onConfirm={handleConfirmPublish}
                    onCancel={() => setPublishModal({ isOpen: false, paper: null })}
                />

                {/* ── Header Halaman ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-stone-900">Publikasi Paper</h1>
                            <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Panel Admin
                            </span>
                        </div>
                        <p className="text-sm text-stone-500 mt-1">
                            Kelola proses penerbitan naskah ilmiah yang telah diterima (ACCEPTED) oleh reviewer ke katalog publik.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/published-papers"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e8e4dc] text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-50 transition shadow-sm"
                        >
                            <Globe className="w-4 h-4 text-rose-600" />
                            <span>Arsip Paper Dipublikasikan ({stats.total_published})</span>
                        </Link>
                    </div>
                </div>

                {/* ── Alert Berhasil / Flash Notification ── */}
                {alertMessage && (
                    <div className={`px-5 py-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm border transition-all animate-in fade-in duration-200 ${
                        alertType === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                            : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                                alertType === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                            }`}>
                                {alertType === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            </div>
                            <div>
                                <p className={`text-[10px] uppercase font-bold tracking-wider ${
                                    alertType === 'success' ? 'text-emerald-700' : 'text-rose-700'
                                }`}>
                                    {alertType === 'success' ? 'Berhasil' : 'Pemberitahuan Sistem'}
                                </p>
                                <p className="text-sm font-semibold mt-0.5">{alertMessage}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setAlertMessage(null)}
                            className={`p-1.5 rounded-lg transition flex-shrink-0 ${
                                alertType === 'success' ? 'text-emerald-600 hover:bg-emerald-100' : 'text-rose-600 hover:bg-rose-100'
                            }`}
                            title="Tutup Notifikasi"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ── Target Highlight Banner (dari notifikasi) ── */}
                {filters.paper_id && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-950">
                                    Mengarahkan dari Notifikasi Naskah #{filters.paper_id}
                                </p>
                                <p className="text-xs text-amber-800 mt-0.5">
                                    Naskah ini telah menyelesaikan administrasi dan siap untuk Anda terbitkan ke katalog publik.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                router.get('/admin/paper-publications', { tab: selectedTab }, { preserveState: true });
                            }}
                            className="text-xs font-semibold text-amber-800 hover:text-amber-950 underline flex-shrink-0"
                        >
                            Tampilkan Semua
                        </button>
                    </div>
                )}

                {/* ── Stat Counters ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Card 1: Siap Terbit */}
                    <div
                        onClick={() => handleTabChange('ready')}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedTab === 'ready'
                            ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                            : 'bg-white border-[#e8e4dc] hover:border-emerald-200 shadow-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Siap Diterbitkan</p>
                                <h3 className="text-3xl font-extrabold text-stone-900 mt-2">{stats.total_ready}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Send className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Administrasi lengkap (Open Access Lunas / Closed Access)
                        </p>
                    </div>

                    {/* Card 2: Menunggu Pembayaran */}
                    <div
                        onClick={() => handleTabChange('unpaid')}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedTab === 'unpaid'
                            ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
                            : 'bg-white border-[#e8e4dc] hover:border-amber-200 shadow-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Menunggu Pembayaran</p>
                                <h3 className="text-3xl font-extrabold text-stone-900 mt-2">{stats.total_unpaid}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                <CreditCard className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Open Access menunggu pelunasan APC oleh peneliti
                        </p>
                    </div>

                    {/* Card 3: Total Terbit (Arsip Dipublikasikan) */}
                    <div
                        onClick={() => handleTabChange('published')}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${selectedTab === 'published'
                            ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'bg-white border-[#e8e4dc] hover:border-indigo-200 shadow-sm'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Arsip Dipublikasikan</p>
                                <h3 className="text-3xl font-extrabold text-stone-900 mt-2">{stats.total_published}</h3>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <Globe className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-xs text-stone-500 mt-3 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            Klik untuk membuka arsip paper yang telah terbit
                        </p>
                    </div>
                </div>

                {/* ── Filter Tabs & Search Bar ── */}
                <div className="bg-white border border-[#e8e4dc] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                        {[
                            { key: 'ready', label: 'Siap Terbit', count: stats.total_ready },
                            { key: 'published', label: 'Arsip Dipublikasikan', count: stats.total_published },
                            { key: 'all', label: 'Semua Diterima', count: null },
                            { key: 'open_access', label: 'Open Access', count: null },
                            { key: 'closed_access', label: 'Closed Access', count: null },
                            { key: 'unpaid', label: 'Menunggu Bayar', count: stats.total_unpaid },
                        ].map((t) => (
                            <button
                                key={t.key}
                                onClick={() => handleTabChange(t.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${selectedTab === t.key
                                    ? 'bg-rose-700 text-white shadow-sm'
                                    : 'text-stone-600 hover:bg-stone-100'
                                    }`}
                            >
                                <span>{t.label}</span>
                                {t.count !== null && t.count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${selectedTab === t.key
                                        ? 'bg-white/20 text-white'
                                        : 'bg-stone-200 text-stone-700'
                                        }`}>
                                        {t.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Search Form */}
                    <form onSubmit={handleSearch} className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari judul / peneliti..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold rounded-xl transition"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* ── Table Daftar Paper Siap Terbit ── */}
                <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#e8e4dc] bg-stone-50/75 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                                    <th className="py-3.5 px-6">Informasi Naskah</th>
                                    <th className="py-3.5 px-4">Peneliti & Pengunggah</th>
                                    <th className="py-3.5 px-4">Opsi Akses</th>
                                    <th className="py-3.5 px-4">Status Administrasi</th>
                                    <th className="py-3.5 px-6 text-right">Tindakan Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e8e4dc]">
                                {papers.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-16 text-center text-stone-400">
                                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Send className="w-6 h-6 text-stone-400" />
                                            </div>
                                            <p className="text-sm font-semibold text-stone-600">
                                                {selectedTab === 'published' ? 'Belum ada arsip paper yang dipublikasikan' : 'Tidak ada naskah yang ditemukan'}
                                            </p>
                                            <p className="text-xs text-stone-400 mt-1">
                                                {selectedTab === 'ready'
                                                    ? 'Belum ada naskah berstatus ACCEPTED yang telah menyelesaikan administrasi pembayaran.'
                                                    : selectedTab === 'published'
                                                    ? 'Paper yang resmi diterbitkan akan tampil di sini sebagai arsip publikasi.'
                                                    : 'Tidak ada data naskah sesuai filter yang dipilih.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    papers.data.map((paper) => {
                                        const ready = isReadyToPublish(paper);
                                        const isTarget = filters.paper_id === paper.id;

                                        return (
                                            <tr
                                                key={paper.id}
                                                className={`transition-colors ${isTarget
                                                    ? 'bg-amber-50/60 ring-2 ring-inset ring-amber-400'
                                                    : 'hover:bg-stone-50/60'
                                                    }`}
                                            >
                                                {/* Informasi Naskah */}
                                                <td className="py-4 px-6 max-w-md">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-rose-800">#{paper.id}</span>
                                                            {isTarget && (
                                                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                    Dari Notifikasi
                                                                </span>
                                                            )}
                                                            {paper.submission_status === 'PUBLISHED' ? (
                                                                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <Globe className="w-3 h-3 text-indigo-700" />
                                                                    PUBLISHED {paper.publication_year ? `(${paper.publication_year})` : ''}
                                                                </span>
                                                            ) : (
                                                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    ACCEPTED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Link
                                                            href={`/detail/${paper.id}`}
                                                            className="text-sm font-bold text-stone-900 hover:text-rose-700 line-clamp-2 transition leading-snug"
                                                        >
                                                            {paper.title}
                                                        </Link>
                                                        <p className="text-[11px] text-stone-400">
                                                            Terakhir diperbarui: {new Date(paper.updated_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Peneliti */}
                                                <td className="py-4 px-4 text-xs text-stone-600">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center flex-shrink-0 text-stone-600">
                                                            <User className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-stone-800">{paper.uploader?.name || 'Anonim'}</p>
                                                            <p className="text-[11px] text-stone-400">{paper.uploader?.email || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Opsi Akses */}
                                                <td className="py-4 px-4 text-xs">
                                                    {paper.access_type === 'OPEN_ACCESS' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                                                            <Globe className="w-3.5 h-3.5 text-emerald-600" />
                                                            Open Access
                                                        </span>
                                                    ) : paper.access_type === 'CLOSED_ACCESS' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 font-semibold border border-blue-200 text-[11px]">
                                                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                                            Closed Access
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] text-stone-400 italic">Belum Dipilih</span>
                                                    )}
                                                </td>

                                                {/* Status Administrasi */}
                                                <td className="py-4 px-4 text-xs">
                                                    {paper.submission_status === 'PUBLISHED' ? (
                                                        <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold text-[11px] bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                                                            Resmi Terpublikasi
                                                        </span>
                                                    ) : paper.access_type === 'CLOSED_ACCESS' ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            Gratis Penulis (Siap Terbit)
                                                        </span>
                                                    ) : paper.payment_status === 'PAID' ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                            Lunas APC (Siap Terbit)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                                                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                                                            Menunggu Pembayaran Peneliti
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Tindakan Admin */}
                                                <td className="py-4 px-6 text-right">
                                                    {paper.submission_status === 'PUBLISHED' ? (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <a
                                                                href={`/katalog/${paper.id}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition shadow-2xs"
                                                                title="Buka di Katalog Jurnal Publik"
                                                            >
                                                                <Globe className="w-3.5 h-3.5 text-rose-700" />
                                                                <span>Katalog</span>
                                                            </a>
                                                            <a
                                                                href={`/paper/${paper.id}/read`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition border border-rose-200 shadow-2xs"
                                                                title="Baca Naskah Paper Utuh"
                                                            >
                                                                <BookOpen className="w-3.5 h-3.5 text-rose-700" />
                                                                <span>Baca</span>
                                                            </a>
                                                            <Link
                                                                href={`/detail/${paper.id}`}
                                                                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                                                                title="Detail & Laporan AI"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Link
                                                                href={`/detail/${paper.id}`}
                                                                className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition"
                                                                title="Pratinjau / Detail Naskah"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                            </Link>

                                                            {ready ? (
                                                                <button
                                                                    onClick={() => handleOpenPublishModal(paper)}
                                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition"
                                                                >
                                                                    <Send className="w-3.5 h-3.5" />
                                                                    <span>Terbitkan Paper</span>
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    disabled
                                                                    title="Peneliti belum menyelesaikan pembayaran biaya publikasi"
                                                                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-400 font-medium text-xs rounded-xl cursor-not-allowed border border-stone-200"
                                                                >
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    <span>Belum Bisa Terbit</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {papers.total > papers.data.length && (
                        <div className="py-4 px-6 border-t border-[#e8e4dc] flex items-center justify-between">
                            <span className="text-xs text-stone-500">
                                Menampilkan {papers.from} - {papers.to} dari {papers.total} naskah
                            </span>
                            <div className="flex items-center gap-1">
                                {papers.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => link.url && router.visit(link.url)}
                                        disabled={!link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${link.active
                                            ? 'bg-rose-700 text-white'
                                            : link.url
                                                ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                                : 'text-stone-300 cursor-not-allowed'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </AppLayout>
    );
}
