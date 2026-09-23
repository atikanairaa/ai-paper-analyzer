import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { FileText, ChevronRight, Loader2, Search, ArrowUpDown, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import axios from 'axios';
import { Paper } from '@/types/paper';

type SortField = 'title' | 'created_at' | 'status';
type SortDir = 'asc' | 'desc';

const STATUS_LABELS: Record<string, { label: string; classes: string }> = {
    ANALYZED: { label: 'Teranalisis', classes: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    FAILED:   { label: 'Gagal',       classes: 'bg-rose-50 text-rose-700 border-rose-100' },
    PROCESSING:{ label: 'Diproses',   classes: 'bg-amber-50 text-amber-700 border-amber-100' },
    UPLOADED: { label: 'Diunggah',    classes: 'bg-stone-50 text-stone-600 border-stone-200' },
    ARCHIVED: { label: 'Diarsip',     classes: 'bg-stone-50 text-stone-600 border-stone-200' },
};

// Domain badge pastel colors cycling
const DOMAIN_COLORS = [
    'bg-rose-50 text-rose-700 border-rose-100',
    'bg-amber-50 text-amber-700 border-amber-100',
    'bg-emerald-50 text-emerald-700 border-emerald-100',
    'bg-stone-50 text-stone-600 border-stone-200',
    'bg-orange-50 text-orange-700 border-orange-100',
    'bg-rose-100 text-rose-800 border-rose-200',
];

const getDomainColor = (domain?: string) => {
    if (!domain) return 'bg-stone-50 text-stone-500 border-stone-100';
    const hash = domain.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return DOMAIN_COLORS[hash % DOMAIN_COLORS.length];
};

const truncateTitle = (title: string, maxLen = 52) =>
    title.length > maxLen ? title.slice(0, maxLen).trimEnd() + '...' : title;

export default function MyPapers() {
    const [papers, setPapers] = useState<Paper[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    useEffect(() => {
        axios.get('/api/papers')
            .then(res => { if (Array.isArray(res.data)) setPapers(res.data); })
            .finally(() => setLoading(false));
    }, []);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 text-stone-400" />;
        return sortDir === 'asc'
            ? <ArrowUp className="w-3 h-3 ml-1 text-rose-500" />
            : <ArrowDown className="w-3 h-3 ml-1 text-rose-500" />;
    };

    const filtered = useMemo(() => {
        let data = [...papers];

        // Search
        if (search.trim()) {
            const q = search.toLowerCase();
            data = data.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.analyses?.[0]?.research_domain?.toLowerCase().includes(q) ||
                p.authors?.some(a => a.name.toLowerCase().includes(q))
            );
        }

        // Filter by status
        if (filterStatus) {
            data = data.filter(p => p.status === filterStatus);
        }

        // Sort
        data.sort((a, b) => {
            let aVal: any = a[sortField as keyof Paper] || '';
            let bVal: any = b[sortField as keyof Paper] || '';
            if (sortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            } else {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
            }
            if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return data;
    }, [papers, search, filterStatus, sortField, sortDir]);

    return (
        <AppLayout defaultRole="researcher">
            <Head title="Paper Saya — Riwayat Analisis" />

            <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-6">

                {/* Page Header */}
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Riwayat Analisis Paper</h1>
                    <p className="text-sm text-stone-500 mt-1">Daftar semua paper yang pernah Anda unggah dan analisis dengan AI.</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">

                    {/* Table Header Controls */}
                    <div className="px-6 py-4 border-b border-[#e8e4dc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-stone-400" />
                            <h2 className="text-base font-bold text-stone-900">Paper Saya</h2>
                            {!loading && (
                                <span className="ml-2 px-2 py-0.5 bg-stone-100 text-stone-600 text-xs font-bold rounded-full">
                                    {filtered.length}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-56">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Cari judul, bidang, penulis..."
                                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-sm text-stone-800 placeholder-stone-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:bg-white outline-none transition"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value)}
                                className="py-2 px-3 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-sm text-stone-700 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table Content */}
                    {loading ? (
                        <div className="p-12 flex items-center justify-center text-stone-500 space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                            <span>Memuat data...</span>
                        </div>
                    ) : papers.length === 0 ? (
                        <div className="p-16 text-center text-stone-500 flex flex-col items-center">
                            <FileText className="w-12 h-12 text-stone-300 mb-4" />
                            <p className="font-medium">Anda belum mengunggah paper apa pun.</p>
                            <Link href="/upload" className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-900 text-white text-sm font-semibold rounded-xl hover:bg-stone-800 transition shadow-sm">
                                <span>Unggah Paper Sekarang</span>
                            </Link>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 text-center text-stone-400 flex flex-col items-center">
                            <Search className="w-10 h-10 text-stone-300 mb-3" />
                            <p className="font-medium text-stone-500">Tidak ada paper yang cocok dengan pencarian.</p>
                            <button onClick={() => { setSearch(''); setFilterStatus(''); }} className="mt-3 text-rose-600 hover:text-rose-800 text-sm font-semibold">Reset Filter</button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] w-[38%]">
                                            <button onClick={() => handleSort('title')} className="flex items-center font-semibold hover:text-stone-900 transition">
                                                Judul Paper <SortIcon field="title" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] w-[17%]">
                                            <button onClick={() => handleSort('created_at')} className="flex items-center font-semibold hover:text-stone-900 transition">
                                                Tanggal Unggah <SortIcon field="created_at" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] w-[13%]">
                                            <button onClick={() => handleSort('status')} className="flex items-center font-semibold hover:text-stone-900 transition">
                                                Status <SortIcon field="status" />
                                            </button>
                                        </th>
                                        <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] w-[12%] text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                                    {filtered.map((p) => {
                                        const domain = p.analyses?.[0]?.research_domain;
                                        const statusCfg = STATUS_LABELS[p.status] || { label: p.status, classes: 'bg-stone-50 text-stone-600 border-stone-100' };
                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-stone-50 transition-colors cursor-pointer group"
                                                onClick={() => window.location.href = `/detail/${p.id}`}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-stone-900 group-hover:text-rose-700 transition-colors" title={p.title}>
                                                        {truncateTitle(p.title)}
                                                    </p>
                                                    {p.authors && p.authors.length > 0 && (
                                                        <p className="text-xs text-stone-400 mt-0.5">
                                                            {p.authors.map(a => a.name).join(', ')}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-stone-500 text-xs whitespace-nowrap">
                                                    {new Date(p.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusCfg.classes}`}>
                                                            {statusCfg.label}
                                                        </span>
                                                        {p.submission_status === 'REVISION_REQUIRED' || p.submission_status === 'REVISION' ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-amber-100 text-amber-800 border-amber-200">
                                                                Perlu Revisi
                                                            </span>
                                                        ) : (p.submission_status === 'ACCEPTED' || p.submission_status === 'ACCEPT') ? (
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border bg-emerald-100 text-emerald-800 border-emerald-200">
                                                                Diterima (Accepted)
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                                    <Link
                                                        href={`/detail/${p.id}`}
                                                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition shadow-sm"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        <span>Detail</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
