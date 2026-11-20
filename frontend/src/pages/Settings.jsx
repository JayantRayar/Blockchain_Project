import React, { useState, useEffect } from 'react';
import {
  Server,
  ExternalLink,
  BookOpen,
  Code
} from 'lucide-react';
import { api } from '../services/api';
import CopyButton from '../components/common/CopyButton';

export const Settings = () => {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then((res) => setHealthData(res))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 max-w-4xl font-sans">
      {/* Header */}
      <div className="pb-2 border-b border-[#eaecef]">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1e2329]">
          System Settings & Configuration
        </h1>
        <p className="text-xs text-[#707a8a] mt-0.5 font-normal">
          Backend connection parameters, network environment, and blockchain reference specifications
        </p>
      </div>

      {/* Backend & Environment Configuration */}
      <div className="bg-white border border-[#eaecef] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h2 className="text-sm font-bold text-[#1e2329] flex items-center gap-2">
          <Server className="w-4 h-4 text-[#03a66d]" />
          Environment & Server Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <span className="text-xs text-[#707a8a] block mb-1 font-sans font-medium">
              API Base URL
            </span>
            <div className="flex items-center justify-between gap-1 text-[#1e2329] font-bold">
              <span className="truncate">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}</span>
              <CopyButton text={import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'} />
            </div>
          </div>

          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <span className="text-xs text-[#707a8a] block mb-1 font-sans font-medium">
              Active Network
            </span>
            <span className="text-[#2563eb] font-bold uppercase">
              {healthData?.network || 'TESTNET'}
            </span>
          </div>

          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <span className="text-xs text-[#707a8a] block mb-1 font-sans font-medium">
              Daemon Polling Rate
            </span>
            <span className="text-[#b37400] font-bold">
              Every {healthData?.monitoringJob?.intervalSeconds || 30} seconds
            </span>
          </div>

          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <span className="text-xs text-[#707a8a] block mb-1 font-sans font-medium">
              Swagger Documentation
            </span>
            <a
              href="http://localhost:5000/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#b37400] hover:text-[#8a5900] flex items-center gap-1 font-bold"
            >
              <span>http://localhost:5000/api-docs</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>

      {/* Technical Specifications */}
      <div className="bg-white border border-[#eaecef] rounded-lg p-5 space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h2 className="text-sm font-bold text-[#1e2329] flex items-center gap-2">
          <Code className="w-4 h-4 text-[#2563eb]" />
          UTXO Model & Confirmation Formulas
        </h2>

        <div className="space-y-3 text-xs text-[#1e2329] leading-relaxed">
          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <h4 className="font-bold text-[#b37400] font-sans mb-1">UTXO Change Detection Formula</h4>
            <p className="text-[#707a8a] text-xs font-normal">
              When an input address matches the monitored wallet, it spent UTXOs. If a change output is returned back to the same address:
            </p>
            <code className="block mt-1.5 text-xs font-mono font-bold text-[#03a66d] bg-white border border-[#eaecef] p-2 rounded">
              netSpentSatoshis = totalInputsFromWallet - totalOutputsToSameWallet
            </code>
          </div>

          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <h4 className="font-bold text-[#2563eb] font-sans mb-1">Confirmations Calculation</h4>
            <p className="text-[#707a8a] text-xs font-normal">
              Unconfirmed transactions in mempool receive 0 confirmations. Once included in a block:
            </p>
            <code className="block mt-1.5 text-xs font-mono font-bold text-[#03a66d] bg-white border border-[#eaecef] p-2 rounded">
              confirmations = currentBlockHeight - transactionBlockHeight + 1
            </code>
          </div>

          <div className="p-3.5 rounded bg-[#f8f9fa] border border-[#eaecef]">
            <h4 className="font-bold text-[#1e2329] font-sans mb-1">Integer Satoshi Storage</h4>
            <p className="text-[#707a8a] text-xs font-normal">
              1 Bitcoin = 100,000,000 satoshis. All balances and transaction values are stored as 64-bit PostgreSQL BigInt satoshis to prevent floating point inaccuracies.
            </p>
          </div>
        </div>
      </div>

      {/* External Developer & Faucet Resources */}
      <div className="bg-white border border-[#eaecef] rounded-lg p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h2 className="text-sm font-bold text-[#1e2329] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#b37400]" />
          Blockchain Explorers & Faucets
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <a
            href="https://blockstream.info/testnet/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded bg-[#f8f9fa] border border-[#eaecef] hover:bg-slate-100 transition-colors flex items-center justify-between text-[#1e2329] font-medium"
          >
            <span>Blockstream Testnet Explorer</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://coinfaucet.eu/en/btc-testnet/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded bg-[#f8f9fa] border border-[#eaecef] hover:bg-slate-100 transition-colors flex items-center justify-between text-[#1e2329] font-medium"
          >
            <span>Bitcoin Testnet Faucet</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://mempool.space/testnet"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded bg-[#f8f9fa] border border-[#eaecef] hover:bg-slate-100 transition-colors flex items-center justify-between text-[#1e2329] font-medium"
          >
            <span>Mempool.space Testnet</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <a
            href="https://developer.bitcoin.org/reference/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded bg-[#f8f9fa] border border-[#eaecef] hover:bg-slate-100 transition-colors flex items-center justify-between text-[#1e2329] font-medium"
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
