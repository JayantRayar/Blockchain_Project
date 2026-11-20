import React, { useState, useEffect } from 'react';
import {
  Activity,
  Layers,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  Server,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatBtc, formatSats, truncateTxid, truncateAddress, formatTimestamp } from '../utils/formatters';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';
import LoadingSpinner from '../components/common/LoadingSpinner';

export const BlockchainStatus = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState(null);

  // Live Tx Lookup Tool
  const [searchTxid, setSearchTxid] = useState('');
  const [txLookupData, setTxLookupData] = useState(null);
  const [txLookupLoading, setTxLookupLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const [blockRes, healthRes] = await Promise.allSettled([
        api.getBlockchainStatus(),
        api.getHealth()
      ]);

      if (blockRes.status === 'fulfilled' && blockRes.value?.data) {
        setStatusData(blockRes.value.data);
      }
      if (healthRes.status === 'fulfilled') {
        setHealthData(healthRes.value);
      }
    } catch {
      toast.error('Failed to connect to backend service', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Trigger manual sync
  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.triggerSync();
      setSyncResults(res?.data || []);
      toast.success('Sync cycle completed successfully across active wallets', 'Synced');
      fetchStatus();
    } catch (err) {
      toast.error(err.message || 'Sync failed', 'Error');
    } finally {
      setIsSyncing(false);
    }
  };

  // On-Chain Tx Lookup
  const handleTxLookup = async (e) => {
    e.preventDefault();
    if (!searchTxid.trim()) return;
    setTxLookupLoading(true);
    setTxLookupData(null);
    try {
      const res = await api.getBlockchainTransaction(searchTxid.trim());
      if (res?.data) {
        setTxLookupData(res.data);
        toast.success('Transaction retrieved from Blockstream API', 'Found');
      }
    } catch (err) {
      toast.error(err.message || 'Transaction not found on Bitcoin network', 'Lookup Error');
    } finally {
      setTxLookupLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Querying Bitcoin blockchain status..." className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#182030]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Blockchain & Node Connectivity
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Network tip height, Blockstream API endpoint status, and synchronization state
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a26] hover:bg-[#1a2333] text-slate-300 border border-[#222c40] text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connectivity & Node Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tip Height */}
        <div className="p-5 rounded-xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current Tip Block
            </span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {statusData?.currentBlockHeight ? `#${statusData.currentBlockHeight.toLocaleString()}` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1">
            Testnet Blockchain Tip
          </span>
        </div>

        {/* Network & Protocol */}
        <div className="p-5 rounded-xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Network Protocol
            </span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 uppercase">
            {statusData?.network || 'TESTNET'}
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1">
            UTXO / SegWit / Bech32
          </span>
        </div>

        {/* API Endpoint */}
        <div className="p-5 rounded-xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Blockstream API
            </span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Operational
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1 truncate" title={statusData?.apiUrl}>
            {statusData?.apiUrl || 'blockstream.info/testnet/api'}
          </span>
        </div>

        {/* Scheduled Daemon */}
        <div className="p-5 rounded-xl bg-[#121721] border border-[#1e2638] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cron Polling
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {healthData?.monitoringJob?.intervalSeconds || 30}s
          </div>
          <span className="text-[11px] text-slate-400 font-mono mt-1">
            Concurrency Guard Active
          </span>
        </div>
      </div>

      {/* Manual Sync Control Panel */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Manual Blockchain Synchronization</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Force an immediate scan of all active registered Bitcoin wallets to fetch new transactions and update confirmations.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0b0e14] font-bold text-xs tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'SYNCING ON-CHAIN...' : 'SYNC ALL WALLETS NOW'}</span>
        </button>
      </div>

      {/* Sync Execution Output (if run) */}
      {syncResults && (
        <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 animate-in fade-in">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Last Sync Cycle Results
          </h3>
          <div className="space-y-2">
            {syncResults.length > 0 ? (
              syncResults.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#141a26] border border-[#222c40] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{item.wallet}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">+{item.added || 0} added</span>
                    <span className="text-amber-400">~{item.updated || 0} updated</span>
                    <Badge variant={item.success ? 'confirmed' : 'pending'}>
                      {item.success ? 'Success' : 'Error'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No active wallets were registered to synchronize.</p>
            )}
          </div>
        </div>
      )}

      {/* Direct On-Chain Transaction Lookup Tool */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Direct On-Chain Transaction Lookup</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Query any transaction directly from the Bitcoin network by transaction hash (txid).
          </p>
        </div>

        <form onSubmit={handleTxLookup} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTxid}
              onChange={(e) => setSearchTxid(e.target.value)}
              placeholder="Paste 64-character Bitcoin txid (e.g. f4184fc596...)"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={txLookupLoading}
            className="px-5 py-2.5 rounded-xl bg-[#182030] hover:bg-[#202b40] text-amber-400 font-semibold text-xs tracking-wide transition-colors border border-[#283650] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {txLookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup Tx</span>
          </button>
        </form>

        {/* Lookup Result Box */}
        {txLookupData && (
          <div className="p-4 rounded-xl bg-[#141a26] border border-[#222c40] space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#1b2333]">
              <span className="text-slate-400 font-sans">Transaction Hash:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-bold truncate max-w-xs">{txLookupData.txid}</span>
                <CopyButton text={txLookupData.txid} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
              <div>
                <span className="text-slate-400 text-[11px] block">Status</span>
                <Badge variant={txLookupData.isConfirmed ? 'confirmed' : 'pending'}>
                  {txLookupData.isConfirmed ? 'Confirmed' : 'Pending'}
                </Badge>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Confirmations</span>
                <span className="text-emerald-400 font-bold">{txLookupData.confirmations || 0}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Block Height</span>
                <span className="text-white font-bold">
                  {txLookupData.blockHeight ? `#${txLookupData.blockHeight}` : 'Mempool'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block">Fee</span>
                <span className="text-white font-bold">{formatSats(txLookupData.feeSatoshis)} sats</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`https://blockstream.info/testnet/tx/${txLookupData.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-sans"
              >
                <span>Inspect in Blockstream Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainStatus;
