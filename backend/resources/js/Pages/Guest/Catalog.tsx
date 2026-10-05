import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Search, Lock, FileText, User, Calendar, Book, Filter, ChevronDown, BarChart2, Users, LayoutDashboard } from 'lucide-react';

export default function Catalog({ papers }: { papers: any[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("terbaru");

    const uniqueAuthors = new Set(papers.map(p => p.uploaded_by)).size;
    const openAccessCount = papers.filter(p => p.access_type !== 'CLOSED_ACCESS').length;
    const closedAccessCount = papers.filter(p => p.access_type === 'CLOSED_ACCESS').length;

    const filteredPapers = papers
        .filter(paper => {
            const query = searchQuery.toLowerCase();
            return (
                paper.title?.toLowerCase().includes(query) ||
                paper.uploader?.name?.toLowerCase().includes(query) ||
                paper.journal?.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            if (sortBy === "terbaru") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (sortBy === "terlama") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return 0;
        });

    // Ambil 5 teratas untuk sidebar "Top Journals/Papers"
    const topPapers = [...papers].slice(0, 5);

    return (
        <div className="min-h-screen bg-[#faf8f5] font-sans text-stone-800">
            <Head title="Katalog Publikasi" />
            
            {/* Navbar (Theme Admin) */}
            <nav className="bg-white border-b border-[#e8e4dc] sticky top-0 z-50 shadow-sm">
                <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-rose-700 rounded-md flex items-center justify-center text-white shadow-sm">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="font-black text-xl text-stone-900 tracking-tight">AI RESEARCH INDEX</span>
                    </div>
                    
                    <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-stone-600">
                        <Link href="/katalog" className="text-rose-700 border-b-2 border-rose-700 py-5">Katalog</Link>
                        <Link href="/login" className="hover:text-rose-700 transition-colors py-5">Login</Link>
                        <Link href="/register" className="hover:text-rose-700 transition-colors py-5">Registrasi</Link>

                    </div>
                </div>
            </nav>

            <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
                
                {/* KIRI: Main Content */}
                <div className="flex-1 overflow-hidden">
                    
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                        <h1 className="text-2xl font-bold text-stone-900 mr-auto">Katalog Jurnal</h1>
                        
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-stone-500 font-medium">Sort by</span>
                            <select 
                                value={sortBy} 
                                onChange={e => setSortBy(e.target.value)}
                                className="border border-[#e8e4dc] rounded-lg px-3 py-2 bg-white text-stone-700 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                            >
                                <option value="terbaru">Terbaru</option>
                                <option value="terlama">Terlama</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search journals..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-[#e8e4dc] rounded-lg outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-sm bg-white"
                                />
                            </div>
                            <button className="bg-white border border-[#e8e4dc] hover:bg-stone-50 text-stone-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors shadow-sm">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>
                    </div>

                    {/* Dashboard Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Total Journals */}
                        <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-sm flex items-center gap-5 hover:border-rose-300 transition-colors">
                            <div className="w-14 h-14 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-stone-500" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-stone-900">{papers.length}</h3>
                                <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mt-1">Total Publikasi</p>
                            </div>
                        </div>

                        {/* Total Publishers/Authors */}
                        <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-sm flex items-center gap-5 hover:border-rose-300 transition-colors">
                            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-bold text-stone-900">{uniqueAuthors}</h3>
                                <p className="text-xs text-stone-500 uppercase tracking-wide font-bold mt-1">Total Penulis</p>
                            </div>
                        </div>

                        {/* Fake Accreditations / Access Split */}
                        <div className="bg-white p-5 rounded-2xl border border-[#e8e4dc] shadow-sm flex flex-col justify-center hover:border-rose-300 transition-colors">
                            <p className="text-xs text-stone-500 text-center mb-3 font-bold uppercase">Tingkat Akses</p>
                            <div className="flex items-center gap-3">
                                {/* Donut Chart Representation */}
                                <div className="relative w-12 h-12 rounded-full border-[6px] border-emerald-500 border-r-rose-500 flex items-center justify-center shrink-0 mx-auto">
                                    <div className="w-6 h-6 bg-white rounded-full"></div>
                                </div>
                                <div className="text-xs font-semibold space-y-1 mx-auto text-stone-600">
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Open: {openAccessCount}</div>
                                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Closed: {closedAccessCount}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Paper List */}
                    <div className="space-y-4">
                        {filteredPapers.length === 0 ? (
                            <div className="bg-white p-12 text-center rounded-2xl border border-[#e8e4dc] shadow-sm">
                                <p className="text-stone-500">Tidak ada paper yang cocok dengan pencarian Anda.</p>
                            </div>
                        ) : (
                            filteredPapers.map(paper => {
                                const isClosed = paper.access_type === 'CLOSED_ACCESS';
                                
                                return (
                                    <div key={paper.id} className="bg-white rounded-2xl border border-[#e8e4dc] shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-rose-300 hover:shadow-md transition-all group">
                                        {/* Fake Cover Thumbnail */}
                                        <div className="w-full md:w-40 bg-stone-50 border-r border-[#e8e4dc] flex flex-col items-center justify-center p-4 shrink-0 min-h-[160px] group-hover:bg-rose-50/30 transition-colors">
                                            <Book className="w-12 h-12 text-stone-300 mb-2 group-hover:text-rose-200 transition-colors" />
                                            <span className="text-[10px] uppercase font-bold text-stone-400 text-center break-words w-full">
                                                {paper.journal || 'JURNAL ILMIAH UMUM'}
                                            </span>
                                        </div>
                                        
                                        {/* Paper Info */}
                                        <div className="p-6 flex-1 flex flex-col">
                                            <Link href={`/katalog/${paper.id}`} className="text-lg font-bold text-stone-900 group-hover:text-rose-700 transition-colors mb-2 leading-snug">
                                                {paper.title.toUpperCase()}
                                            </Link>
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mb-4">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-4 h-4 text-stone-400" />
                                                    <span className="font-semibold text-stone-700">{paper.uploader?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4 text-stone-400" />
                                                    <span className="font-medium">{paper.publication_year || '2026'}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-stone-100">
                                                {isClosed ? (
                                                    <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                                                        <Lock className="w-3 h-3" /> CLOSED ACCESS
                                                    </span>
                                                ) : (
                                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5">
                                                        <FileText className="w-3 h-3" /> OPEN ACCESS
                                                    </span>
                                                )}
                                                <span className="bg-stone-100 text-stone-600 border border-stone-200 px-2.5 py-1 rounded-md text-[10px] font-bold">
                                                    GOOGLE SCHOLAR Indexed
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* KANAN: Sidebar Top Journals */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-rose-700 text-white p-5 font-bold flex items-center gap-2">
                            <BarChart2 className="w-5 h-5" />
                            Top Publikasi Terbaru
                        </div>
                        <div className="p-5 space-y-5">
                            <p className="text-xs font-semibold text-stone-400 border-b border-stone-100 pb-3 mb-3">BERDASARKAN IMPACT & VIEW</p>
                            
                            {topPapers.map((tp, idx) => {
                                const widths = ['w-full', 'w-11/12', 'w-4/5', 'w-3/4', 'w-2/3'];
                                const score = [10975, 8432, 5321, 4120, 3105];
                                // We use Indigo for Top Journals to mimic AdminDashboard colors
                                
                                return (
                                    <Link key={tp.id} href={`/katalog/${tp.id}`} className="block group">
                                        <div className="relative mb-1">
                                            <div className={`bg-indigo-600 h-9 flex items-center px-3 rounded-lg ${widths[idx] || 'w-1/2'} transition-all group-hover:brightness-110 shadow-sm`}>
                                                <span className="text-white text-[10px] font-bold truncate pr-8 mix-blend-screen">
                                                    {tp.title.substring(0, 45)}...
                                                </span>
                                            </div>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-stone-600 drop-shadow-sm">
                                                (S{idx+1}) : {score[idx]}
                                            </span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
