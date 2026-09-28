import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { 
    BookOpen, Search, ChevronLeft, ChevronRight, 
    ExternalLink, Calendar, User, Tag, Library 
} from 'lucide-react';

interface Author { id: number; name: string; }
interface Analysis { research_domain?: string; research_type?: string; }
interface Paper {
    id: number;
    title: string;
    journal?: string;
    publication_year?: number;
    updated_at: string;
    authors?: Author[];
    uploader?: { name: string };
    analyses?: Analysis[];
}
interface PaginationLink { url: string | null; label: string; active: boolean; }
interface PaginatedPapers {
    data: Paper[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export default function PublishedPapers() {
    const { papers, domains, filters } = usePage<any>().props as {
        papers: PaginatedPapers;
        domains: string[];
        filters: { search: string; domain: string };
    };

    const [search, setSearch]   = useState(filters.search || '');
    const [domain, setDomain]   = useState(filters.domain || '');

    const applyFilter = (newSearch: string, newDomain: string) => {
        router.get('/admin/published-papers', { search: newSearch, domain: newDomain }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(search, domain);
    };

    const handleDomainChange = (d: string) => {
        setDomain(d);
        applyFilter(search, d);
    };

    // Group papers by research domain
    const groupedPapers = React.useMemo(() => {
        const groups: Record<string, Paper[]> = {};
        papers.data.forEach((p) => {
            const dom = p.analyses?.[0]?.research_domain || 'Lainnya';
            if (!groups[dom]) groups[dom] = [];
            groups[dom].push(p);
        });
        return groups;
    }, [papers.data]);

    const activeDomain = domain || '';

    return (
        <AppLayout defaultRole="admin">
            <Head title="Paper Dipublikasikan" />

            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-900">Paper Dipublikasikan</h1>
                        <p className="text-sm text-stone-500 mt-1">
                            Daftar paper yang telah berhasil dipublikasikan ke jurnal.
                            Total: <span className="font-semibold text-rose-700">{papers.total} paper</span>
                        </p>
                    </div>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 font-medium transition"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Kembali ke Dashboard
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* ── Sidebar Filter Domain ── */}
                    <aside className="w-full lg:w-60 flex-shrink-0 space-y-2">
                        <p className="text-xs uppercase font-bold text-stone-400 tracking-wider px-1 mb-3">Bidang Riset</p>
                        <button
                            onClick={() => handleDomainChange('')}
                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-between gap-2 border ${
                                activeDomain === ''
                                    ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                                    : 'bg-white border-[#e8e4dc] text-stone-700 hover:bg-stone-50'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <Library className="w-4 h-4" />
                                Semua Bidang
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                activeDomain === '' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
                            }`}>
                                {papers.total}
                            </span>
                        </button>

                        {domains.map((d) => (
                            <button
                                key={d}
                                onClick={() => handleDomainChange(d)}
                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 border ${
                                    activeDomain === d
                                        ? 'bg-rose-700 text-white border-rose-700 shadow-sm'
                                        : 'bg-white border-[#e8e4dc] text-stone-600 hover:bg-stone-50'
                                }`}
                            >
                                <Tag className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{d}</span>
                            </button>
                        ))}
                    </aside>

                    {/* ── Main Content ── */}
                    <div className="flex-1 min-w-0 space-y-4">

                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Cari judul atau penulis..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#e8e4dc] bg-white text-sm text-stone-800 placeholder-stone-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 outline-none transition"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2.5 bg-rose-700 text-white rounded-xl text-sm font-semibold hover:bg-rose-800 transition shadow-sm"
                            >
                                Cari
                            </button>
                        </form>

                        {/* Paper Table */}
                        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
                            {papers.data.length === 0 ? (
                                <div className="p-16 text-center flex flex-col items-center">
                                    <BookOpen className="w-12 h-12 text-stone-300 mb-4" />
                                    <h3 className="text-base font-bold text-stone-700 mb-1">Belum ada paper</h3>
                                    <p className="text-sm text-stone-400">
                                        {activeDomain || search
                                            ? 'Tidak ditemukan hasil yang cocok dengan filter ini.'
                                            : 'Belum ada paper yang berhasil dipublikasikan.'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Show grouped if no domain filter */}
                                    {!activeDomain ? (
                                        Object.entries(groupedPapers).map(([domainName, domainPapers]) => (
                                            <div key={domainName}>
                                                {/* Domain group header */}
                                                <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
                                                    <Tag className="w-4 h-4 text-rose-600" />
                                                    <span className="text-sm font-bold text-rose-800">{domainName}</span>
                                                    <span className="ml-auto text-xs bg-rose-100 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full">
                                                        {domainPapers.length} paper
                                                    </span>
                                                </div>
                                                {domainPapers.map((p, idx) => (
                                                    <PaperRow key={p.id} paper={p} isLast={idx === domainPapers.length - 1} />
                                                ))}
                                            </div>
                                        ))
                                    ) : (
                                        papers.data.map((p, idx) => (
                                            <PaperRow key={p.id} paper={p} isLast={idx === papers.data.length - 1} />
                                        ))
                                    )}

                                    {/* Pagination */}
                                    {papers.last_page > 1 && (
                                        <div className="px-6 py-4 border-t border-[#e8e4dc] bg-stone-50 flex items-center justify-between">
                                            <span className="text-xs text-stone-500 font-medium">
                                                Menampilkan {papers.from}–{papers.to} dari {papers.total} paper
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {papers.links.map((link, i) => (
                                                    link.url ? (
                                                        <Link
                                                            key={i}
                                                            href={link.url}
                                                            className={`px-3 py-1.5 text-xs rounded-lg border font-semibold transition ${
                                                                link.active
                                                                    ? 'bg-rose-700 border-rose-700 text-white shadow-sm'
                                                                    : 'bg-white border-[#e8e4dc] text-stone-600 hover:bg-stone-50'
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1.5 text-xs rounded-lg border border-[#e8e4dc] text-stone-300 bg-white cursor-not-allowed"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function PaperRow({ paper, isLast }: { paper: Paper; isLast: boolean }) {
    const domain = paper.analyses?.[0]?.research_domain;
    const authors = paper.authors?.map(a => a.name).join(', ') || '—';
    const publishedDate = new Date(paper.updated_at).toLocaleDateString('id-ID', {
        day: '2-digit', month: 'long', year: 'numeric'
    });

    return (
        <div
            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-stone-50 transition-colors cursor-pointer group ${!isLast ? 'border-b border-[#e8e4dc]' : ''}`}
            onClick={() => window.location.href = `/detail/${paper.id}`}
        >
            {/* Icon */}
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-900 group-hover:text-rose-700 transition-colors line-clamp-1">
                    {paper.title || 'Untitled'}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-stone-500">
                    <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {authors}
                    </span>
                    {paper.journal && (
                        <span className="flex items-center gap-1">
                            <Library className="w-3.5 h-3.5" />
                            {paper.journal}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {publishedDate}
                    </span>
                </div>
            </div>

            {/* Domain badge + link */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {domain && (
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-lg border border-rose-100">
                        {domain}
                    </span>
                )}
                <ExternalLink className="w-4 h-4 text-stone-300 group-hover:text-rose-500 transition-colors" />
            </div>
        </div>
    );
}
