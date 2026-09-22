import React, { useState } from 'react';
import { AppLayout } from '@/Layouts/AppLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Users, Search, Filter, Plus, ShieldCheck, CheckCircle, Edit, Trash2 } from 'lucide-react';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';

export default function ManageUsers({ researchers, reviewers, expertises, filters, flash }: any) {
    const [filterExp, setFilterExp] = useState(filters.expertise || '');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    
    // Modal state
    const [showUserModal, setShowUserModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create'|'edit'>('create');
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    // Inertia form
    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        role: 'reviewer',
        expertise: [] as string[]
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/admin/users', { expertise: filterExp, search: searchQuery }, { preserveState: true });
    };

    const openCreateModal = () => {
        setModalMode('create');
        setEditingUserId(null);
        reset();
        clearErrors();
        setShowUserModal(true);
    };

    const openEditModal = (user: any, role: string) => {
        setModalMode('edit');
        setEditingUserId(user.id);
        
        let userExpertises: string[] = [];
        if (user.expertise) {
            userExpertises = user.expertise.split(',').map((s:string) => s.trim());
        }

        setData({
            name: user.name,
            email: user.email,
            password: '', // blank for edit
            role: role,
            expertise: userExpertises
        });
        clearErrors();
        setShowUserModal(true);
    };

    const handleSaveUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'create') {
            post('/admin/users', {
                onSuccess: () => setShowUserModal(false),
            });
        } else {
            put(`/admin/users/${editingUserId}`, {
                onSuccess: () => setShowUserModal(false),
            });
        }
    };

    const handleDeleteUser = (id: number) => {
        if(confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
            destroy(`/admin/users/${id}`);
        }
    };

    return (
        <AppLayout defaultRole="admin">
            <Head title="Kelola Pengguna" />

            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                <div className="flex justify-between items-end border-b border-stone-200 pb-5">
                    <div>
                        <h1 className="text-3xl font-black text-stone-900 tracking-tight flex items-center">
                            <Users className="w-8 h-8 mr-3 text-rose-700" />
                            Kelola Pengguna
                        </h1>
                        <p className="text-stone-500 mt-2">Manajemen akun peneliti dan reviewer di dalam sistem.</p>
                    </div>
                    <button onClick={openCreateModal} className="bg-rose-700 hover:bg-rose-800 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition flex items-center">
                        <Plus className="w-4 h-4 mr-1.5" /> Tambah Pengguna Baru
                    </button>
                </div>

                {flash?.success && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl mb-4">
                        {flash.success}
                    </div>
                )}

                {/* Tabel Reviewer */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-stone-900 flex items-center"><ShieldCheck className="w-5 h-5 mr-2 text-rose-600"/> Akun Reviewer (Pemeriksa)</h2>
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
                                    <th className="px-6 py-4 font-semibold">Beban</th>
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviewers.data.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-stone-400">Belum ada reviewer.</td></tr>
                                ) : reviewers.data.map((r: any) => (
                                    <tr key={r.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                                        <td className="px-6 py-4 font-bold text-stone-900">{r.name}</td>
                                        <td className="px-6 py-4 text-stone-500">{r.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {r.expertise ? r.expertise.split(',').map((exp:string, i:number) => (
                                                    <span key={i} className="bg-rose-50 text-rose-700 border border-rose-200 rounded px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap">
                                                        {exp.trim()}
                                                    </span>
                                                )) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-800">
                                            <span className="bg-stone-100 px-2 py-1 rounded border border-stone-200 font-mono text-xs">{r.reviews_count || 0} Paper</span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => openEditModal(r, 'reviewer')} className="text-stone-400 hover:text-amber-600" title="Edit Pengguna"><Edit className="w-4 h-4 inline"/></button>
                                            <button onClick={() => handleDeleteUser(r.id)} className="text-stone-400 hover:text-rose-600" title="Hapus Pengguna"><Trash2 className="w-4 h-4 inline"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
                                    <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {researchers.data.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-stone-400">Belum ada peneliti.</td></tr>
                                ) : researchers.data.map((r: any) => (
                                    <tr key={r.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50/50">
                                        <td className="px-6 py-4 font-bold text-stone-900">{r.name}</td>
                                        <td className="px-6 py-4 text-stone-500">{r.email}</td>
                                        <td className="px-6 py-4 text-stone-400 text-xs">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => openEditModal(r, 'researcher')} className="text-stone-400 hover:text-amber-600" title="Edit Pengguna"><Edit className="w-4 h-4 inline"/></button>
                                            <button onClick={() => handleDeleteUser(r.id)} className="text-stone-400 hover:text-rose-600" title="Hapus Pengguna"><Trash2 className="w-4 h-4 inline"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Tambah/Edit Pengguna */}
                <Modal show={showUserModal} onClose={() => setShowUserModal(false)} maxWidth="md">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-stone-900 mb-4">{modalMode === 'create' ? 'Tambah Pengguna Baru' : 'Edit Pengguna'}</h2>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Peran (Role)</label>
                                <select className="w-full bg-white border border-stone-300 focus:border-rose-500 rounded-xl px-4 py-2 text-sm" value={data.role} onChange={e => setData('role', e.target.value)}>
                                    <option value="reviewer">Reviewer (Pemeriksa)</option>
                                    <option value="researcher">Peneliti (Researcher)</option>
                                </select>
                                {errors.role && <div className="text-rose-500 text-xs mt-1">{errors.role}</div>}
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Nama Lengkap</label>
                                <input className="w-full bg-white border border-stone-300 focus:border-rose-500 rounded-xl px-4 py-2 text-sm" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                {errors.name && <div className="text-rose-500 text-xs mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Email</label>
                                <input type="email" className="w-full bg-white border border-stone-300 focus:border-rose-500 rounded-xl px-4 py-2 text-sm" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                {errors.email && <div className="text-rose-500 text-xs mt-1">{errors.email}</div>}
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 block">Password {modalMode === 'edit' && '(Kosongkan jika tidak diubah)'}</label>
                                <input type="text" className="w-full bg-white border border-stone-300 focus:border-rose-500 rounded-xl px-4 py-2 text-sm" value={data.password} onChange={e => setData('password', e.target.value)} required={modalMode === 'create'} />
                                {errors.password && <div className="text-rose-500 text-xs mt-1">{errors.password}</div>}
                            </div>
                            
                            {data.role === 'reviewer' && (
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 block">Pilih Keahlian (Bisa pilih banyak)</label>
                                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 max-h-[200px] overflow-y-auto grid grid-cols-1 gap-2">
                                        {expertises?.map((exp: any) => (
                                            <label key={exp.id} className="flex items-start space-x-3 cursor-pointer hover:bg-stone-100 p-1.5 rounded transition">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-stone-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                                                    value={exp.name}
                                                    checked={data.expertise.includes(exp.name)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setData('expertise', [...data.expertise, exp.name]);
                                                        } else {
                                                            setData('expertise', data.expertise.filter((item: string) => item !== exp.name));
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm text-stone-700 leading-tight">{exp.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {errors.expertise && <div className="text-rose-500 text-xs mt-1">{errors.expertise}</div>}
                                </div>
                            )}

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowUserModal(false)} className="bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl px-5 py-2.5 transition">Batal</button>
                                <button type="submit" disabled={processing} className="bg-rose-700 hover:bg-rose-800 text-white font-semibold rounded-xl px-6 py-2.5 shadow-sm transition disabled:opacity-50">
                                    {processing ? 'Menyimpan...' : 'SIMPAN'}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

            </div>
        </AppLayout>
    );
}
