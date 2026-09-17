import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';
import { BookOpen, Edit2, Trash2, Plus, CheckCircle } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import PrimaryButton from '@/Components/PrimaryButton';
import axios from 'axios';

export default function ManageExpertises({ expertises }: any) {
  const [showExpModal, setShowExpModal] = useState(false);
  const [expName, setExpName] = useState('');
  const [editingExp, setEditingExp] = useState<any>(null);
  const [isExpSaving, setIsExpSaving] = useState(false);

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
      <Head title="Kelola Bidang Keahlian" />

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 pb-20">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-stone-900">Kelola Bidang Keahlian</h1>
                <p className="text-sm text-stone-500 mt-1">Daftar ini digunakan oleh AI untuk mengklasifikasikan dokumen dan oleh reviewer untuk keahliannya.</p>
            </div>
            <button 
                onClick={() => { setEditingExp(null); setExpName(''); setShowExpModal(true); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center"
            >
                <Plus className="w-4 h-4 mr-2" /> Tambah Bidang Keahlian
            </button>
        </div>

        <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider border-b border-[#e8e4dc]">
                    <tr>
                        <th className="px-6 py-4 font-semibold">Nama Bidang Keahlian (Expertise)</th>
                        <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {expertises.length === 0 ? (
                        <tr><td colSpan={2} className="px-6 py-8 text-center text-stone-400">Belum ada bidang keahlian.</td></tr>
                    ) : expertises.map((exp: any) => (
                        <tr key={exp.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                            <td className="px-6 py-4 font-bold text-stone-900">{exp.name}</td>
                            <td className="px-6 py-4 flex justify-end space-x-2">
                                <button onClick={() => { setEditingExp(exp); setExpName(exp.name); setShowExpModal(true); }} className="text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-2 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => deleteExp(exp.id)} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-lg">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

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
