import React, { useEffect, useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import {
  FileText, UploadCloud, GitCompare, LogOut, User as UserIcon,
  LayoutDashboard, Users, ClipboardList, BookOpen, Database, Bell,
  Clock, History
} from 'lucide-react';
import { ConfirmModal } from '@/Components/ConfirmModal';

type Role = 'admin' | 'researcher' | 'reviewer';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface AppLayoutProps {
  children: React.ReactNode;
  defaultRole?: Role;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { url, props } = usePage<any>();
  const activeHref = url.split('?')[0];

  const authUser = props.auth?.user;
  const currentRole = (props.auth?.peran as Role) || 'researcher';

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    // Lock to light mode permanently
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.removeItem('theme');

    // RBAC Frontend Check
    if (activeHref.startsWith('/admin') && currentRole !== 'admin') {
        router.visit('/dashboard');
    }
  }, [activeHref, currentRole]);

  const getMenus = (role: Role): MenuItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard',       label: 'Dashboard Statistik',    href: '/admin',              icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'master-paper',    label: 'Master Paper',           href: '/admin/papers',       icon: <FileText className="w-5 h-5" /> },
          { id: 'assign-paper',    label: 'Assign Paper',           href: '/admin/assign-paper', icon: <ClipboardList className="w-5 h-5" /> },
          { id: 'manage-users',    label: 'Kelola Pengguna',        href: '/admin/users',        icon: <Users className="w-5 h-5" /> },
          { id: 'manage-expertises', label: 'Kelola Bidang Keahlian', href: '/admin/expertises', icon: <BookOpen className="w-5 h-5" /> },
          { id: 'audit-logs',      label: 'Riwayat Audit Log',      href: '/admin/audit',        icon: <Database className="w-5 h-5" /> },
        ];
      case 'reviewer':
        return [
          {
            id: 'review-pending',
            label: 'Review Tertunda',
            href: '/reviewer?tab=pending',
            icon: <Clock className="w-5 h-5" />,
          },
          {
            id: 'review-history',
            label: 'Riwayat Review',
            href: '/reviewer?tab=history',
            icon: <History className="w-5 h-5" />,
          },
        ];
      case 'researcher':
      default:
        return [
          { id: 'upload',    label: 'Unggah Paper',     href: '/upload',  icon: <UploadCloud className="w-5 h-5" /> },
          { id: 'my-papers', label: 'Paper Saya',       href: '/detail',  icon: <FileText className="w-5 h-5" /> },
          { id: 'compare',   label: 'Bandingkan Paper', href: '/compare', icon: <GitCompare className="w-5 h-5" /> },
        ];
    }
  };

  const menus = getMenus(currentRole);

  const isMenuActive = (menu: MenuItem): boolean => {
    if (currentRole === 'reviewer') {
      const tabParam = new URLSearchParams(url.split('?')[1] || '').get('tab') || 'pending';
      if (menu.id === 'review-pending') return activeHref === '/reviewer' && tabParam === 'pending';
      if (menu.id === 'review-history') return activeHref === '/reviewer' && tabParam === 'history';
    }

    let isActive = activeHref === menu.href.split('?')[0] ||
      (menu.href !== '/' && menu.href !== '/admin' && activeHref.startsWith(menu.href.split('?')[0] + '/'));

    if (activeHref.startsWith('/detail/')) {
      if (currentRole === 'admin' && menu.id === 'master-paper') isActive = true;
      if (currentRole === 'researcher' && menu.id === 'my-papers') isActive = true;
    }

    return isActive;
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    router.post('/logout');
  };

  return (
    <div className="min-h-screen flex bg-[#faf8f5] text-stone-900">

      {/* ── Logout Confirm Modal ── */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Keluar dari Sistem?"
        message="Anda akan keluar dari sesi ini. Pastikan semua pekerjaan sudah tersimpan sebelum melanjutkan."
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="warning"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {/* ── Sidebar ── */}
      <aside className="w-64 h-screen sticky top-0 flex flex-col bg-white/90 border-r border-[#e8e4dc] flex-shrink-0 z-20">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-[#e8e4dc]">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-stone-800 to-stone-700 flex items-center justify-center border border-stone-600/60 shadow-sm flex-shrink-0">
              <BookOpen className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold tracking-tight text-stone-800 leading-tight">AI Research Paper Analyzer</h1>
              <p className="text-[11px] text-rose-600 mt-0.5 font-medium">Reviewer Assistant</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-5">
          <p className="px-5 mb-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">Menu Utama</p>
          <ul className="space-y-1 px-3">
            {menus.map(menu => {
              const isActive = isMenuActive(menu);
              return (
                <li key={menu.id}>
                  <Link
                    href={menu.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 border-l-4 ${
                      isActive
                        ? 'bg-rose-50 text-rose-800 font-semibold border-rose-500 rounded-r-lg'
                        : 'border-transparent font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 rounded-lg'
                    }`}
                  >
                    <span className={isActive ? 'text-rose-600' : 'text-stone-400'}>{menu.icon}</span>
                    <span>{menu.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-[#e8e4dc] space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-stone-600/40">
              <UserIcon className="w-4 h-4 text-rose-300" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate capitalize">{authUser ? authUser.name : 'Guest User'}</p>
              <p className="text-xs text-stone-500 capitalize">Mode: {currentRole === 'researcher' ? 'peneliti' : currentRole}</p>
            </div>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-[#e8e4dc] rounded-lg text-sm font-medium text-stone-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white/90 border-b border-[#e8e4dc] py-3 px-8 flex justify-end items-center space-x-6 shadow-sm z-10 flex-shrink-0 backdrop-blur-sm">

          {/* Notifications */}
          <div className="relative group">
            <button className="relative p-2 text-stone-500 hover:text-stone-900 transition rounded-full hover:bg-stone-100">
              <Bell className="w-5 h-5" />
              {props.auth?.notifications?.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#e8e4dc] rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                <h3 className="font-bold text-stone-900 text-sm">Notifikasi</h3>
                {props.auth?.notifications?.length > 0 && (
                  <button
                    onClick={async () => {
                      await axios.post('/notifications/mark-read');
                      router.reload();
                    }}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Tandai semua dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {(!props.auth?.notifications || props.auth.notifications.length === 0) ? (
                  <div className="p-6 text-center text-xs text-stone-400">Tidak ada notifikasi baru.</div>
                ) : (
                  props.auth.notifications.map((notif: any) => (
                    <Link key={notif.id} href={notif.data.url || '#'} className="block p-4 border-b border-stone-50 hover:bg-stone-50 transition">
                      <p className="text-sm font-bold text-stone-800 mb-1">{notif.data.title}</p>
                      <p className="text-xs text-stone-500 leading-relaxed">{notif.data.message}</p>
                      <p className="text-[10px] text-stone-400 mt-2">
                        {new Date(notif.created_at).toLocaleDateString('id-ID')}{' '}
                        {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="text-xs font-medium text-stone-500 hidden md:block bg-stone-50 px-3 py-1.5 rounded-full border border-[#e8e4dc]">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
