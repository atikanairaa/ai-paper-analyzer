import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  FileText, UploadCloud, GitCompare, LogOut, User as UserIcon,
  LayoutDashboard, Users, Activity, ClipboardList, ChevronDown, Moon, Sun, Layers
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
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getMenus = (role: Role): MenuItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard',      label: 'Dashboard Statistik',   href: '/admin',     icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'master-paper',   label: 'Master Paper',          href: '/detail',    icon: <FileText className="w-5 h-5" /> },
          { id: 'reviewer-assign',label: 'Penugasan Reviewer',    href: '/reviewer',  icon: <Users className="w-5 h-5" /> },
        ];
      case 'reviewer':
        return [
          { id: 'assigned-reviews', label: 'Daftar Review Ditugaskan', href: '/reviewer', icon: <ClipboardList className="w-5 h-5" /> },
        ];
      case 'peneliti':
      default:
        return [
          { id: 'upload',    label: 'Unggah Paper',      href: '/upload',  icon: <UploadCloud className="w-5 h-5" /> },
          { id: 'my-papers', label: 'Paper Saya',        href: '/detail',  icon: <FileText className="w-5 h-5" /> },
          { id: 'compare',   label: 'Bandingkan Paper',  href: '/compare', icon: <GitCompare className="w-5 h-5" /> },
        ];
    }
  };

  const menus = getMenus(currentRole);

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#0f172a] font-sans transition-colors duration-300">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white dark:bg-[#131d36] border-r border-slate-200 dark:border-slate-800 flex flex-col z-20 flex-shrink-0 transition-colors duration-300">
        
        {/* Logo */}
        <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border border-slate-700/60 shadow-sm flex-shrink-0">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-tight">PaperLens</h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Asisten Penilai Paper</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-5">
          <p className="px-5 mb-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Menu Utama
          </p>
          <ul className="space-y-1 px-3">
            {menus.map(menu => {
              const isActive = activeHref === menu.href || (menu.href !== '/' && activeHref.startsWith(menu.href + '/'));
              
              return (
                <li key={menu.id}>
                  <Link
                    href={menu.href}
                    className={\lex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 border-l-4 \\}
                  >
                    <span className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}>{menu.icon}</span>
                    <span>{menu.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 transition-colors duration-300">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-white flex-shrink-0 shadow-sm border border-slate-700/50">
              <UserIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate capitalize">{currentRole} User</p>
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

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Top Navbar */}
        <header className="bg-white/90 dark:bg-[#131d36]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-3 px-8 flex justify-between items-center shadow-sm z-10 flex-shrink-0 transition-colors duration-300">
          
          {/* Role Preview Switcher */}
          <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium hidden sm:inline">Mode Pratinjau:</span>
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2 bg-slate-50 dark:bg-[#1e293b] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-md text-sm font-bold text-slate-700 dark:text-slate-200 capitalize w-32 transition-colors shadow-sm"
              >
                <span className="flex-1 text-left">{currentRole}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showRoleDropdown && (
                <div className="absolute top-full mt-1 left-0 w-36 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 shadow-xl rounded-lg overflow-hidden py-1 z-50">
                  {(['admin', 'peneliti', 'reviewer'] as Role[]).map(role => (
                    <button
                      key={role}
                      onClick={() => { setCurrentRole(role); setShowRoleDropdown(false); }}
                      className={\w-full text-left px-4 py-2 text-sm capitalize transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 \\}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs font-medium text-slate-400 hidden md:block bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-50 dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#0f172a] transition-colors duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
