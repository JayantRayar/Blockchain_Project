import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Eye,
  Layers,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatBtc, formatSats, truncateTxid, truncateAddress, formatTimestamp, formatRelativeTime } from '../utils/formatters';
import Badge from '../components/common/Badge';
import CopyButton from '../components/common/CopyButton';
import LoadingSpinner, { TableSkeleton } from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';

export const Transactions = () => {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Transaction Inspection Modal
  const [selectedTxid, setSelectedTxid] = useState(null);
  const [inspectData, setInspectData] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAllTransactions({
        page,
        limit,
        direction: directionFilter || undefined,
        status: statusFilter || undefined,
        txid: searchTerm.trim() || undefined
      });

      if (res?.data) {
        setTransactions(res.data);
      }
      if (res?.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch transaction ledger', 'Error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, directionFilter, statusFilter, searchTerm, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  // Inspect Transaction Modal
  const handleInspect = async (txid) => {
    setSelectedTxid(txid);
    setInspectLoading(true);
    try {
      const res = await api.getMonitoredTransaction(txid);
      if (res?.data) {
        setInspectData(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Could not fetch transaction details', 'Inspection Error');
    } finally {
      setInspectLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#182030]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time monitored Bitcoin incoming and outgoing transactions
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141a26] hover:bg-[#1a2333] text-slate-300 border border-[#222c40] text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-[#121721] p-3 rounded-xl border border-[#1e2638]">
        {/* Search Txid */}
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by 64-char Txid hash..."
            className="w-full pl-9 pr-14 py-1.5 rounded-lg bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchTerm && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-emerald-500 text-[#0b0e14] text-[10px] font-bold uppercase cursor-pointer"
            >
              Go
            </button>
          )}
        </form>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Direction Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Direction:</span>
            <select
              value={directionFilter}
              onChange={(e) => {
                setDirectionFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All</option>
              <option value="INCOMING">Incoming</option>
              <option value="OUTGOING">Outgoing</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-[#161c28] border border-[#232d40] text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="">All</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e131c] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#182030]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Txid</th>
                  <th className="px-5 py-3 font-semibold">Direction</th>
                  <th className="px-5 py-3 font-semibold text-right">Amount (BTC)</th>
                  <th className="px-5 py-3 font-semibold text-right">Satoshis</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Fee</th>
                  <th className="px-5 py-3 font-semibold">Timestamp</th>
                  <th className="px-5 py-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182030] font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.txid} className="hover:bg-[#151c29] transition-colors">
                    {/* Txid */}
                    <td className="px-5 py-3.5 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleInspect(tx.txid)}
                          className="hover:text-amber-400 font-semibold transition-colors cursor-pointer text-left"
                          title="Click to inspect UTXOs & on-chain data"
                        >
                          {truncateTxid(tx.txid, 8, 8)}
                        </button>
                        <CopyButton text={tx.txid} />
                      </div>
                    </td>

                    {/* Direction */}
                    <td className="px-5 py-3.5">
                      <Badge variant={tx.direction === 'INCOMING' ? 'incoming' : 'outgoing'}>
                        {tx.direction === 'INCOMING' ? (
                          <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-rose-400" />
                        )}
                        {tx.direction}
                      </Badge>
                    </td>

                    {/* Amount BTC */}
                    <td className={`px-5 py-3.5 text-right font-semibold ${
                      tx.direction === 'INCOMING' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.direction === 'INCOMING' ? '+' : '-'}{formatBtc(tx.amountBtc)} BTC
                    </td>

                    {/* Amount Satoshis */}
                    <td className="px-5 py-3.5 text-right text-slate-400">
                      {formatSats(tx.amountSatoshis)} sats
                    </td>

                    {/* Status & Confirmations */}
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={tx.status === 'CONFIRMED' ? 'confirmed' : 'pending'}>
                        {tx.status === 'CONFIRMED' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            {tx.confirmations} confs
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Mempool (0)
                          </>
                        )}
                      </Badge>
                    </td>

                    {/* Fee */}
                    <td className="px-5 py-3.5 text-right text-slate-400">
                      {tx.feeSatoshis ? `${formatSats(tx.feeSatoshis)} sats` : '0 sats'}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 text-slate-400 font-sans text-xs">
                      {formatRelativeTime(tx.transactionTimestamp || tx.createdAt)}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleInspect(tx.txid)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-[#1a2333] transition-colors cursor-pointer"
                        title="Inspect transaction"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions found"
            description="No transactions match your search filter or no wallet activity has been tracked yet."
          />
        )}

        {/* Pagination */}
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

      {/* Transaction Details Modal */}
      <Modal
        isOpen={Boolean(selectedTxid)}
        onClose={() => {
          setSelectedTxid(null);
          setInspectData(null);
        }}
        title="Transaction Details & UTXO Breakdown"
        subtitle="Live on-chain analysis from Blockstream API"
        maxWidth="max-w-2xl"
      >
        {inspectLoading ? (
          <LoadingSpinner size="md" message="Inspecting transaction inputs & outputs..." />
        ) : inspectData ? (
          <div className="space-y-5 font-sans">
            {/* Txid Header */}
            <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Transaction ID (Txid)
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-amber-400 break-all select-all font-semibold">
                  {inspectData.txid}
                </span>
                <CopyButton text={inspectData.txid} />
              </div>
            </div>

            {/* Quick Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#141a26] border border-[#222c40]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Block Height</span>
                <span className="text-white font-bold">
                  {inspectData.liveData?.status?.block_height ? `#${inspectData.liveData.status.block_height}` : 'Pending'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#141a26] border border-[#222c40]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Confirmations</span>
                <span className="text-emerald-400 font-bold">
                  {inspectData.currentBlockHeight && inspectData.liveData?.status?.block_height
                    ? Math.max(1, inspectData.currentBlockHeight - inspectData.liveData.status.block_height + 1)
                    : 0}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#141a26] border border-[#222c40]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Network Fee</span>
                <span className="text-white font-bold">
                  {inspectData.liveData?.fee ? `${formatSats(inspectData.liveData.fee)} sats` : '0 sats'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#141a26] border border-[#222c40]">
                <span className="text-[10px] text-slate-400 block mb-0.5">Size / Weight</span>
                <span className="text-slate-300">
                  {inspectData.liveData?.size || 0} B / {inspectData.liveData?.weight || 0} WU
                </span>
              </div>
            </div>

            {/* Inputs & Outputs Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inputs (vin) */}
              <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
                <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Inputs ({inspectData.liveData?.vin?.length || 0})</span>
                  <span className="text-[10px] text-slate-400">Previous Outputs Spent</span>
                </h4>
                <div className="space-y-2 max-h-44 overflow-y-auto font-mono text-xs">
                  {inspectData.liveData?.vin?.map((input, idx) => (
                    <div key={idx} className="p-2 rounded bg-[#0f141f] border border-[#1b2333] flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[150px]" title={input.prevout?.scriptpubkey_address}>
                        {truncateAddress(input.prevout?.scriptpubkey_address || 'Coinbase', 6, 4)}
                      </span>
                      <span className="text-rose-400 font-semibold">
                        {formatSats(input.prevout?.value || 0)} sats
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outputs (vout) */}
              <div className="p-3.5 rounded-xl bg-[#141a26] border border-[#222c40]">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Outputs ({inspectData.liveData?.vout?.length || 0})</span>
                  <span className="text-[10px] text-slate-400">Created UTXOs</span>
                </h4>
                <div className="space-y-2 max-h-44 overflow-y-auto font-mono text-xs">
                  {inspectData.liveData?.vout?.map((output, idx) => (
                    <div key={idx} className="p-2 rounded bg-[#0f141f] border border-[#1b2333] flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 truncate max-w-[150px]" title={output.scriptpubkey_address}>
                        {truncateAddress(output.scriptpubkey_address || 'OP_RETURN / Script', 6, 4)}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {formatSats(output.value || 0)} sats
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Blockstream Explorer Link */}
            <div className="pt-2 flex justify-end">
              <a
                href={`https://blockstream.info/testnet/tx/${inspectData.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182030] hover:bg-[#202b40] text-xs font-mono text-amber-400 transition-colors"
              >
                <span>View on Blockstream Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Transactions;
