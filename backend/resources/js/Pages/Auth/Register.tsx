import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from 'lucide-react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Daftar - AI Paper Analyzer" />

            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-900 leading-tight">
                    Buat Akun Baru
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                    Daftar untuk mulai menganalisis paper Anda dengan AI.
                </p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                {/* Name Field */}
                <div>
                    <label
                        htmlFor="name"
                        className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2"
                    >
                        Nama Lengkap
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <User className="w-4 h-4 text-stone-400" />
                        </div>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={data.name}
                            autoComplete="name"
                            autoFocus
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="John Doe"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-stone-900 placeholder-stone-400 text-sm transition-all outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:bg-white"
                        />
                    </div>
                    <InputError message={errors.name} className="mt-1.5" />
                </div>

                {/* Email Field */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2"
                    >
                        Alamat Email
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="w-4 h-4 text-stone-400" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="nama@institusi.ac.id"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-stone-900 placeholder-stone-400 text-sm transition-all outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:bg-white"
                        />
                    </div>
                    <InputError message={errors.email} className="mt-1.5" />
                </div>

                {/* Password Field */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2"
                    >
                        Kata Sandi
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-stone-400" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            value={data.password}
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-stone-900 placeholder-stone-400 text-sm transition-all outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                {/* Confirm Password Field */}
                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2"
                    >
                        Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Lock className="w-4 h-4 text-stone-400" />
                        </div>
                        <input
                            id="password_confirmation"
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="password_confirmation"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="••••••••"
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#e8e4dc] bg-[#faf8f5] text-stone-900 placeholder-stone-400 text-sm transition-all outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 focus:bg-white"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center space-x-2 py-3 px-6 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-semibold text-sm rounded-xl transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
                    >
                        {processing ? (
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                        <span>{processing ? 'Memproses...' : 'Daftar Sekarang'}</span>
                    </button>
                </div>
            </form>

            {/* Divider + Login Link */}
            <div className="mt-6 pt-6 border-t border-[#e8e4dc] text-center">
                <p className="text-sm text-stone-500">
                    Sudah punya akun?{' '}
                    <Link
                        href={route('login')}
                        className="text-rose-600 hover:text-rose-800 font-semibold transition-colors"
                    >
                        Masuk di sini
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
