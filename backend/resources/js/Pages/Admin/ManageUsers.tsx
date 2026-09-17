import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { Users, Search, CheckCircle, Plus } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import { ConfirmModal } from '@/Components/ConfirmModal';
import axios from 'axios';

export default function ManageUsers({ researchers, reviewers, expertises, filters }: any) {
  const [filterExp, setFilterExp] = useState(filters.expertise || '');
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReviewer, setNewReviewer] = useState({ name: '', email: '', password: '', expertise: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleFilter = (e: React.FormEvent) => {
      e.preventDefault();
      router.get('/admin/users', { expertise: filterExp, search: searchQuery }, { preserveState: true });
  };

  const [confirmModal, setConfirmModal] = useState({
      isOpen: false,
      title: '',
      message: '',
      variant: 'info' as 'info' | 'success' | 'danger' | 'warning',
  });

  const handleCreateReviewer = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsCreating(true);
      try {
          await axios.post('/api/admin/reviewers', newReviewer);
          setShowAddModal(false);
          setNewReviewer({ name: '', email: '', password: '', expertise: '' });
          setConfirmModal({
              isOpen: true,
              title: 'Berhasil',
              message: '✓ Akun reviewer berhasil dibuat!',
              variant: 'success'
          });
      } catch (error: any) {
          setConfirmModal({
              isOpen: true,
              title: 'Gagal',
              message: 'Gagal membuat akun reviewer: ' + (error.response?.data?.message || error.message),
              variant: 'danger'
          });
      } finally {
          setIsCreating(false);
      }
  };

  return (
    <AppLayout defaultRole="admin">
      <Head title="Kelola Pengguna" />

      <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Tutup"
          variant={confirmModal.variant}
          onConfirm={() => {
              setConfirmModal({ ...confirmModal, isOpen: false });
              if (confirmModal.variant === 'success') router.reload();
          }}
          onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 pb-20">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Kelola Pengguna</h1>
                <p className="text-sm text-stone-500 mt-1">Daftar pengguna terdaftar di sistem: Peneliti (Researcher) dan Reviewer.</p>
            </div>
            <button 
                onClick={() => setShowAddModal(true)}
                className="bg-rose-700 hover:bg-rose-800 text-white font-medium shadow-sm rounded-xl px-5 py-2.5 transition flex items-center"
            >
                <Plus className="w-4 h-4 mr-2" /> Tambah Reviewer Baru
            </button>
        </div>

        {/* Tabel Reviewer */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-stone-900 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-rose-500"/> Akun Reviewer</h2>
                <form onSubmit={handleFilter} className="flex space-x-2">
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau email..."
                        className="border-stone-300 focus:border-rose-500 focus:ring-rose-500 rounded-lg text-sm"
                    />
                    <select 
                        value={filterExp}
                        onChange={e => setFilterExp(e.target.value)}
                        className="border-stone-300 focus:border-rose-500 focus:ring-rose-500 rounded-lg text-sm text-stone-600"
                    >
                        <option value="">Semua Keahlian</option>
                        {expertises?.map((exp: any) => (
                            <option key={exp.id} value={exp.name}>{exp.name}</option>
                        ))}
                    </select>
                    <button type="submit" className="bg-stone-100 text-stone-600 px-3 py-1 rounded-lg border border-stone-200 hover:bg-stone-200">Filter</button>
                    {(filterExp || searchQuery) && <Link href="/admin/users" className="text-sm text-stone-400 self-center hover:text-stone-600">Clear</Link>}
                </form>
            </div>
            <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">Keahlian (Expertise)</th>
                            <th className="px-6 py-4 font-semibold">Beban Review Aktif</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviewers.data.length === 0 ? (
                            <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">Belum ada reviewer.</td></tr>
                        ) : reviewers.data.map((r: any) => (
                            <tr key={r.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                                <td className="px-6 py-4 font-bold text-stone-900">{r.name}</td>
                                <td className="px-6 py-4 text-stone-500">{r.email}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-rose-50 text-rose-700 border border-rose-200 rounded-lg px-2.5 py-1 text-xs font-semibold">
                                        {r.expertise || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-stone-800">
                                    <span className="bg-stone-100 px-2 py-1 rounded border border-stone-200 font-mono text-xs">{r.reviews_count || 0} Paper</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Pagination Controls could be added here manually using reviewers.links */}
        </div>

        {/* Tabel Peneliti */}
        <div className="space-y-4 pt-8">
            <h2 className="text-lg font-bold text-stone-900 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-emerald-500"/> Akun Peneliti (Researcher)</h2>
            <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Nama</th>
                            <th className="px-6 py-4 font-semibold">Email</th>
                            <th className="px-6 py-4 font-semibold">Tanggal Daftar</th>
                        </tr>
                    </thead>
                    <tbody>
                        {researchers.data.length === 0 ? (
                            <tr><td colSpan={3} className="px-6 py-8 text-center text-stone-400">Belum ada peneliti.</td></tr>
                        ) : researchers.data.map((r: any) => (
                            <tr key={r.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                                <td className="px-6 py-4 font-bold text-stone-900">{r.name}</td>
                                <td className="px-6 py-4 text-stone-500">{r.email}</td>
                                <td className="px-6 py-4 text-stone-400 text-xs">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Modal Tambah Reviewer */}
        <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Tambah Reviewer Baru</h2>
                <form onSubmit={handleCreateReviewer} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Nama Lengkap</label>
                        <input className="w-full bg-white border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-stone-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" value={newReviewer.name} onChange={e => setNewReviewer({...newReviewer, name: e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Email</label>
                        <input type="email" className="w-full bg-white border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-stone-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" value={newReviewer.email} onChange={e => setNewReviewer({...newReviewer, email: e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Password Sementara</label>
                        <input type="text" className="w-full bg-white border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-stone-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" value={newReviewer.password} onChange={e => setNewReviewer({...newReviewer, password: e.target.value})} required />
                    </div>
                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Pilih Keahlian (Expertise)</label>
                        <select className="w-full bg-white border border-stone-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-stone-900 rounded-xl px-4 py-2.5 text-sm outline-none transition-all" value={newReviewer.expertise} onChange={e => setNewReviewer({...newReviewer, expertise: e.target.value})} required>
                            <option value="" disabled>Pilih Bidang Keahlian...</option>
                            {expertises?.map((exp: any) => (
                                <option key={exp.id} value={exp.name}>{exp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setShowAddModal(false)} className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl px-5 py-2.5 transition">Batal</button>
                        <button type="submit" disabled={isCreating} className="bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm transition disabled:opacity-50">
                            {isCreating ? 'Menyimpan...' : 'BUAT AKUN'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>

      </div>
    </AppLayout>
  );
}
