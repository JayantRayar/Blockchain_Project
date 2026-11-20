import React, { useState, useEffect, useCallback } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Trash2,
  Eye,
  ExternalLink,
  Power,
  RefreshCw,
  Clock,
  ShieldCheck,
  Hash
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatBtc, formatSats, truncateAddress, truncateTxid, formatTimestamp, formatRelativeTime } from '../utils/formatters';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';
import LoadingSpinner, { TableSkeleton } from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Pagination from '../components/common/Pagination';

export const Wallets = () => {
  const { toast } = useToast();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [networkFilter, setNetworkFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Modal States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newNetwork, setNewNetwork] = useState('testnet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [walletToDelete, setWalletToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail Modal State
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletDetails, setWalletDetails] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Status update in-flight state
  const [togglingId, setTogglingId] = useState(null);

  const fetchWallets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getWallets({
        page,
        limit,
        network: networkFilter || undefined
      });
      if (res?.data) {
        setWallets(res.data);
      }
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch wallets list', 'Error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, networkFilter, toast]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  // Handle Wallet Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newAddress.trim()) {
      toast.error('Bitcoin address cannot be empty');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.registerWallet({
        address: newAddress.trim(),
        network: newNetwork
      });
      toast.success('Wallet registered! Initial sync has started in the background.', 'Wallet Added');
      setNewAddress('');
      setIsRegisterOpen(false);
      fetchWallets();
    } catch (err) {
      toast.error(err.message || 'Registration failed', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Toggle Active/Inactive
  const handleToggleStatus = async (wallet) => {
    setTogglingId(wallet.id);
    try {
      await api.updateWalletStatus(wallet.id, !wallet.isActive);
      toast.success(
        `Wallet ${truncateAddress(wallet.address)} is now ${!wallet.isActive ? 'ACTIVE' : 'PAUSED'}`,
        'Status Updated'
      );
      setWallets((prev) =>
        prev.map((w) => (w.id === wallet.id ? { ...w, isActive: !w.isActive } : w))
      );
    } catch (err) {
      toast.error(err.message || 'Failed to update wallet status', 'Error');
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Delete Wallet
  const handleDeleteConfirm = async () => {
    if (!walletToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteWallet(walletToDelete.id);
      toast.success(`Deleted wallet ${truncateAddress(walletToDelete.address)}`, 'Wallet Deleted');
      setWalletToDelete(null);
      fetchWallets();
    } catch (err) {
      toast.error(err.message || 'Failed to delete wallet', 'Delete Error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle View Wallet Details
  const handleViewDetails = async (wallet) => {
    setSelectedWallet(wallet);
    setDetailsLoading(true);
    try {
      const [infoRes, txsRes] = await Promise.all([
        api.getWalletInfo(wallet.address, wallet.network).catch(() => null),
        api.getWalletTransactions(wallet.address, { limit: 10, network: wallet.network }).catch(() => null)
      ]);

      if (infoRes?.data) setWalletDetails(infoRes.data);
      if (txsRes?.data) setWalletTransactions(txsRes.data);
    } catch (err) {
      toast.error('Could not load full wallet details', 'Details Error');
    } finally {
      setDetailsLoading(false);
    }
  };

  // Filtered by Search Term
  const filteredWallets = wallets.filter((w) =>
    w.address.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#182030]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Bitcoin Wallets
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Register, manage, and monitor Bitcoin addresses
          </p>
        </div>

        <button
          onClick={() => setIsRegisterOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#0b0e14] font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Wallet</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121721] p-3 rounded-xl border border-[#1e2638]">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search address (e.g. tb1q...)"
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Network Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400">Network:</span>
          <select
            value={networkFilter}
            onChange={(e) => {
              setNetworkFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="">All Networks</option>
            <option value="testnet">Testnet</option>
            <option value="mainnet">Mainnet</option>
          </select>

          <button
            onClick={fetchWallets}
            className="p-2 rounded-lg bg-[#161c28] border border-[#232d40] text-slate-300 hover:text-white hover:bg-[#1f293b] transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Wallets Table */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filteredWallets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e131c] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#182030]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Address</th>
                  <th className="px-5 py-3 font-semibold">Network</th>
                  <th className="px-5 py-3 font-semibold text-center">Transactions</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Registered</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030] font-mono">
                {filteredWallets.map((wallet) => (
                  <tr key={wallet.id} className="hover:bg-[#151c29] transition-colors">
                    {/* Address with copy */}
                    <td className="px-5 py-3.5 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleViewDetails(wallet)}
                          className="hover:text-amber-400 font-semibold transition-colors cursor-pointer text-left"
                          title="Click to view full wallet details"
                        >
                          {truncateAddress(wallet.address, 10, 8)}
                        </button>
                        <CopyButton text={wallet.address} />
                      </div>
                    </td>

                    {/* Network */}
                    <td className="px-5 py-3.5">
                      <Badge variant={wallet.network}>{wallet.network.toUpperCase()}</Badge>
                    </td>

                    {/* Transaction Count */}
                    <td className="px-5 py-3.5 text-center text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-[#182030] border border-[#242f44]">
                        {wallet.transactionCount ?? 0}
                      </span>
                    </td>

                    {/* Active/Inactive Status Toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(wallet)}
                        disabled={togglingId === wallet.id}
                        className="cursor-pointer group flex items-center gap-1.5"
                        title={wallet.isActive ? 'Click to Pause Monitoring' : 'Click to Activate Monitoring'}
                      >
                        <Badge variant={wallet.isActive ? 'active' : 'inactive'}>
                          <span className={`w-1.5 h-1.5 rounded-full ${wallet.isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                          {wallet.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </button>
                    </td>

                    {/* Registered Date */}
                    <td className="px-5 py-3.5 text-slate-400 font-sans text-xs">
                      {formatRelativeTime(wallet.createdAt)}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-3.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(wallet)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#1a2333] transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(wallet)}
                          disabled={togglingId === wallet.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-[#1a2333] transition-colors cursor-pointer"
                          title={wallet.isActive ? 'Pause Monitoring' : 'Resume Monitoring'}
                        >
                          <Power className={`w-4 h-4 ${wallet.isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        </button>

                        <button
                          onClick={() => setWalletToDelete(wallet)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-[#2b181b] transition-colors cursor-pointer"
                          title="Delete Wallet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No wallets found"
            description="No registered wallets match your current search or filter criteria."
            actionLabel="Register a Wallet"
            onAction={() => setIsRegisterOpen(true)}
          />
        )}

        {/* Pagination Footer */}
        <Pagination
          page={pagination.page}
          limit={pagination.limit}
          totalCount={pagination.totalCount}
          totalPages={pagination.totalPages}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Register Wallet Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title="Register Bitcoin Wallet"
        subtitle="Add a wallet address to monitor balances, UTXOs and real-time confirmations"
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
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Supports SegWit Bech32 (tb1/bc1), Legacy P2PKH (m/n/1), and Script P2SH (2/3).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Network
            </label>
            <select
              value={newNetwork}
              onChange={(e) => setNewNetwork(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
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

      {/* Wallet Details Modal */}
      <Modal
        isOpen={Boolean(selectedWallet)}
        onClose={() => {
          setSelectedWallet(null);
          setWalletDetails(null);
          setWalletTransactions([]);
        }}
        title="Wallet Inspection"
        subtitle="Detailed balances, on-chain state, and transaction history"
        maxWidth="max-w-2xl"
      >
        {detailsLoading ? (
          <LoadingSpinner size="md" message="Fetching live balance and history..." />
        ) : selectedWallet ? (
          <div className="space-y-5">
            {/* Address Banner */}
            <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Monitored Address
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs sm:text-sm text-amber-400 break-all select-all font-semibold">
                  {selectedWallet.address}
                </span>
                <CopyButton text={selectedWallet.address} />
              </div>
            </div>

            {/* Balances Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Confirmed</span>
                </div>
                <div className="font-mono text-sm font-bold text-white">
                  {formatBtc(walletDetails?.balance?.confirmed?.btc || 0)} BTC
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                  {formatSats(walletDetails?.balance?.confirmed?.satoshis || 0)} sats
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unconfirmed</span>
                </div>
                <div className="font-mono text-sm font-bold text-white">
                  {formatBtc(walletDetails?.balance?.unconfirmed?.btc || 0)} BTC
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                  {formatSats(walletDetails?.balance?.unconfirmed?.satoshis || 0)} sats
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Total Balance</span>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400">
                  {formatBtc(walletDetails?.balance?.total?.btc || 0)} BTC
                </div>
                <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                  {formatSats(walletDetails?.balance?.total?.satoshis || 0)} sats
                </div>
              </div>
            </div>

            {/* Wallet Transactions Sub-Table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Recent Transactions for this Address
              </h4>
              {walletTransactions.length > 0 ? (
                <div className="border border-[#222c40] rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0e131c] text-slate-400 text-[10px] uppercase font-mono sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Txid</th>
                        <th className="px-3 py-2">Direction</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-center">Confs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182030] font-mono">
                      {walletTransactions.map((tx) => (
                        <tr key={tx.id || tx.txid} className="hover:bg-[#151c29]">
                          <td className="px-3 py-2 text-slate-300">
                            <span title={tx.txid}>{truncateTxid(tx.txid, 6, 6)}</span>
                          </td>
                          <td className="px-3 py-2">
                            <Badge size="xs" variant={tx.direction === 'INCOMING' ? 'incoming' : 'outgoing'}>
                              {tx.direction}
                            </Badge>
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${
                            tx.direction === 'INCOMING' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {formatBtc(tx.amountBtc)} BTC
                          </td>
                          <td className="px-3 py-2 text-center text-slate-400">
                            {tx.confirmations || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No transactions recorded for this wallet yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(walletToDelete)}
        onClose={() => setWalletToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Wallet"
        message={`Are you sure you want to stop monitoring and delete wallet ${
          walletToDelete ? truncateAddress(walletToDelete.address) : ''
        }? All associated monitored transaction history for this wallet will also be deleted.`}
        confirmText="Delete Wallet"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Wallets;
