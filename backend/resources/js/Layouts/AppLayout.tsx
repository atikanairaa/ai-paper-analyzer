import React, { useState } from 'react';
import { 
  FileText, UploadCloud, GitCompare, LogOut, User as UserIcon,
  LayoutDashboard, Users, Activity, ClipboardList, ChevronDown, CheckCircle
} from 'lucide-react';

type Role = 'admin' | 'peneliti' | 'reviewer';

interface AppLayoutProps {
  children: React.ReactNode;
  activeMenu?: string;
  defaultRole?: Role;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activeMenu, defaultRole = 'peneliti' }) => {
  const [currentRole, setCurrentRole] = useState<Role>(defaultRole);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const getMenus = (role: Role) => {
    switch(role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard Statistik', icon: <LayoutDashboard className="w-5 h-5" /> },
          { id: 'master-paper', label: 'Master Paper', icon: <FileText className="w-5 h-5" /> },
          { id: 'reviewer-assign', label: 'Penugasan Reviewer', icon: <Users className="w-5 h-5" /> },
          { id: 'audit-log', label: 'Log Aktivitas', icon: <Activity className="w-5 h-5" /> },
        ];
      case 'reviewer':
        return [
          { id: 'assigned-reviews', label: 'Daftar Review Ditugaskan', icon: <ClipboardList className="w-5 h-5" /> },
        ];
      case 'peneliti':
      default:
        return [
          { id: 'my-papers', label: 'Paper Saya', icon: <FileText className="w-5 h-5" /> },
          { id: 'upload', label: 'Unggah Paper', icon: <UploadCloud className="w-5 h-5" /> },
          { id: 'compare', label: 'Bandingkan Paper', icon: <GitCompare className="w-5 h-5" /> },
        ];
    }
  };

  const menus = getMenus(currentRole);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-700">AI Analyzer</h1>
            <p className="text-xs text-gray-500 mt-1 capitalize">Panel {currentRole}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menus.map(menu => (
              <li key={menu.id}>
                <a
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeMenu === menu.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {menu.icon}
                  <span>{menu.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 capitalize">{currentRole} User</p>
              <p className="text-xs text-gray-500 capitalize">{currentRole}</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        
        {/* Top Navbar / Header with Role Switcher */}
        <header className="bg-white border-b border-gray-200 py-3 px-8 sticky top-0 z-10 flex justify-between items-center shadow-sm">
           <div className="text-sm font-medium text-gray-600 flex items-center">
              <span className="mr-2">Mode Pratinjau:</span>
              <div className="relative">
                <button 
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center justify-between space-x-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 px-3 py-1.5 rounded-md text-sm font-bold text-gray-700 capitalize w-36 transition-colors"
                >
                  <span>{currentRole}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showRoleDropdown && (
                  <div className="absolute top-full mt-1 left-0 w-36 bg-white border border-gray-200 shadow-lg rounded-md overflow-hidden py-1 z-50">
                    {(['admin', 'peneliti', 'reviewer'] as Role[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setCurrentRole(role);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm capitalize hover:bg-blue-50 ${currentRole === role ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}
              </div>
           </div>

           <div className="text-sm text-gray-500 flex items-center">
             <span>Hari ini: {new Date().toLocaleDateString('id-ID')}</span>
           </div>
        </header>
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
