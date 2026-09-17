import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { CheckCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ManageReviewers() {
  const { reviewers, expertises } = usePage<{ reviewers: any[], expertises: any[] }>().props;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newReviewer, setNewReviewer] = useState({ name: '', email: '', password: '', expertise: '' });
  const [isCreating, setIsCreating] = useState(false);

  const [showExpModal, setShowExpModal] = useState(false);
  const [expName, setExpName] = useState('');
  const [editingExp, setEditingExp] = useState<any>(null);
  const [isExpSaving, setIsExpSaving] = useState(false);

  const handleCreateReviewer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
        await axios.post('/api/admin/reviewers', newReviewer);
        alert('Reviewer berhasil ditambahkan!');
        setShowAddModal(false);
        setNewReviewer({ name: '', email: '', password: '', expertise: '' });
        router.reload();
    } catch (e: any) {
        alert(e.response?.data?.message || 'Gagal menambahkan reviewer.');
    } finally {
        setIsCreating(false);
    }
  };

  const handleSaveExp = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsExpSaving(true);
      try {
          if (editingExp) {
              await axios.put(`/api/admin/expertises/${editingExp.id}`, { name: expName });
          } else {
              await axios.post('/api/admin/expertises', { name: expName });
          }
          setShowExpModal(false);
          setExpName('');
          setEditingExp(null);
          router.reload();
      } catch (e: any) {
          alert('Gagal menyimpan bidang keahlian.');
      } finally {
          setIsExpSaving(false);
      }
  };

  const deleteExp = async (id: number) => {
      if (!confirm('Hapus bidang keahlian ini?')) return;
      try {
          await axios.delete(`/api/admin/expertises/${id}`);
          router.reload();
      } catch (e) {
          alert('Gagal menghapus.');
      }
  };

  return (
    <AppLayout defaultRole="admin">
      <Head title="Kelola Reviewer & Keahlian" />

      <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 pb-20">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Kelola Reviewer & Keahlian</h1>
          <p className="text-sm text-stone-500 mt-1">Tambah akun reviewer baru dan kelola daftar bidang keahlian (expertise).</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Kolom Kiri: Daftar Reviewer */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-stone-900 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-stone-400"/> Daftar Reviewer Aktif</h2>
                <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm max-h-[600px] overflow-y-auto">
                    {reviewers.map(r => (
                        <div key={r.id} className="mb-4 pb-4 border-b border-stone-100 last:mb-0 last:pb-0 last:border-0">
                            <h4 className="font-bold text-stone-900">{r.name}</h4>
                            <p className="text-xs text-stone-500">{r.email}</p>
                            <p className="text-xs text-indigo-600 mt-1 font-medium">{r.expertise || 'Keahlian belum diatur'}</p>
                        </div>
                    ))}
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="w-full mt-4 py-2 border-2 border-dashed border-stone-300 text-stone-500 rounded-xl text-sm font-semibold hover:border-stone-400 hover:text-stone-600 transition flex items-center justify-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Tambah Reviewer Baru
                    </button>
                </div>
            </div>

            {/* Kolom Kanan: Kelola Bidang Keahlian */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-stone-900 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-stone-400"/> Kelola Bidang Keahlian</h2>
                <div className="bg-white border border-[#e8e4dc] rounded-2xl p-6 shadow-sm max-h-[600px] overflow-y-auto">
                    {expertises && expertises.map((exp: any) => (
                        <div key={exp.id} className="mb-3 pb-3 border-b border-stone-100 last:mb-0 last:pb-0 last:border-0 flex justify-between items-center">
                            <p className="text-sm font-semibold text-stone-800">{exp.name}</p>
                            <div className="flex space-x-2">
                                <button onClick={() => { setEditingExp(exp); setExpName(exp.name); setShowExpModal(true); }} className="text-indigo-500 hover:text-indigo-700">
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => deleteExp(exp.id)} className="text-rose-500 hover:text-rose-700">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => { setEditingExp(null); setExpName(''); setShowExpModal(true); }}
                        className="w-full mt-2 py-2 border-2 border-dashed border-stone-300 text-stone-500 rounded-xl text-sm font-semibold hover:border-stone-400 hover:text-stone-600 transition flex items-center justify-center"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Tambah Bidang Keahlian
                    </button>
                </div>
            </div>
        </div>

        {/* Modal Tambah Reviewer */}
        <Modal show={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="md">
            <div className="p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">Tambah Reviewer Baru</h2>
                <form onSubmit={handleCreateReviewer} className="space-y-4">
                    <div>
                        <InputLabel value="Nama Lengkap" />
                        <TextInput className="w-full mt-1" value={newReviewer.name} onChange={e => setNewReviewer({...newReviewer, name: e.target.value})} required />
                    </div>
                    <div>
                        <InputLabel value="Email" />
                        <TextInput type="email" className="w-full mt-1" value={newReviewer.email} onChange={e => setNewReviewer({...newReviewer, email: e.target.value})} required />
                    </div>
                    <div>
                        <InputLabel value="Password Sementara" />
                        <TextInput type="text" className="w-full mt-1" value={newReviewer.password} onChange={e => setNewReviewer({...newReviewer, password: e.target.value})} required />
                    </div>
                    <div>
                        <InputLabel value="Pilih Keahlian (Expertise)" />
                        <select className="w-full mt-1 border-stone-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm text-sm" value={newReviewer.expertise} onChange={e => setNewReviewer({...newReviewer, expertise: e.target.value})} required>
                            <option value="" disabled>Pilih Bidang Keahlian...</option>
                            {expertises?.map((exp: any) => (
                                <option key={exp.id} value={exp.name}>{exp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-stone-500 font-semibold hover:bg-stone-100 rounded-lg transition">Batal</button>
                        <PrimaryButton disabled={isCreating}>{isCreating ? 'Menyimpan...' : 'Buat Akun'}</PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>

        {/* Modal Kelola Expertise */}
        <Modal show={showExpModal} onClose={() => setShowExpModal(false)} maxWidth="sm">
            <div className="p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">{editingExp ? 'Edit Bidang Keahlian' : 'Tambah Bidang Keahlian'}</h2>
                <form onSubmit={handleSaveExp} className="space-y-4">
                    <div>
                        <InputLabel value="Nama Bidang Keahlian" />
                        <TextInput className="w-full mt-1" value={expName} onChange={e => setExpName(e.target.value)} required placeholder="Contoh: Computer Science" />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={() => setShowExpModal(false)} className="px-4 py-2 text-stone-500 font-semibold hover:bg-stone-100 rounded-lg transition">Batal</button>
                        <PrimaryButton disabled={isExpSaving}>{isExpSaving ? 'Menyimpan...' : 'Simpan'}</PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>

      </div>
    </AppLayout>
  );
}
