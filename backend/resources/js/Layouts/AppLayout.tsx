import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  FileText, UploadCloud, GitCompare, LogOut, User as UserIcon,
  LayoutDashboard, Users, Activity, ClipboardList, ChevronDown,
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
  activeMenu?: string;
  defaultRole?: Role;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeMenu, defaultRole = 'peneliti' }) => {
  const [currentRole, setCurrentRole] = useState<Role>(defaultRole);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getMenus = (role: Role): MenuItem[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard',      label: 'Dashboard Statistik',   href: '/admin',     icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'master-paper',   label: 'Master Paper',          href: '/detail',    icon: <FileText className="w-5 h-5" /> },
          { id: 'reviewer-assign',label: 'Penugasan Reviewer',    href: '/reviewer',  icon: <Users className="w-5 h-5" /> },
          { id: 'audit-log',      label: 'Log Aktivitas',         href: '/admin',     icon: <Activity className="w-5 h-5" /> },
        ];
      case 'reviewer':
        return [
          { id: 'assigned-reviews', label: 'Daftar Review Ditugaskan', href: '/reviewer', icon: <ClipboardList className="w-5 h-5" /> },
        ];
      case 'peneliti':
      default:
        return [
          { id: 'my-papers', label: 'Paper Saya',        href: '/detail',  icon: <FileText className="w-5 h-5" /> },
          { id: 'upload',    label: 'Unggah Paper',      href: '/upload',  icon: <UploadCloud className="w-5 h-5" /> },
          { id: 'compare',   label: 'Bandingkan Paper',  href: '/compare', icon: <GitCompare className="w-5 h-5" /> },
        ];
    }
  };

  const menus = getMenus(currentRole);

  return (
    <div className="flex h-screen bg-slate-50 font-sans">

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 flex-shrink-0">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-black">AI</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 leading-none">AI Analyzer</h1>
              <p className="text-[10px] text-slate-400 mt-0.5 capitalize">Panel {currentRole}</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-5 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Menu Utama
          </p>
          <ul className="space-y-0.5 px-3">
            {menus.map(menu => {
              const isActive = activeMenu === menu.id;
              return (
                <li key={menu.id}>
                  <Link
                    href={menu.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{menu.icon}</span>
                    <span>{menu.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate capitalize">{currentRole} User</p>
              <p className="text-xs text-slate-400 capitalize">{currentRole}</p>
            </div>
          </div>
          <Link
            href="/logout"
            method="post"
            as="button"
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </Link>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 py-3 px-8 flex justify-between items-center shadow-sm z-10 flex-shrink-0">

          {/* Role Preview Switcher */}
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <span className="font-medium">Mode Pratinjau:</span>
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-md text-sm font-bold text-slate-700 capitalize w-32 transition-colors"
              >
                <span className="flex-1 text-left">{currentRole}</span>
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              </button>

              {showRoleDropdown && (
                <div className="absolute top-full mt-1 left-0 w-36 bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden py-1 z-50">
                  {(['admin', 'peneliti', 'reviewer'] as Role[]).map(role => (
                    <button
                      key={role}
                      onClick={() => { setCurrentRole(role); setShowRoleDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors hover:bg-blue-50 hover:text-blue-700 ${
                        currentRole === role ? 'font-bold text-blue-600 bg-blue-50' : 'text-slate-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};
