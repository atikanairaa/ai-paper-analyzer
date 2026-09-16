import React from 'react';
import { FileText, UploadCloud, GitCompare, LogOut, User as UserIcon } from 'lucide-react';

interface ResearcherLayoutProps {
  children: React.ReactNode;
  activeMenu?: 'my-papers' | 'upload' | 'compare';
}

export const ResearcherLayout: React.FC<ResearcherLayoutProps> = ({ children, activeMenu }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-700">AI Analyzer</h1>
          <p className="text-xs text-gray-500 mt-1">Panel Peneliti</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <a
                href="#"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu === 'my-papers'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>Paper Saya</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu === 'upload'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <UploadCloud className="w-5 h-5" />
                <span>Unggah Paper</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeMenu === 'compare'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <GitCompare className="w-5 h-5" />
                <span>Bandingkan Paper</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Dr. Peneliti</p>
              <p className="text-xs text-gray-500">Peneliti</p>
            </div>
          </div>
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Top Navbar Header (optional, but good for UX) */}
        <header className="bg-white border-b border-gray-200 py-4 px-8 sticky top-0 z-10 flex justify-end items-center">
             <div className="text-sm text-gray-500">Hari ini: {new Date().toLocaleDateString('id-ID')}</div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
