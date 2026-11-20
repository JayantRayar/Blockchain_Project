import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export const AppLayout = () => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1e2329] flex flex-col font-sans">
      <Navbar
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />

      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar />
        </div>

        {/* Mobile Drawer Backdrop */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden animate-in fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          >
            <div
              className="w-64 max-w-[80vw] h-full bg-white border-r border-[#eaecef] z-50 animate-in slide-in-from-left duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar onCloseMobile={() => setIsMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
