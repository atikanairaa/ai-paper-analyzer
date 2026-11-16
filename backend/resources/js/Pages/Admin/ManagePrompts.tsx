import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { AppLayout } from '@/Layouts/AppLayout';

interface Criterion {
    id: number;
    category: string;
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
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCriterion, setSelectedCriterion] = useState<Criterion | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [customCategories, setCustomCategories] = useState<string[]>([]);
    const [categoryToEdit, setCategoryToEdit] = useState<string | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
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
        category: '',
        name: '',
        instruction: '',
        weight: 10,
        is_active: true,
        is_analyze: false,
        is_review: false,
        is_qa: false,
    });

    const createForm = useForm({
        category: 'Umum',
        name: '',
        instruction: '',
        weight: 10,
        is_active: true,
        is_analyze: true,
        is_review: true,
        is_qa: false,
    });

    const renameCategoryForm = useForm({
        old_category: '',
        new_category: '',
    });

    const openEditModal = (criterion: Criterion) => {
        setSelectedCriterion(criterion);
        editForm.setData({
            category: criterion.category,
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

    const handleCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) return;
        if (!customCategories.includes(trimmed)) {
            setCustomCategories(prev => [...prev, trimmed]);
        }
        setSelectedCategory(trimmed);
        setShowCategoryModal(false);
        setNewCategoryName('');
    };

    const openRenameCategoryModal = (cat: string) => {
        renameCategoryForm.setData({
            old_category: cat,
            new_category: cat,
        });
        setCategoryToEdit(cat);
    };

    const handleRenameCategorySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        renameCategoryForm.put(route('admin.prompts.category.rename'), {
            onSuccess: () => {
                if (customCategories.includes(renameCategoryForm.data.old_category)) {
                    setCustomCategories(prev =>
                        prev.map(c => c === renameCategoryForm.data.old_category ? renameCategoryForm.data.new_category : c)
                    );
                }
                setCategoryToEdit(null);
                renameCategoryForm.reset();
            },
        });
    };

    const openDeleteCategoryModal = (cat: string) => {
        setCategoryToDelete(cat);
    };

    const handleDeleteCategorySubmit = () => {
        if (!categoryToDelete) return;
        router.delete(route('admin.prompts.category.destroy'), {
            data: { category: categoryToDelete },
            onSuccess: () => {
                setCustomCategories(prev => prev.filter(c => c !== categoryToDelete));
                setCategoryToDelete(null);
            },
        });
    };

    const openCreateModal = (defaultCat?: string) => {
        const cat = defaultCat !== undefined ? defaultCat : (selectedCategory || 'Umum');
        createForm.setData({
            category: cat,
            name: '',
            instruction: '',
            weight: 10,
            is_active: true,
            is_analyze: true,
            is_review: true,
            is_qa: false,
        });
        setShowCreateModal(true);
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

    // Kelompokkan kriteria berdasarkan kategori
    const groupedCriteria = criteria.reduce((acc, criterion) => {
        const cat = criterion.category || 'Umum';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(criterion);
        return acc;
    }, {} as Record<string, Criterion[]>);

    const categories = Array.from(new Set([...Object.keys(groupedCriteria), ...customCategories]));
    const filteredCriteria = selectedCategory ? (groupedCriteria[selectedCategory] || []) : [];

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
                    <div className="flex gap-3">
                        {selectedCategory ? (
                            <>
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className="px-5 py-2.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-xl text-sm font-medium transition shadow-sm"
                                >
                                    Kembali ke Kategori
                                </button>
                                <button
                                    onClick={() => openCreateModal(selectedCategory)}
                                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition shadow-md flex items-center gap-2"
                                >
                                    + Tambah Kriteria
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setNewCategoryName('');
                                    setShowCategoryModal(true);
                                }}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium transition shadow-md flex items-center gap-2"
                            >
                                + Tambah Kategori
                            </button>
                        )}
                    </div>
                </div>

                {!selectedCategory ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categories.length === 0 ? (
                            <div className="col-span-full p-8 text-center bg-white border border-[#e8e4dc] rounded-2xl">
                                <p className="text-stone-400">Belum ada kategori/kriteria yang dibuat.</p>
                            </div>
                        ) : (
                            categories.map(category => (
                                <div
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    className="relative flex flex-col items-start p-6 bg-white border border-[#e8e4dc] hover:border-rose-300 hover:shadow-lg rounded-2xl transition-all group text-left cursor-pointer"
                                >
                                    <div className="flex items-center justify-between w-full mb-4">
                                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openRenameCategoryModal(category);
                                                }}
                                                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition"
                                                title="Ubah Nama Kategori"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteCategoryModal(category);
                                                }}
                                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                                title="Hapus Kategori"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-stone-800 mb-1">{category}</h3>
                                    <p className="text-stone-500 text-sm">{(groupedCriteria[category] || []).length} Kriteria</p>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div>
                        <h2 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                            <span className="text-stone-400">Kategori:</span> {selectedCategory}
                        </h2>
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
                                    {filteredCriteria.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center">
                                                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <span className="text-xl">📁</span>
                                                </div>
                                                <p className="font-semibold text-stone-700">Belum ada kriteria di kategori ini</p>
                                                <p className="text-stone-400 text-xs mt-1 mb-4">Mulai tambahkan kriteria evaluasi untuk kategori ini.</p>
                                                <button
                                                    onClick={() => openCreateModal(selectedCategory)}
                                                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-medium transition shadow-sm inline-flex items-center gap-1.5"
                                                >
                                                    + Tambah Kriteria Pertama
                                                </button>
                                            </td>
                                        </tr>
                                    ) : filteredCriteria.map((criterion) => (
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
                    </div>
                )}

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
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Kategori</label>
                                    <input type="text" placeholder="Cth: Ilmu Komputer, Umum, dll." className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={editForm.data.category} onChange={e => editForm.setData('category', e.target.value)} required />
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

                {/* Modal Tambah Kategori */}
                {showCategoryModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <h3 className="text-lg font-bold text-white">Tambah Kategori Baru</h3>
                                <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleCategorySubmit} className="py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Nama Kategori</label>
                                    <input
                                        type="text"
                                        placeholder="Cth: Ilmu Komputer, Teknik Elektro, dll."
                                        className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500"
                                        value={newCategoryName}
                                        onChange={e => setNewCategoryName(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                    <p className="text-xs text-stone-400 mt-1.5">
                                        Folder kategori baru akan dibuat dan Anda dapat mulai mengisi kriterianya.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                    <button type="button" onClick={() => setShowCategoryModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Batal</button>
                                    <button type="submit" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">
                                        Simpan Kategori
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Ubah Nama Kategori */}
                {categoryToEdit && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <h3 className="text-lg font-bold text-white">Ubah Nama Kategori</h3>
                                <button onClick={() => setCategoryToEdit(null)} className="text-gray-400 hover:text-white text-2xl font-bold">&times;</button>
                            </div>
                            <form onSubmit={handleRenameCategorySubmit} className="py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Nama Kategori Baru</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500"
                                        value={renameCategoryForm.data.new_category}
                                        onChange={e => renameCategoryForm.setData('new_category', e.target.value)}
                                        autoFocus
                                        required
                                    />
                                    <p className="text-xs text-stone-400 mt-1.5">
                                        Seluruh kriteria di dalam kategori ini akan otomatis diperbarui ke nama baru.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                    <button type="button" onClick={() => setCategoryToEdit(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Batal</button>
                                    <button type="submit" disabled={renameCategoryForm.processing} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Hapus Kategori */}
                {categoryToDelete && (
                    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-950/50 flex items-center justify-center border border-rose-900/50">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Hapus Kategori Ini?</h3>
                            <p className="text-gray-400 text-sm mb-1">Anda akan menghapus kategori:</p>
                            <p className="font-semibold text-rose-400 text-base mb-2">{categoryToDelete}</p>
                            <p className="text-gray-400 text-xs mb-6">
                                Tindakan ini akan menghapus <strong>{(groupedCriteria[categoryToDelete] || []).length} kriteria</strong> yang ada di dalamnya.
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setCategoryToDelete(null)} className="flex-1 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700">Batal</button>
                                <button onClick={handleDeleteCategorySubmit} className="flex-1 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Create Kriteria */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#1e2024] border border-gray-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl flex flex-col">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Tambah Kriteria Baru</h3>
                                    <p className="text-xs text-rose-400 mt-0.5">Kategori: <strong>{createForm.data.category}</strong></p>
                                </div>
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
                                    <input type="text" placeholder="Cth: Methodology, Novelty, dll." className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={createForm.data.name} onChange={e => createForm.setData('name', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-200 mb-1">Instruksi Evaluasi</label>
                                    <textarea rows={3} placeholder="Instruksi spesifik evaluasi untuk model AI..." className="w-full bg-[#141518] border border-gray-700 rounded-xl p-3 text-sm text-gray-200 focus:ring-2 focus:ring-rose-500" value={createForm.data.instruction} onChange={e => createForm.setData('instruction', e.target.value)} />
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
                                    <button type="submit" disabled={createForm.processing} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-medium">
                                        Tambah Kriteria
                                    </button>
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