import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Server,
  Layers,
  ExternalLink,
  BookOpen,
  Code,
  ShieldCheck,
  CheckCircle2,
  Copy
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import CopyButton from '../components/common/CopyButton';

export const Settings = () => {
  const { toast } = useToast();
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then((res) => setHealthData(res))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-[#182030]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          System Settings & Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Backend connection parameters, network environment, and blockchain reference specifications
        </p>
      </div>

      {/* Backend & Environment Configuration */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          Environment & Server Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-[#141a26] border border-[#222c40]">
            <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              API Base URL
            </span>
            <div className="flex items-center justify-between gap-1 text-slate-200">
              <span className="truncate">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}</span>
              <CopyButton text={import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'} />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-[#141a26] border border-[#222c40]">
            <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Active Network
            </span>
            <span className="text-cyan-400 font-bold uppercase">
              {healthData?.network || 'TESTNET'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#141a26] border border-[#222c40]">
            <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Monitoring Polling Rate
            </span>
            <span className="text-amber-400 font-bold">
              Every {healthData?.monitoringJob?.intervalSeconds || 30} seconds
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-[#141a26] border border-[#222c40]">
            <span className="text-[10px] text-slate-400 block mb-1 uppercase tracking-wider">
              Swagger API Docs
            </span>
            <a
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>http://localhost:5000/api-docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Code className="w-4 h-4 text-cyan-400" />
          UTXO Model & Confirmation Formulas
        </h2>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-lg bg-[#141a26] border border-[#222c40]">
            <h4 className="font-semibold text-amber-400 font-mono mb-1">UTXO Change Detection Formula</h4>
            <p className="text-slate-400 text-[11px]">
              When an input address matches the monitored wallet, it spent UTXOs. If a change output is returned back to the same address:
            </p>
            <code className="block mt-1 text-[11px] font-mono text-emerald-400 bg-[#0e131c] p-2 rounded">
              netSpentSatoshis = totalInputsFromWallet - totalOutputsToSameWallet
            </code>
          </div>

          <div className="p-3 rounded-lg bg-[#141a26] border border-[#222c40]">
            <h4 className="font-semibold text-cyan-400 font-mono mb-1">Confirmations Calculation</h4>
            <p className="text-slate-400 text-[11px]">
              Unconfirmed transactions in mempool receive 0 confirmations. Once included in a block:
            </p>
            <code className="block mt-1 text-[11px] font-mono text-emerald-400 bg-[#0e131c] p-2 rounded">
              confirmations = currentBlockHeight - transactionBlockHeight + 1
            </code>
          </div>

          <div className="p-3 rounded-lg bg-[#141a26] border border-[#222c40]">
            <h4 className="font-semibold text-slate-200 font-mono mb-1">Integer Satoshi Storage</h4>
            <p className="text-slate-400 text-[11px]">
              1 Bitcoin = 100,000,000 satoshis. All balances and transaction values are stored as 64-bit PostgreSQL BigInt satoshis to prevent floating point inaccuracies.
            </p>
          </div>
        </div>
      </div>

      {/* External Developer & Faucet Resources */}
      <div className="bg-[#121721] border border-[#1e2638] rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          Blockchain Explorers & Faucets
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="https://blockstream.info/testnet/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-[#141a26] border border-[#222c40] hover:border-amber-400/50 transition-colors flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>Blockstream Testnet Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://coinfaucet.eu/en/btc-testnet/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-[#141a26] border border-[#222c40] hover:border-amber-400/50 transition-colors flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>Bitcoin Testnet Faucet</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://mempool.space/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-[#141a26] border border-[#222c40] hover:border-amber-400/50 transition-colors flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>Mempool.space Testnet</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://developer.bitcoin.org/reference/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-[#141a26] border border-[#222c40] hover:border-amber-400/50 transition-colors flex items-center justify-between text-slate-300 hover:text-white"
          >
            <span>Bitcoin Developer Documentation</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Settings;
