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
    <aside className="w-64 bg-[#0c1017] border-r border-[#1a2230] flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-inner'
                    : 'text-slate-300 hover:text-white hover:bg-[#131924] border border-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Quick External Links / Status Footer */}
      <div className="p-4 border-t border-[#171e2b] bg-[#090d13]">
        <div className="p-3 rounded-xl bg-[#10151f] border border-[#1e2637] mb-3">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-300 font-medium">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Polling</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Daemon cron scans active wallets every 30s.
          </p>
        </div>

        <a
          href="http://localhost:5000/api-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:bg-[#131924] transition-colors"
        >
          <span>Swagger API Docs</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
