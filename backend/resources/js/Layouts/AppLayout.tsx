import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  FileText, UploadCloud, GitCompare, LogOut, User as UserIcon,
  LayoutDashboard, Users, ClipboardList, ChevronDown, Moon, Sun, BookOpen
} from 'lucide-react';

type Role = 'admin' | 'peneliti' | 'reviewer';
type Theme = 'light' | 'dark';

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
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
    <div className="min-h-screen flex bg-[#f1f5f9] text-slate-900 transition-colors duration-200 dark:bg-[#0b1329] dark:text-slate-100">

      {/* ── Sidebar ── */}
      <aside className="w-64 h-screen sticky top-0 flex flex-col bg-white border-r border-slate-200 dark:bg-[#101a36] dark:border-slate-800 flex-shrink-0 transition-colors duration-200 z-20">

        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center border border-slate-700/60 shadow-sm flex-shrink-0">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-white leading-tight">AI Research Paper Analyzer</h1>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-medium">Reviewer Assistant</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-5">
          <p className="px-5 mb-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Menu Utama</p>
          <ul className="space-y-1 px-3">
            {menus.map(menu => {
              const isActive = activeHref === menu.href || (menu.href !== '/' && activeHref.startsWith(menu.href + '/'));
              return (
                <li key={menu.id}>
                  <Link
                    href={menu.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 text-sm transition-all duration-150 border-l-4 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold border-blue-600 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-500 rounded-r-lg'
                        : 'border-transparent font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#182444] hover:text-slate-800 dark:hover:text-white rounded-lg'
                    }`}
                  >
                    <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>{menu.icon}</span>
                    <span>{menu.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User + Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-slate-700/50">
              <UserIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate capitalize">{currentRole} User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">Mode: {currentRole}</p>
            </div>
          </div>
          <Link
            href="/logout"
            method="post"
            as="button"
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white/95 border-b border-slate-200 dark:bg-[#101a36]/95 dark:border-slate-800 py-3 px-8 flex justify-between items-center shadow-sm z-10 flex-shrink-0 transition-colors duration-200 backdrop-blur-sm">

          {/* Role Switcher */}
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium hidden sm:inline">Mode Pratinjau:</span>
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2 bg-slate-50 dark:bg-[#182444] hover:bg-slate-100 dark:hover:bg-[#1e293b] border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md text-sm font-bold text-slate-800 dark:text-white capitalize w-32 transition-colors shadow-sm"
              >
                <span className="flex-1 text-left">{currentRole}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showRoleDropdown && (
                <div className="absolute top-full mt-1 left-0 w-36 bg-white dark:bg-[#182444] border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg overflow-hidden py-1 z-50">
                  {(['admin', 'peneliti', 'reviewer'] as Role[]).map(role => (
                    <button
                      key={role}
                      onClick={() => { setCurrentRole(role); setShowRoleDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 ${
                        currentRole === role
                          ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden md:block bg-slate-50 dark:bg-[#182444] px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-[#182444] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#1e293b] transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
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
