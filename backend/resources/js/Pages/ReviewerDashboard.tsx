import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { ClipboardList, FileText, CheckCircle } from 'lucide-react';
import { Paper } from '@/types/paper';
import { Badge } from '@/Components/Badge';

export default function ReviewerDashboard() {
  const { papers } = usePage<{ papers: Paper[] }>().props;

  return (
    <AppLayout defaultRole="reviewer">
      <Head title="Reviewer Dashboard" />
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Daftar Review Ditugaskan</h1>
          <p className="text-stone-500 mt-2">Pilih paper di bawah ini untuk melihat hasil analisis AI dan memberikan penilaian akhir.</p>
        </div>

        <div className="space-y-4">
            {papers.length === 0 ? (
                <div className="bg-white border border-[#e8e4dc] rounded-2xl p-12 text-center text-stone-500 shadow-sm">
                    <ClipboardList className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                    Belum ada paper yang ditugaskan kepada Anda saat ini.
                </div>
            ) : (
                papers.map(p => (
                    <Link 
                        key={p.id} 
                        href={`/detail/${p.id}`}
                        className="block bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-xl text-stone-900 group-hover:text-indigo-600 transition">{p.title}</h3>
                            <Badge color={p.submission_status === 'REVIEWED' ? 'green' : 'yellow'}>
                                {p.submission_status === 'REVIEWED' ? 'Selesai Direview' : 'Butuh Review'}
                            </Badge>
                        </div>
                        <p className="text-sm text-stone-600 line-clamp-2 mb-4">{p.abstract}</p>
                        <div className="flex items-center text-sm font-semibold text-indigo-600">
                            <FileText className="w-4 h-4 mr-2" />
                            Mulai Penilaian
                        </div>
                    </Link>
                ))
            )}
        </div>
      </div>
    </AppLayout>
  );
}
