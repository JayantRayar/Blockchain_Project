import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Menu, X } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../common/Badge';

export const Navbar = ({ onToggleMobileSidebar, isMobileSidebarOpen }) => {
  const { toast } = useToast();
  const [tipHeight, setTipHeight] = useState(null);
  const [network, setNetwork] = useState('testnet');
  const [isSyncing, setIsSyncing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(true);

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
      // Silent in background
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
      toast.success(`Synchronized ${count} wallet(s) successfully`, 'Sync Complete');
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to trigger blockchain synchronization', 'Sync Failed');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#eaecef] px-4 lg:px-6 h-16 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-[#FCD535] flex items-center justify-center font-bold text-[#181a20] text-sm font-sans tracking-tight">
            BTC
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-[#1e2329] font-sans">
              BlockWatch
            </span>
            <span className="text-[11px] text-[#707a8a] font-normal leading-tight hidden sm:block">
              Bitcoin Monitoring Terminal
            </span>
          </div>
        </Link>
      </div>

      {/* Right: Tip Height, Network, Sync Button, Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Backend Online status indicator */}
        <div className="hidden md:flex items-center">
          {backendOnline ? (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              API Connected
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
              API Offline
            </span>
          )}
        </div>

        {/* Tip Height */}
        {tipHeight && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f5f6f8] border border-[#eaecef] text-xs">
            <span className="text-[#707a8a]">Block:</span>
            <span className="font-mono font-bold text-[#1e2329]">
              {tipHeight.toLocaleString()}
            </span>
          </div>
        )}

        {/* Network Badge */}
        <Badge variant={network === 'mainnet' ? 'mainnet' : 'testnet'} size="sm">
          {network.toUpperCase()}
        </Badge>

        {/* Manual Sync Trigger */}
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FCD535] hover:bg-[#F0B90B] text-[#181a20] font-bold text-xs tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
          title="Trigger immediate sync with Blockstream"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
