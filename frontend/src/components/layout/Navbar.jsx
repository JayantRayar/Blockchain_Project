import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, RefreshCw, Layers, ShieldCheck, Menu, X, Wifi, WifiOff } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../common/Badge';

export const Navbar = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const { toast } = useToast();
  const [tipHeight, setTipHeight] = useState(null);
  const [network, setNetwork] = useState('testnet');
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

  // Poll tip height & backend status periodically
  const fetchStatus = async () => {
    try {
      const res = await api.getHealth();
      setBackendOnline(true);
      if (res?.network) setNetwork(res.network);
    } catch {
      setBackendOnline(false);
    }

    try {
      const bRes = await api.getBlockchainStatus(network);
      if (bRes?.data?.currentBlockHeight) {
        setTipHeight(bRes.data.currentBlockHeight);
      }
    } catch {
      // Handled silently for background poll
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [network]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await api.triggerSync();
      const count = Array.isArray(res?.data) ? res.data.length : 0;
      toast.success(`Synchronized ${count} wallet(s) successfully!`, 'Sync Complete');
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to trigger blockchain synchronization', 'Sync Failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0e14]/90 backdrop-blur-md border-b border-[#1b2230] px-4 lg:px-6 h-16 flex items-center justify-between">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-[#161c27] transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-black text-base font-mono">₿</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Block<span className="text-amber-400">Watch</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-wider -mt-1 hidden sm:block">
              BTC MONITORING TERMINAL
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Tip Height, Network, Sync Button, Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Online status indicator */}
        <div
          title={backendOnline ? 'Backend API Connected' : 'Backend Unreachable'}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121722] border border-[#1e2637] text-xs"
        >
          {backendOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-mono text-[11px]">API Online</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400 font-mono text-[11px]">API Offline</span>
            </>
          )}
        </div>

        {/* Tip Height Pill */}
        {tipHeight && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121722] border border-[#1e2637] text-xs font-mono text-slate-300">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Tip:</span>
            <span className="text-white font-semibold">#{tipHeight.toLocaleString()}</span>
          </div>
        )}

        {/* Network Badge */}
        <Badge variant={network === 'mainnet' ? 'mainnet' : 'testnet'} size="sm">
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {network.toUpperCase()}
        </Badge>

        {/* Manual Sync Trigger */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161d2a] hover:bg-[#1f293b] text-slate-200 border border-[#232d40] hover:border-[#2f3d57] text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          title="Trigger immediate sync with Blockstream"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
