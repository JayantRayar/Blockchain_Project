import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftRight,
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatBtc, formatSats, truncateTxid, truncateAddress, formatRelativeTime } from '../utils/formatters';
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#eaecef]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2329]">
            Transaction Ledger
          </h1>
          <p className="text-xs text-[#707a8a] mt-0.5 font-normal">
            Real-time monitored Bitcoin incoming and outgoing transactions
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#f5f6f8] text-[#1e2329] border border-[#eaecef] text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#eaecef] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by 64-character txid hash..."
            className="w-full pl-9 pr-14 py-1.5 rounded bg-[#f8f9fa] border border-[#eaecef] text-[#1e2329] text-xs font-mono placeholder:text-slate-400 focus:outline-none focus:border-[#F0B90B] focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-[#FCD535] text-[#181a20] text-xs font-bold uppercase cursor-pointer"
            >
              Go
            </button>
          )}
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-1.5 text-xs text-[#707a8a]">
            <span>Direction:</span>
            <select
              value={directionFilter}
              onChange={(e) => {
                setDirectionFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded bg-[#f8f9fa] border border-[#eaecef] text-[#1e2329] text-xs font-sans focus:outline-none focus:border-[#F0B90B] focus:bg-white cursor-pointer"
            >
              <option value="">All</option>
              <option value="INCOMING">Incoming</option>
              <option value="OUTGOING">Outgoing</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#707a8a]">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded bg-[#f8f9fa] border border-[#eaecef] text-[#1e2329] text-xs font-sans focus:outline-none focus:border-[#F0B90B] focus:bg-white cursor-pointer"
            >
              <option value="">All</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-[#eaecef] rounded-lg overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8f9fa] text-[#707a8a] uppercase text-xs font-bold tracking-wider border-b border-[#eaecef]">
                <tr>
                  <th className="px-5 py-3">Transaction ID</th>
                  <th className="px-5 py-3">Direction</th>
                  <th className="px-5 py-3 text-right">Amount (BTC)</th>
                  <th className="px-5 py-3 text-right">Satoshis</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Fee</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f5] font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.txid} className="hover:bg-[#f8f9fa] transition-colors">
                    <td className="px-5 py-3.5 text-[#1e2329]">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleInspect(tx.txid)}
                          className="hover:text-[#b37400] font-bold transition-colors cursor-pointer text-left"
                          title="Click to inspect UTXOs & on-chain data"
                        >
                          {truncateTxid(tx.txid, 8, 8)}
                        </button>
                        <CopyButton text={tx.txid} />
                      </div>
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
                        {tx.status === 'CONFIRMED' ? (
                          `${tx.confirmations} confs`
                        ) : (
                          'Mempool (0)'
                        )}
                      </Badge>
                    </td>

                    <td className="px-5 py-3.5 text-right text-[#707a8a]">
                      {tx.feeSatoshis ? `${formatSats(tx.feeSatoshis)} sats` : '0 sats'}
                    </td>

                    <td className="px-5 py-3.5 text-[#707a8a] font-sans text-xs">
                      {formatRelativeTime(tx.transactionTimestamp || tx.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 text-right font-sans">
                      <button
                        onClick={() => handleInspect(tx.txid)}
                        className="p-1.5 rounded text-slate-500 hover:text-[#b37400] hover:bg-slate-100 transition-colors cursor-pointer"
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
        subtitle="On-chain inputs, outputs, and confirmations"
        maxWidth="max-w-2xl"
      >
        {inspectLoading ? (
          <LoadingSpinner size="md" message="Inspecting transaction inputs & outputs..." />
        ) : inspectData ? (
          <div className="space-y-5 font-sans">
            <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
              <span className="text-xs font-bold text-[#707a8a] uppercase tracking-wider block mb-1">
                Transaction Hash
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-[#1e2329] break-all select-all font-bold">
                  {inspectData.txid}
                </span>
                <CopyButton text={inspectData.txid} />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded bg-white border border-[#eaecef]">
                <span className="text-xs text-[#707a8a] block mb-0.5 font-sans">Block Height</span>
                <span className="text-[#1e2329] font-bold">
                  {inspectData.liveData?.status?.block_height ? `#${inspectData.liveData.status.block_height}` : 'Pending'}
                </span>
              </div>

              <div className="p-3 rounded bg-white border border-[#eaecef]">
                <span className="text-xs text-[#707a8a] block mb-0.5 font-sans">Confirmations</span>
                <span className="text-[#03a66d] font-bold">
                  {inspectData.currentBlockHeight && inspectData.liveData?.status?.block_height
                    ? Math.max(1, inspectData.currentBlockHeight - inspectData.liveData.status.block_height + 1)
                    : 0}
                </span>
              </div>

              <div className="p-3 rounded bg-white border border-[#eaecef]">
                <span className="text-xs text-[#707a8a] block mb-0.5 font-sans">Network Fee</span>
                <span className="text-[#1e2329] font-bold">
                  {inspectData.liveData?.fee ? `${formatSats(inspectData.liveData.fee)} sats` : '0 sats'}
                </span>
              </div>

              <div className="p-3 rounded bg-white border border-[#eaecef]">
                <span className="text-xs text-[#707a8a] block mb-0.5 font-sans">Size / Weight</span>
                <span className="text-[#1e2329]">
                  {inspectData.liveData?.size || 0} B / {inspectData.liveData?.weight || 0} WU
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded bg-white border border-[#eaecef]">
                <h4 className="text-xs font-bold text-[#cf304a] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Inputs ({inspectData.liveData?.vin?.length || 0})</span>
                  <span className="text-xs text-[#707a8a] font-normal">Spent UTXOs</span>
                </h4>
                <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-xs">
                  {inspectData.liveData?.vin?.map((input, idx) => (
                    <div key={idx} className="p-2 rounded bg-[#fdf2f3] border border-[#fbdde1] flex justify-between items-center text-xs">
                      <span className="text-[#1e2329] truncate max-w-[140px]" title={input.prevout?.scriptpubkey_address}>
                        {truncateAddress(input.prevout?.scriptpubkey_address || 'Coinbase', 6, 4)}
                      </span>
                      <span className="text-[#cf304a] font-bold">
                        {formatSats(input.prevout?.value || 0)} sats
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded bg-white border border-[#eaecef]">
                <h4 className="text-xs font-bold text-[#03a66d] uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Outputs ({inspectData.liveData?.vout?.length || 0})</span>
                  <span className="text-xs text-[#707a8a] font-normal">Created UTXOs</span>
                </h4>
                <div className="space-y-1.5 max-h-44 overflow-y-auto font-mono text-xs">
                  {inspectData.liveData?.vout?.map((output, idx) => (
                    <div key={idx} className="p-2 rounded bg-[#edf9f3] border border-[#d1f2e2] flex justify-between items-center text-xs">
                      <span className="text-[#1e2329] truncate max-w-[140px]" title={output.scriptpubkey_address}>
                        {truncateAddress(output.scriptpubkey_address || 'OP_RETURN / Script', 6, 4)}
                      </span>
                      <span className="text-[#03a66d] font-bold">
                        {formatSats(output.value || 0)} sats
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href={`https://blockstream.info/testnet/tx/${inspectData.txid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#f5f6f8] hover:bg-[#eaecef] text-xs font-semibold text-[#1e2329] transition-colors border border-[#eaecef]"
              >
                <span>View on Blockstream Explorer</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Transactions;
