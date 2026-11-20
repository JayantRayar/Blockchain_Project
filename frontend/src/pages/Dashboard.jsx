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
  ShieldCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
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
    } catch {
      toast.error('Failed to load dashboard data. Check backend connection.', 'Dashboard Error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(() => loadDashboardData(true), 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

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
      toast.success('Wallet registered successfully. Initial sync has started.', 'Wallet Added');
      setNewAddress('');
      setIsRegisterOpen(false);
      loadDashboardData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to register wallet', 'Registration Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

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
    return <LoadingSpinner size="lg" message="Loading Dashboard..." className="min-h-[50vh]" />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#eaecef]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2329]">
            Dashboard Overview
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-normal">
            Real-time Bitcoin wallet balances and transaction accounting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#f5f6f8] text-[#1e2329] border border-[#eaecef] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#b37400]' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#FCD535] hover:bg-[#F0B90B] text-[#181a20] font-bold text-xs tracking-wide transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Wallet</span>
          </button>
        </div>
      </div>

      {/* Metrics Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monitored Wallets"
          value={wallets.length}
          subValue={`Active: ${activeWalletsCount} | Paused: ${wallets.length - activeWalletsCount}`}
          icon={Wallet}
          badge={<Badge variant="testnet">TESTNET</Badge>}
        />

        <StatCard
          title="Total Balance"
          value={`${formatBtc(balanceSummary.totalBtc)} BTC`}
          subValue={`${formatSats(balanceSummary.totalSats)} sats`}
          icon={TrendingUp}
        />

        <StatCard
          title="Confirmed Balance"
          value={`${formatBtc(balanceSummary.confirmedBtc)} BTC`}
          subValue={`${formatSats(balanceSummary.confirmedSats)} sats`}
          icon={ShieldCheck}
          badge={<Badge variant="confirmed">Confirmed</Badge>}
        />

        <StatCard
          title="Unconfirmed Balance"
          value={`${formatBtc(balanceSummary.unconfirmedBtc)} BTC`}
          subValue={`${formatSats(balanceSummary.unconfirmedSats)} sats`}
          icon={Clock}
          badge={<Badge variant={balanceSummary.unconfirmedBtc > 0 ? 'pending' : 'default'}>Mempool</Badge>}
        />
      </div>

      {/* Chart & Node Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Volume Chart */}
        <div className="lg:col-span-2 bg-white border border-[#eaecef] rounded-lg p-5 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#1e2329]">Transaction Activity Flow</h2>
              <p className="text-xs text-[#707a8a] font-normal">Recent transaction values in Bitcoin (BTC)</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs text-[#b37400] hover:text-[#8a5900] flex items-center gap-1 font-bold transition-colors"
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
                      <stop offset="5%" stopColor="#03a66d" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#03a66d" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" vertical={false} />
                  <XAxis dataKey="index" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#eaecef',
                      borderRadius: '6px',
                      color: '#1e2329',
                      fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}
                    formatter={(value) => [`${value} BTC`, 'Amount']}
                  />
                  <Area
                    type="monotone"
                    dataKey="amountBtc"
                    stroke="#03a66d"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#btcVolumeGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#707a8a] font-normal">
                No recent transaction data to plot yet. Register a wallet to start tracking.
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Node & System Status Card */}
        <div className="bg-white border border-[#eaecef] rounded-lg p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1e2329] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#b37400]" />
                Network State
              </h2>
              <Badge variant="testnet">Testnet</Badge>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-[#f1f3f5]">
                <span className="text-[#707a8a] font-sans font-normal">Current Tip Block:</span>
                <span className="text-[#1e2329] font-bold">
                  {blockchainInfo?.currentBlockHeight ? blockchainInfo.currentBlockHeight.toLocaleString() : 'Connecting...'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f1f3f5]">
                <span className="text-[#707a8a] font-sans font-normal">Daemon Sync Job:</span>
                <span className="text-[#03a66d] font-bold">
                  {healthInfo?.monitoringJob?.intervalSeconds ? `Every ${healthInfo.monitoringJob.intervalSeconds}s` : 'Active (30s)'}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f1f3f5]">
                <span className="text-[#707a8a] font-sans font-normal">Data Provider:</span>
                <span className="text-[#1e2329] font-sans font-medium">Blockstream API</span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#f1f3f5]">
                <span className="text-[#707a8a] font-sans font-normal">Accounting Model:</span>
                <span className="text-[#1e2329] font-sans font-medium">UTXO Model</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#f1f3f5]">
            <Link
              to="/status"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-[#f5f6f8] hover:bg-[#eaecef] text-[#1e2329] text-xs font-semibold transition-colors"
            >
              <span>Inspect Network Status</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white border border-[#eaecef] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between p-5 border-b border-[#eaecef]">
          <div>
            <h2 className="text-sm font-bold text-[#1e2329]">Recent Transactions</h2>
            <p className="text-xs text-[#707a8a] font-normal">Latest activity observed across registered wallets</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs text-[#b37400] hover:text-[#8a5900] font-bold flex items-center gap-1 transition-colors"
          >
            <span>All Transactions</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {recentTxs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] text-[#707a8a] uppercase text-xs font-bold tracking-wider border-b border-[#eaecef]">
                <tr>
                  <th className="px-5 py-3">Txid</th>
                  <th className="px-5 py-3">Direction</th>
                  <th className="px-5 py-3 text-right">Amount (BTC)</th>
                  <th className="px-5 py-3 text-right">Satoshis</th>
                  <th className="px-5 py-3 text-center">Confirmations</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5] font-mono">
                {recentTxs.map((tx) => (
                  <tr key={tx.id || tx.txid} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-5 py-3.5 text-[#1e2329] flex items-center gap-1.5">
                      <span title={tx.txid} className="font-bold">{truncateTxid(tx.txid)}</span>
                      <CopyButton text={tx.txid} />
                    </td>
                    <td className="px-5 py-3.5 font-sans">
                      <Badge variant={tx.direction === 'INCOMING' ? 'incoming' : 'outgoing'}>
                        {tx.direction}
                      </Badge>
                    </td>
                    <td className={`px-5 py-3.5 text-right font-bold ${
                      tx.direction === 'INCOMING' ? 'text-[#03a66d]' : 'text-[#cf304a]'
                    }`}>
                      {formatBtc(tx.amountBtc)} BTC
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#707a8a]">
                      {formatSats(tx.amountSatoshis)} sats
                    </td>
                    <td className="px-5 py-3.5 text-center font-sans">
                      <Badge variant={tx.status === 'CONFIRMED' ? 'confirmed' : 'pending'}>
                        {tx.confirmations} confs
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-[#707a8a] font-sans text-xs">
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
            <label className="block text-xs font-bold text-[#1e2329] uppercase tracking-wider mb-1.5">
              Bitcoin Address
            </label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Enter Bitcoin address (e.g. tb1q...)"
              className="w-full px-3.5 py-2.5 rounded bg-[#f8f9fa] border border-[#eaecef] text-[#1e2329] text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#F0B90B] focus:bg-white transition-colors"
              required
            />
            <p className="text-xs text-[#707a8a] mt-1 font-normal">
              Supports Testnet (tb1, m, n, 2) and Mainnet (bc1, 1, 3) addresses.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1e2329] uppercase tracking-wider mb-1.5">
              Network
            </label>
            <select
              value={newNetwork}
              onChange={(e) => setNewNetwork(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded bg-[#f8f9fa] border border-[#eaecef] text-[#1e2329] text-xs font-sans focus:outline-none focus:border-[#F0B90B] focus:bg-white transition-colors cursor-pointer"
            >
              <option value="testnet">Testnet (Default)</option>
              <option value="mainnet">Mainnet</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#eaecef]">
            <button
              type="button"
              onClick={() => setIsRegisterOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded text-slate-700 hover:bg-[#f5f6f8] bg-white border border-[#eaecef] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold rounded bg-[#FCD535] hover:bg-[#F0B90B] text-[#181a20] transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
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
