import React, { useState, useMemo } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { ClipboardList, FileText, Search, ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Paper } from '@/types/paper';
import { Badge } from '@/Components/Badge';

type SortField = 'title' | 'updated_at' | 'score';
type SortDir = 'asc' | 'desc';

export default function ReviewerDashboard() {
  const { papers, url } = usePage<{ papers: Paper[], url: string }>().props;
  
  // Get active tab from URL query param, default to 'pending'
  const tabParam = new URLSearchParams(window.location.search).get('tab') || 'pending';
  const isHistoryTab = tabParam === 'history';

  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Filter papers based on tab
  const tabPapers = useMemo(() => {
    return papers.filter(p => {
      if (isHistoryTab) {
        return p.submission_status === 'REVIEWED' || p.submission_status === 'REJECTED';
      }
      return p.submission_status === 'IN_REVIEW';
    });
  }, [papers, isHistoryTab]);

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

  const filteredAndSorted = useMemo(() => {
    let data = [...tabPapers];

    // Search
    if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(p => p.title?.toLowerCase().includes(q));
    }

    // Sort
    data.sort((a, b) => {
        let aVal: any = a[sortField as keyof Paper] || '';
        let bVal: any = b[sortField as keyof Paper] || '';
        
        if (sortField === 'updated_at') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        } else if (sortField === 'score') {
            aVal = a.reviews?.[0]?.score || 0;
            bVal = b.reviews?.[0]?.score || 0;
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }
        
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    return data;
  }, [tabPapers, search, sortField, sortDir]);

  const truncateTitle = (title: string, maxLen = 60) =>
      title.length > maxLen ? title.slice(0, maxLen).trimEnd() + '...' : title;

  return (
    <AppLayout defaultRole="reviewer">
      <Head title={isHistoryTab ? "Riwayat Review" : "Review Tertunda"} />
      
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
              {isHistoryTab ? 'Riwayat Review' : 'Review Tertunda'}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
              {isHistoryTab 
                ? 'Daftar paper yang telah selesai Anda review.' 
                : 'Daftar paper yang perlu Anda review saat ini.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e8e4dc] shadow-sm rounded-2xl overflow-hidden">
            
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-[#e8e4dc] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2 text-stone-900 font-bold">
                    <ClipboardList className="w-5 h-5 text-stone-400" />
                    <span>Daftar Paper</span>
                    <span className="ml-2 px-2 py-0.5 bg-stone-100 text-stone-600 text-xs font-bold rounded-full">
                        {filteredAndSorted.length}
                    </span>
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari judul paper..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-sm text-stone-800 placeholder-stone-400 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 focus:bg-white outline-none transition"
                    />
                </div>
            </div>

            {/* Table */}
            {tabPapers.length === 0 ? (
                <div className="p-16 text-center text-stone-500 flex flex-col items-center">
                    <ClipboardList className="w-12 h-12 text-stone-300 mb-4" />
                    <p className="font-medium">
                        {isHistoryTab 
                            ? 'Belum ada riwayat review.' 
                            : 'Tidak ada paper yang menunggu review Anda saat ini.'}
                    </p>
                </div>
            ) : filteredAndSorted.length === 0 ? (
                <div className="p-12 text-center text-stone-400 flex flex-col items-center">
                    <Search className="w-10 h-10 text-stone-300 mb-3" />
                    <p className="font-medium text-stone-500">Tidak ada paper yang cocok dengan pencarian.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">
                                    <button onClick={() => handleSort('title')} className="flex items-center font-semibold hover:text-stone-900 transition">
                                        Judul Paper <SortIcon field="title" />
                                    </button>
                                </th>
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">
                                    <button onClick={() => handleSort('updated_at')} className="flex items-center font-semibold hover:text-stone-900 transition">
                                        Tanggal Update <SortIcon field="updated_at" />
                                    </button>
                                </th>
                                {isHistoryTab && (
                                    <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">
                                        <button onClick={() => handleSort('score')} className="flex items-center font-semibold hover:text-stone-900 transition">
                                            Skor <SortIcon field="score" />
                                        </button>
                                    </th>
                                )}
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc]">Status</th>
                                <th className="px-6 py-4 font-semibold border-b border-[#e8e4dc] text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e8e4dc] text-stone-700">
                            {filteredAndSorted.map(p => (
                                <tr 
                                    key={p.id} 
                                    className="hover:bg-stone-50 transition-colors cursor-pointer group"
                                    onClick={() => window.location.href = `/detail/${p.id}`}
                                >
                                    <td className="px-6 py-4 max-w-md truncate" title={p.title}>
                                        <p className="font-semibold text-stone-900 group-hover:text-rose-700 transition-colors">
                                            {truncateTitle(p.title)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-stone-500">
                                        {new Date(p.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                    </td>
                                    {isHistoryTab && (
                                        <td className="px-6 py-4 font-bold text-stone-900">
                                            {p.reviews?.[0]?.score || '-'}
                                        </td>
                                    )}
                                    <td className="px-6 py-4">
                                        <Badge color={p.submission_status === 'REVIEWED' ? 'green' : 'yellow'}>
                                            {p.submission_status === 'REVIEWED' ? 'Selesai Direview' : 'Butuh Review'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                        <Link 
                                            href={`/detail/${p.id}`}
                                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition shadow-sm"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            <span>Lihat</span>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
