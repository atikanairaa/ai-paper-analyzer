import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Masuk — AI Paper Analyzer" />

            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-900 leading-tight">
                    Selamat Datang Kembali
                </h2>
                <p className="text-sm text-stone-500 mt-1">
                    Masuk untuk mengakses dasbor analisis paper Anda.
                </p>
            </div>

            {/* Status Message */}
            {status && (
                <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
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
                            autoFocus
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
                            autoComplete="current-password"
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

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', (e.target.checked || false) as false)}
                                className="sr-only peer"
                                id="remember-me"
                            />
                            <div className="w-4 h-4 rounded border border-[#e8e4dc] bg-[#faf8f5] peer-checked:bg-rose-500 peer-checked:border-rose-500 transition-colors flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white hidden peer-checked:block" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-sm text-stone-600 group-hover:text-stone-900 transition-colors select-none">
                            Ingat saya
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="text-sm text-rose-600 hover:text-rose-800 font-medium transition-colors focus:outline-none focus:underline"
                        >
                            Lupa kata sandi?
                        </Link>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
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
                            <LogIn className="w-4 h-4" />
                        )}
                        <span>{processing ? 'Memproses...' : 'Masuk ke Sistem'}</span>
                    </button>
                </div>
            </form>

            {/* Divider + Register Link */}
            <div className="mt-6 pt-6 border-t border-[#e8e4dc] text-center">
                <p className="text-sm text-stone-500">
                    Belum punya akun?{' '}
                    <Link
                        href={route('register')}
                        className="text-rose-600 hover:text-rose-800 font-semibold transition-colors"
                    >
                        Daftar sekarang
                    </Link>
                </p>
            </div>
        </GuestLayout>
    );
}
