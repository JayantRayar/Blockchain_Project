import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowLeftRight,
  TrendingUp,
  Clock,
  Layers,
  RefreshCw,
  Plus,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatBtc, formatSats, truncateTxid, formatRelativeTime } from '../utils/formatters';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';

export const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [recentTxs, setRecentTxs] = useState([]);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [healthInfo, setHealthInfo] = useState(null);

  // Quick Wallet Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newNetwork, setNewNetwork] = useState('testnet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Aggregated Balance Data
  const [balanceSummary, setBalanceSummary] = useState({
    totalBtc: 0,
    totalSats: 0n,
    confirmedBtc: 0,
    confirmedSats: 0n,
    unconfirmedBtc: 0,
    unconfirmedSats: 0n
  });

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch wallets, recent transactions, health, and blockchain status in parallel
      const [walletsRes, txsRes, healthRes, blockRes] = await Promise.allSettled([
        api.getWallets({ limit: 50 }),
        api.getAllTransactions({ limit: 10 }),
        api.getHealth(),
        api.getBlockchainStatus()
      ]);

      const walletList = walletsRes.status === 'fulfilled' && Array.isArray(walletsRes.value?.data)
        ? walletsRes.value.data
        : [];
      setWallets(walletList);

      const txList = txsRes.status === 'fulfilled' && Array.isArray(txsRes.value?.data)
        ? txsRes.value.data
        : [];
      setRecentTxs(txList);

      if (healthRes.status === 'fulfilled') setHealthInfo(healthRes.value);
      if (blockRes.status === 'fulfilled' && blockRes.value?.data) {
        setBlockchainInfo(blockRes.value.data);
      }

      // 2. Aggregate wallet balances if wallets exist
      if (walletList.length > 0) {
        const balancePromises = walletList.slice(0, 15).map((w) =>
          api.getWalletBalance(w.address, w.network).catch(() => null)
        );
        const balanceResults = await Promise.all(balancePromises);

        let totSats = 0n;
        let confSats = 0n;
        let unconfSats = 0n;

        balanceResults.forEach((b) => {
          if (b?.data) {
            confSats += BigInt(b.data.confirmed?.satoshis || '0');
            unconfSats += BigInt(b.data.unconfirmed?.satoshis || '0');
            totSats += BigInt(b.data.total?.satoshis || '0');
          }
        });

        setBalanceSummary({
          totalBtc: Number(totSats) / 100000000,
          totalSats: totSats,
          confirmedBtc: Number(confSats) / 100000000,
          confirmedSats: confSats,
          unconfirmedBtc: Number(unconfSats) / 100000000,
          unconfirmedSats: unconfSats
        });
      } else {
        setBalanceSummary({
          totalBtc: 0,
          totalSats: 0n,
          confirmedBtc: 0,
          confirmedSats: 0n,
          unconfirmedBtc: 0,
          unconfirmedSats: 0n
        });
      }
    } catch (err) {
      toast.error('Failed to load dashboard data. Check backend connection.', 'Dashboard Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Handle Quick Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newAddress.trim()) {
      toast.error('Please enter a valid Bitcoin address');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.registerWallet({
        address: newAddress.trim(),
        network: newNetwork
      });
      toast.success('Wallet registered successfully! Syncing transactions...', 'Wallet Added');
      setNewAddress('');
      setIsRegisterOpen(false);
      loadDashboardData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to register wallet', 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare chart data from recent transactions
  const chartData = React.useMemo(() => {
    if (!recentTxs.length) return [];
    return [...recentTxs]
      .reverse()
      .map((tx, idx) => ({
        index: `#${idx + 1}`,
        amountBtc: tx.amountBtc || 0,
        direction: tx.direction,
        confirmations: tx.confirmations || 0,
        txid: tx.txid
      }));
  }, [recentTxs]);

  const activeWalletsCount = wallets.filter((w) => w.isActive).length;

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading BlockWatch Dashboard..." className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#182030]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Bitcoin UTXO tracking & monitoring statistics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a26] hover:bg-[#1a2333] text-slate-300 border border-[#222c40] text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#0b0e14] font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Wallet</span>
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Monitored Wallets"
          value={wallets.length}
          subValue={`${activeWalletsCount} active • ${wallets.length - activeWalletsCount} paused`}
          icon={Wallet}
          badge={<Badge variant="testnet">TESTNET</Badge>}
        />

        <StatCard
          title="Total Monitored Balance"
          value={`${formatBtc(balanceSummary.totalBtc)} BTC`}
          subValue={`${formatSats(balanceSummary.totalSats)} satoshis`}
          icon={TrendingUp}
        />

        <StatCard
          title="Confirmed Balance"
          value={`${formatBtc(balanceSummary.confirmedBtc)} BTC`}
          subValue={`${formatSats(balanceSummary.confirmedSats)} satoshis`}
          icon={ShieldCheck}
          badge={<Badge variant="confirmed">Confirmed</Badge>}
        />

        <StatCard
          title="Unconfirmed (Mempool)"
          value={`${formatBtc(balanceSummary.unconfirmedBtc)} BTC`}
          subValue={`${formatSats(balanceSummary.unconfirmedSats)} satoshis`}
          icon={Clock}
          badge={<Badge variant={balanceSummary.unconfirmedBtc > 0 ? 'pending' : 'default'}>Pending</Badge>}
        />
      </div>

      {/* Chart & Node Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume Chart */}
        <div className="lg:col-span-2 bg-[#121721] border border-[#1e2638] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Recent Transaction Flow</h2>
              <p className="text-[11px] text-slate-400">Activity volume per transaction (BTC)</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
            >
              <span>View Ledger</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="h-56 w-full mt-2">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="btcVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="index" stroke="#475569" fontSize={11} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0c1017',
                      borderColor: '#1e2638',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value} BTC`, 'Amount']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amountBtc"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#btcVolumeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recent transaction data to plot yet. Register a wallet to start tracking.
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Node & System Status Card */}
        <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                Network State
              </h2>
              <Badge variant="testnet">Testnet</Badge>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-[#182030]">
                <span className="text-slate-400">Current Tip Block:</span>
                <span className="text-white font-semibold">
                  {blockchainInfo?.currentBlockHeight ? `#${blockchainInfo.currentBlockHeight.toLocaleString()}` : 'Connecting...'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#182030]">
                <span className="text-slate-400">Auto Monitoring Job:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {healthInfo?.monitoringJob?.intervalSeconds ? `Every ${healthInfo.monitoringJob.intervalSeconds}s` : 'Active (30s)'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#182030]">
                <span className="text-slate-400">Data Provider:</span>
                <span className="text-slate-300">Blockstream API</span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#182030]">
                <span className="text-slate-400">Model:</span>
                <span className="text-slate-300">UTXO-based</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#182030]">
            <Link
              to="/status"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#182030] hover:bg-[#1e283d] text-slate-200 text-xs font-medium transition-colors"
            >
              <span>Inspect Blockchain Status</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[#182030]">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
            <p className="text-[11px] text-slate-400">Latest activity observed across registered wallets</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>All Transactions</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {recentTxs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e131c] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#182030]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Txid</th>
                  <th className="px-5 py-3 font-semibold">Direction</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount (BTC)</th>
                  <th className="px-5 py-3 font-semibold text-right">Satoshis</th>
                  <th className="px-5 py-3 font-semibold">Confirmations</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030] font-mono">
                {recentTxs.map((tx) => (
                  <tr key={tx.id || tx.txid} className="hover:bg-[#151c29] transition-colors">
                    <td className="px-5 py-3.5 text-slate-200 flex items-center gap-1.5">
                      <span title={tx.txid}>{truncateTxid(tx.txid)}</span>
                      <CopyButton text={tx.txid} />
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={tx.direction === 'INCOMING' ? 'incoming' : 'outgoing'}>
                        {tx.direction}
                      </Badge>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-semibold ${
                      tx.direction === 'INCOMING' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.direction === 'INCOMING' ? '+' : '-'}{formatBtc(tx.amountBtc)} BTC
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400">
                      {formatSats(tx.amountSatoshis)} sats
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={tx.status === 'CONFIRMED' ? 'confirmed' : 'pending'}>
                        {tx.confirmations} confs
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 font-sans text-xs">
                      {formatRelativeTime(tx.transactionTimestamp || tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions tracked yet"
            description="Transactions will appear here automatically once wallets are registered and scanned."
            actionLabel="Register First Wallet"
            onAction={() => setIsRegisterOpen(true)}
          />
        )}
      </div>

      {/* Quick Register Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Bitcoin Wallet"
        subtitle="Add a wallet address to monitor transactions, balance, and UTXOs"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Bitcoin Address
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="e.g. tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Supports Testnet (tb1, m, n, 2) and Mainnet (bc1, 1, 3) addresses.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Network
            </label>
            <select
              value={newNetwork}
              onChange={(e) => setNewNetwork(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
            >
              <option value="testnet">Testnet (Default)</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1a2232]">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-300 hover:text-white bg-[#141a26] border border-[#222c40] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#0b0e14] transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Wallet'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
