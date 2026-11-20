import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/formatters';

export const CopyButton = ({ text, label = '', className = '', iconSize = 'w-3.5 h-3.5' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={`inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer rounded p-1 hover:bg-slate-800/60 ${className}`}
    >
      {copied ? (
        <Check className={`${iconSize} text-emerald-400`} />
      ) : (
        <Copy className={`${iconSize}`} />
      )}
      {label && <span className="text-xs font-mono">{label}</span>}
    </button>
  );
};

export default CopyButton;
