import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Activity,
  Settings,
  ExternalLink,
  Cpu
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
    <aside className="w-64 bg-white border-r border-[#eaecef] flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none shadow-[1px_0_2px_rgba(0,0,0,0.02)]">
      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#929aa5]">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-[#f5f6f8] text-[#1e2329] font-semibold border-l-3 border-[#F0B90B] shadow-xs'
                    : 'text-[#707a8a] hover:text-[#1e2329] hover:bg-[#fafbfc] border-l-3 border-transparent'
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
        <div className="p-3 rounded-lg bg-white border border-[#eaecef] mb-3 shadow-xs">
          <div className="flex items-center gap-2 mb-1 text-xs text-[#1e2329] font-medium">
            <Cpu className="w-3.5 h-3.5 text-[#b37400]" />
            <span>Automated Monitoring</span>
          </div>
          <p className="text-[11px] text-[#707a8a] leading-snug">
            Background node daemon syncs active wallets every 30s.
          </p>
        </div>

        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-mono text-[#707a8a] hover:text-[#1e2329] hover:bg-white border border-transparent hover:border-[#eaecef] transition-colors"
        >
          <span>Swagger API Docs</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
