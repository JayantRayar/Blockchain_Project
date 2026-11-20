import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Activity,
  Settings,
  ExternalLink
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Wallets', path: '/wallets', icon: Wallet },
  { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
  { name: 'Blockchain Status', path: '/status', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar = ({ onCloseMobile }) => {
  return (
    <aside className="w-64 bg-white border-r border-[#eaecef] flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none font-sans">
      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-[#707a8a]">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#f5f6f8] text-[#1e2329] font-bold border-l-4 border-[#F0B90B]'
                    : 'text-[#707a8a] font-normal hover:text-[#1e2329] hover:bg-[#fafbfc] border-l-4 border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-500" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Quick External Links / Status Footer */}
      <div className="p-4 border-t border-[#eaecef] bg-[#fafbfc]">
        <div className="p-3 rounded bg-white border border-[#eaecef] mb-3">
          <div className="text-xs text-[#1e2329] font-bold mb-1">
            Automated Polling
          </div>
          <p className="text-xs text-[#707a8a] leading-normal font-normal">
            Daemon syncs active wallets every 30 seconds.
          </p>
        </div>

        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded text-xs text-[#707a8a] hover:text-[#1e2329] hover:bg-white border border-transparent hover:border-[#eaecef] transition-colors"
        >
          <span className="font-medium">Swagger API Documentation</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
