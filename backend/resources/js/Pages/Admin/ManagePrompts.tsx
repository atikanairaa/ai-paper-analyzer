import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';

interface Criterion {
    id: number;
    name: string;
    instruction: string;
    weight: number;
    is_active: boolean;
    is_analyze: boolean;
    is_review: boolean;
    is_qa: boolean;
    updated_at: string;
}

interface Props {
    criteria: Criterion[];
}

export default function ManagePrompts({ criteria }: Props) {
    const { flash } = usePage<any>().props;
    const [selectedCriterion, setSelectedCriterion] = useState<Criterion | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<Criterion | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const editForm = useForm({
        name: '',
        instruction: '',
        weight: 10,
        is_active: true,
        is_analyze: false,
        is_review: false,
        is_qa: false,
    });

    const createForm = useForm({
        name: '',
        instruction: '',
        weight: 10,
        is_active: true,
        is_analyze: true,
        is_review: true,
        is_qa: false,
    });

    const openEditModal = (criterion: Criterion) => {
        setSelectedCriterion(criterion);
        editForm.setData({
            name: criterion.name,
            instruction: criterion.instruction || '',
            weight: criterion.weight,
            is_active: criterion.is_active,
            is_analyze: criterion.is_analyze,
            is_review: criterion.is_review,
            is_qa: criterion.is_qa,
        });
    };

    const closeEditModal = () => {
        setSelectedCriterion(null);
        editForm.reset();
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCriterion) return;
        editForm.put(route('admin.prompts.update', selectedCriterion.id), {
            onSuccess: () => closeEditModal(),
        });
    };

    const openCreateModal = () => {
        setShowCreateModal(true);
        createForm.reset();
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
        createForm.reset();
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.prompts.store'), {
            onSuccess: () => closeCreateModal(),
        });
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('admin.prompts.destroy', deleteTarget.id), {
            onSuccess: () => setDeleteTarget(null),
        });
    };

    return (
        <AppLayout>
            <Head title="Kelola Kriteria Penilaian" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
                {showToast && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">✅</span>
                            <p className="text-sm font-semibold">{flash.success}</p>
                        </div>
                        <button onClick={() => setShowToast(false)} className="text-emerald-500 hover:text-emerald-700">
                            &times;
                        </button>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-stone-800">Manajemen Kriteria Penilaian</h1>
                        <p className="text-stone-500 text-sm mt-1">
                            Kelola rubrik evaluasi dan bobot skor yang digunakan oleh AI.
                        </p>
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition shadow-md flex items-center gap-2"
                    >
                        + Tambah Kriteria
                    </button>
                </div>

                <div className="bg-white border border-[#e8e4dc] rounded-2xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-[#faf8f5] text-stone-500 text-[10px] uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Kriteria</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-center">Bobot</th>
                                <th className="px-6 py-4 font-semibold">Endpoint</th>
                                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {criteria.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-stone-400">Belum ada kriteria penilaian.</td>
                                </tr>
                            ) : criteria.map((criterion) => (
                                <tr key={criterion.id} className={`border-b border-stone-100 hover:bg-stone-50/50 ${!criterion.is_active ? 'opacity-60' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-stone-800">{criterion.name}</div>
                                        <div className="text-stone-500 text-xs mt-1 max-w-md">{criterion.instruction}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {criterion.is_active ? (
                                            <span className="bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full text-[10px] tracking-wide">
                                                AKTIF
                                            </span>
                                        ) : (
                                            <span className="bg-stone-100 text-stone-500 font-semibold px-2.5 py-1 rounded-full text-[10px] tracking-wide">
                                                NONAKTIF
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded text-xs">
                                            {criterion.weight}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1 flex-wrap">
                                            {criterion.is_analyze && <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-mono">/analyze</span>}
                                            {criterion.is_review && <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded-full font-mono">/review</span>}
                                            {criterion.is_qa && <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] px-2 py-0.5 rounded-full font-mono">/qa</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => openEditModal(criterion)} className="text-stone-400 hover:text-amber-600 font-medium text-sm transition">Edit</button>
                                        <button onClick={() => setDeleteTarget(criterion)} className="text-stone-400 hover:text-rose-600 font-medium text-sm transition">Hapus</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Modal Edit */}
                {selectedCriterion && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <h3 className="text-lg font-bold text-white">Edit Kriteria: {selectedCriterion.name}</h3>
                                <button onClick={closeEditModal} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleEditSubmit} className="py-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-200">Status Aktif</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={editForm.data.is_active} onChange={e => editForm.setData('is_active', e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Nama Kriteria</label>
                                    <input type="text" className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Instruksi Evaluasi</label>
                                    <textarea rows={3} className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={editForm.data.instruction} onChange={e => editForm.setData('instruction', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Bobot (%)</label>
                                    <input type="number" min="1" max="100" className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={editForm.data.weight} onChange={e => editForm.setData('weight', Number(e.target.value))} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-2">Gunakan Pada Endpoint:</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                                            <input type="checkbox" checked={editForm.data.is_analyze} onChange={e => editForm.setData('is_analyze', e.target.checked)} className="rounded border-gray-600 bg-[#141518] text-rose-600 focus:ring-rose-500" />
                                            /analyze
                                        </label>
                                        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                                            <input type="checkbox" checked={editForm.data.is_review} onChange={e => editForm.setData('is_review', e.target.checked)} className="rounded border-gray-600 bg-[#141518] text-rose-600 focus:ring-rose-500" />
                                            /review
                                        </label>
                                        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                                            <input type="checkbox" checked={editForm.data.is_qa} onChange={e => editForm.setData('is_qa', e.target.checked)} className="rounded border-gray-600 bg-[#141518] text-rose-600 focus:ring-rose-500" />
                                            /qa
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                    <button type="button" onClick={closeEditModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Batal</button>
                                    <button type="submit" disabled={editForm.processing} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">Simpan Perubahan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Create */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <h3 className="text-lg font-bold text-white">Tambah Kriteria Baru</h3>
                                <button onClick={closeCreateModal} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleCreateSubmit} className="py-4 space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-200">Status Aktif</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={createForm.data.is_active} onChange={e => createForm.setData('is_active', e.target.checked)} />
                                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Nama Kriteria</label>
                                    <input type="text" className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Instruksi Evaluasi</label>
                                    <textarea rows={3} className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={createForm.data.instruction} onChange={e => createForm.setData('instruction', e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Bobot (%)</label>
                                    <input type="number" min="1" max="100" className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={createForm.data.weight} onChange={e => createForm.setData('weight', Number(e.target.value))} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-2">Gunakan Pada Endpoint:</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                                            <input type="checkbox" checked={createForm.data.is_analyze} onChange={e => createForm.setData('is_analyze', e.target.checked)} className="rounded border-gray-600 bg-[#141518] text-rose-600 focus:ring-rose-500" />
                                            /analyze
                                        </label>
                                        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                                            <input type="checkbox" checked={createForm.data.is_review} onChange={e => createForm.setData('is_review', e.target.checked)} className="rounded border-gray-600 bg-[#141518] text-rose-600 focus:ring-rose-500" />
                                            /review
                                        </label>
                                        <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                                            <input type="checkbox" checked={createForm.data.is_qa} onChange={e => createForm.setData('is_qa', e.target.checked)} className="rounded border-gray-600 bg-[#141518] text-rose-600 focus:ring-rose-500" />
                                            /qa
                                        </label>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                    <button type="button" onClick={closeCreateModal} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Batal</button>
                                    <button type="submit" disabled={createForm.processing} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">Tambah Kriteria</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Hapus */}
                {deleteTarget && (
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-950/50 flex items-center justify-center border border-rose-900/50">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Hapus Kriteria Ini?</h3>
                            <p className="text-gray-400 text-sm mb-1">Anda akan menghapus kriteria:</p>
                            <p className="font-semibold text-gray-200 mb-6">{deleteTarget.name}</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Batal</button>
                                <button onClick={handleDelete} className="flex-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}