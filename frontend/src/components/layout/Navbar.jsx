import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, RefreshCw, Layers, Menu, X, Wifi } from 'lucide-react';
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
      // Handled silently
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
    <header className="sticky top-0 z-40 bg-white border-b border-[#eaecef] px-4 lg:px-6 h-16 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#FCD535] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-[#181a20] text-base font-mono">₿</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#1e2329] flex items-center gap-1">
              Block<span className="text-[#b37400]">Watch</span>
            </span>
            <span className="text-[10px] text-[#707a8a] font-mono tracking-wider -mt-1 hidden sm:block">
              BITCOIN MONITORING
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Tip Height, Network, Sync Button, Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Online status indicator */}
        <div
          title={backendOnline ? 'Backend API Connected' : 'Backend Unreachable'}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f5f6f8] border border-[#eaecef] text-xs"
        >
          {backendOnline ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#03a66d]" />
              <span className="text-[#1e2329] font-mono text-[11px] font-medium">API Online</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-[#cf304a]" />
              <span className="text-[#cf304a] font-mono text-[11px] font-medium">API Offline</span>
            </>
          )}
        </div>

        {/* Tip Height Pill */}
        {tipHeight && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f5f6f8] border border-[#eaecef] text-xs font-mono text-[#707a8a]">
            <Layers className="w-3.5 h-3.5 text-[#b37400]" />
            <span>Tip:</span>
            <span className="text-[#1e2329] font-semibold">#{tipHeight.toLocaleString()}</span>
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FCD535] hover:bg-[#F0B90B] text-[#181a20] font-semibold text-xs tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
          title="Trigger immediate sync with Blockstream"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#181a20]' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
