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
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatSats, truncateTxid } from '../utils/formatters';
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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#eaecef]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2329]">
            Blockchain & Node Connectivity
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-normal">
            Network tip height, Blockstream API endpoint status, and synchronization state
          </p>
        </div>

        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#f5f6f8] text-[#1e2329] border border-[#eaecef] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Connectivity & Node Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-white border border-[#eaecef] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707a8a]">
              Current Tip Block
            </span>
            <Layers className="w-4 h-4 text-[#b37400]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1e2329]">
            {statusData?.currentBlockHeight ? statusData.currentBlockHeight.toLocaleString() : 'N/A'}
          </div>
          <span className="text-xs text-[#707a8a] font-normal mt-1">
            Testnet Blockchain Tip
          </span>
        </div>

        <div className="p-5 rounded-lg bg-white border border-[#eaecef] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707a8a]">
              Network Protocol
            </span>
            <ShieldCheck className="w-4 h-4 text-[#2563eb]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#2563eb] uppercase">
            {statusData?.network || 'TESTNET'}
          </div>
          <span className="text-xs text-[#707a8a] font-normal mt-1">
            UTXO / SegWit / Bech32
          </span>
        </div>

        <div className="p-5 rounded-lg bg-white border border-[#eaecef] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707a8a]">
              Blockstream API
            </span>
            <Server className="w-4 h-4 text-[#03a66d]" />
          </div>
          <div className="text-sm font-bold text-[#03a66d] flex items-center gap-1.5">
            Operational
          </div>
          <span className="text-xs text-[#707a8a] font-mono mt-1 truncate" title={statusData?.apiUrl}>
            {statusData?.apiUrl || 'blockstream.info/testnet/api'}
          </span>
        </div>

        <div className="p-5 rounded-lg bg-white border border-[#eaecef] flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#707a8a]">
              Daemon Polling
            </span>
            <Clock className="w-4 h-4 text-[#b37400]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#1e2329]">
            {healthData?.monitoringJob?.intervalSeconds || 30}s
          </div>
          <span className="text-xs text-[#707a8a] font-normal mt-1">
            Concurrency Lock Active
          </span>
        </div>
      </div>

      {/* Manual Sync Control Panel */}
      <div className="bg-white border border-[#eaecef] rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-sm font-bold text-[#1e2329]">Manual Blockchain Synchronization</h2>
          <p className="text-xs text-[#707a8a] mt-0.5 font-normal">
            Force an immediate scan of all active registered Bitcoin wallets to fetch new transactions and update confirmations.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#FCD535] hover:bg-[#F0B90B] text-[#181a20] font-bold text-xs tracking-wider transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'SYNCING ON-CHAIN...' : 'SYNC ALL WALLETS NOW'}</span>
        </button>
      </div>

      {/* Sync Execution Output */}
      {syncResults && (
        <div className="bg-white border border-[#eaecef] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] animate-in fade-in">
          <h3 className="text-xs font-bold text-[#1e2329] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#03a66d]" />
            Last Sync Cycle Results
          </h3>
          <div className="space-y-2">
            {syncResults.length > 0 ? (
              syncResults.map((item, idx) => (
                <div key={idx} className="p-3 rounded bg-[#f8f9fa] border border-[#eaecef] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#1e2329] font-bold">{item.wallet}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[#03a66d] font-bold">+{item.added || 0} added</span>
                    <span className="text-[#b37400] font-bold">{item.updated || 0} updated</span>
                    <Badge variant={item.success ? 'confirmed' : 'pending'}>
                      {item.success ? 'Success' : 'Error'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#707a8a] italic font-normal">No active wallets were registered to synchronize.</p>
            )}
          </div>
        </div>
      )}

      {/* Direct On-Chain Transaction Lookup Tool */}
      <div className="bg-white border border-[#eaecef] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <h2 className="text-sm font-bold text-[#1e2329]">Direct On-Chain Transaction Lookup</h2>
          <p className="text-xs text-[#707a8a] mt-0.5 font-normal">
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
              placeholder="Paste 64-character Bitcoin txid hash..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded bg-[#f8f9fa] border border-[#eaecef] text-[#1e2329] text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#F0B90B] focus:bg-white transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={txLookupLoading}
            className="px-5 py-2.5 rounded bg-[#1e2329] hover:bg-[#2b313a] text-white font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {txLookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Lookup Transaction</span>
          </button>
        </form>

        {txLookupData && (
          <div className="p-4 rounded bg-[#f8f9fa] border border-[#eaecef] space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-[#eaecef]">
              <span className="text-[#707a8a] font-sans font-normal">Transaction Hash:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[#1e2329] font-bold truncate max-w-xs">{txLookupData.txid}</span>
                <CopyButton text={txLookupData.txid} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
              <div>
                <span className="text-[#707a8a] text-xs block font-sans font-normal">Status</span>
                <Badge variant={txLookupData.isConfirmed ? 'confirmed' : 'pending'}>
                  {txLookupData.isConfirmed ? 'Confirmed' : 'Pending'}
                </Badge>
              </div>

              <div>
                <span className="text-[#707a8a] text-xs block font-sans font-normal">Confirmations</span>
                <span className="text-[#03a66d] font-bold">{txLookupData.confirmations || 0}</span>
              </div>

              <div>
                <span className="text-[#707a8a] text-xs block font-sans font-normal">Block Height</span>
                <span className="text-[#1e2329] font-bold">
                  {txLookupData.blockHeight ? txLookupData.blockHeight : 'Mempool'}
                </span>
              </div>

              <div>
                <span className="text-[#707a8a] text-xs block font-sans font-normal">Fee</span>
                <span className="text-[#1e2329] font-bold">{formatSats(txLookupData.feeSatoshis)} sats</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`https://blockstream.info/testnet/tx/${txLookupData.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#b37400] hover:text-[#8a5900] font-sans font-bold"
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
