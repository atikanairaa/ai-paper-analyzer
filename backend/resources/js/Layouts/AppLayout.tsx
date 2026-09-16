import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  FileText, UploadCloud, GitCompare, LogOut, User as UserIcon,
  LayoutDashboard, Users, ClipboardList, ChevronDown, BookOpen
} from 'lucide-react';

type Role = 'admin' | 'peneliti' | 'reviewer';

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

export const AppLayout: React.FC<AppLayoutProps> = ({ children, defaultRole = 'peneliti' }) => {
  const { url } = usePage();
  const activeHref = url.split('?')[0];
  const [currentRole, setCurrentRole] = useState<Role>(defaultRole);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    // Lock to light mode permanently
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.removeItem('theme');
  }, []);

  const getMenus = (role: Role): MenuItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard',       label: 'Dashboard Statistik',    href: '/admin',    icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'master-paper',    label: 'Master Paper',           href: '/detail',   icon: <FileText className="w-5 h-5" /> },
          { id: 'reviewer-assign', label: 'Penugasan Reviewer',     href: '/reviewer', icon: <Users className="w-5 h-5" /> },
        ];
      case 'reviewer':
        return [
          { id: 'assigned-reviews', label: 'Daftar Review Ditugaskan', href: '/reviewer', icon: <ClipboardList className="w-5 h-5" /> },
        ];
      case 'peneliti':
      default:
        return [
          { id: 'upload',    label: 'Unggah Paper',     href: '/upload',  icon: <UploadCloud className="w-5 h-5" /> },
          { id: 'my-papers', label: 'Paper Saya',       href: '/detail',  icon: <FileText className="w-5 h-5" /> },
          { id: 'compare',   label: 'Bandingkan Paper', href: '/compare', icon: <GitCompare className="w-5 h-5" /> },
        ];
    }
  };

  const menus = getMenus(currentRole);

  return (
    <div className="min-h-screen flex bg-[#faf8f5] text-stone-900">

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
              const isActive = activeHref === menu.href || (menu.href !== '/' && activeHref.startsWith(menu.href + '/'));
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
              <p className="text-sm font-semibold text-stone-800 truncate capitalize">{currentRole} User</p>
              <p className="text-xs text-stone-500 capitalize">Mode: {currentRole}</p>
            </div>
          </div>
          <Link
            href="/logout"
            method="post"
            as="button"
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-[#e8e4dc] rounded-lg text-sm font-medium text-stone-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white/90 border-b border-[#e8e4dc] py-3 px-8 flex justify-between items-center shadow-sm z-10 flex-shrink-0 backdrop-blur-sm">

          {/* Role Switcher */}
          <div className="flex items-center space-x-2 text-sm text-stone-500">
            <span className="font-medium hidden sm:inline">Mode Pratinjau:</span>
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2 bg-stone-50 hover:bg-stone-100 border border-[#e8e4dc] px-3 py-1.5 rounded-md text-sm font-bold text-stone-800 capitalize w-32 transition-colors shadow-sm"
              >
                <span className="flex-1 text-left">{currentRole}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showRoleDropdown && (
                <div className="absolute top-full mt-1 left-0 w-36 bg-white border border-[#e8e4dc] shadow-xl rounded-lg overflow-hidden py-1 z-50">
                  {(['admin', 'peneliti', 'reviewer'] as Role[]).map(role => (
                    <button
                      key={role}
                      onClick={() => { setCurrentRole(role); setShowRoleDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors hover:bg-rose-50 hover:text-rose-700 ${
                        currentRole === role
                          ? 'font-bold text-rose-700 bg-rose-50'
                          : 'text-stone-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
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
