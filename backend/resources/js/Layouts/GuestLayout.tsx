import { BookOpen } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen flex bg-[#faf8f5]">
            {/* ── Left Panel — Decorative ── */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[45%] flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-stone-800 via-stone-700 to-stone-900 p-12">
                {/* Decorative circles */}
                <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-stone-600/20 blur-2xl" />

                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
                    {/* Logo Mark */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 border border-stone-500/50 flex items-center justify-center mb-8 shadow-2xl">
                        <BookOpen className="w-10 h-10 text-rose-300" />
                    </div>

                    <h1 className="text-3xl font-bold text-white leading-tight tracking-tight">
                        AI Research Paper<br />
                        <span className="text-rose-300">Analyzer</span>
                    </h1>
                </div>
            </div>

            {/* ── Right Panel — Form Area ── */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Mobile Logo */}
                <div className="lg:hidden mb-8 flex flex-col items-center">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-stone-800 to-stone-700 flex items-center justify-center mb-3 shadow-lg border border-stone-600/40">
                        <BookOpen className="w-7 h-7 text-rose-300" />
                    </div>
                    <h1 className="text-xl font-bold text-stone-900">AI Paper Analyzer</h1>
                </div>

                {/* Form Card */}
                <div className="w-full max-w-md bg-white rounded-2xl border border-[#e8e4dc] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden">
                    {/* Card Header Bar */}
                    <div className="h-1 w-full bg-gradient-to-r from-rose-300 via-rose-500 to-rose-700" />

                    <div className="px-8 py-8">
                        {children}
                    </div>
                </div>

                <p className="mt-6 text-xs text-stone-400 text-center">
                    &copy; {new Date().getFullYear()} AI Research Paper Analyzer. All rights reserved.
                </p>
            </div>
        </div>
    );
}
