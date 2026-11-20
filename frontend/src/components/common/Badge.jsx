import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold'
  }[size] || 'px-2 py-0.5 text-xs';

  const variantClasses = {
    // Transaction directions
    incoming: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    outgoing: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    
    // Statuses
    confirmed: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse',
    
    // Wallet States
    active: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    inactive: 'bg-slate-800 text-slate-400 border border-slate-700',
    
    // Networks
    testnet: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    mainnet: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    
    // General
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    default: 'bg-slate-800 text-slate-300 border border-slate-700'
  }[variant.toLowerCase()] || 'bg-slate-800 text-slate-300 border border-slate-700';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md tracking-wide ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
