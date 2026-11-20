import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold'
  }[size] || 'px-2 py-0.5 text-xs';

  const variantClasses = {
    // Transaction directions
    incoming: 'bg-[#edf9f3] text-[#03a66d] border border-[#d1f2e2]',
    outgoing: 'bg-[#fdf2f3] text-[#cf304a] border border-[#fbdde1]',
    
    // Statuses
    confirmed: 'bg-[#edf9f3] text-[#03a66d] border border-[#d1f2e2]',
    pending: 'bg-[#fef9ee] text-[#b37400] border border-[#fdecd0]',
    
    // Wallet States
    active: 'bg-[#edf9f3] text-[#03a66d] border border-[#d1f2e2]',
    inactive: 'bg-[#f5f6f8] text-[#707a8a] border border-[#eaecef]',
    
    // Networks
    testnet: 'bg-[#f0f3f8] text-[#475569] border border-[#e2e8f0]',
    mainnet: 'bg-[#fff8e6] text-[#b37400] border border-[#fdecd0]',
    
    // General
    info: 'bg-[#eff6ff] text-[#2563eb] border border-[#dbeafe]',
    default: 'bg-[#f5f6f8] text-[#707a8a] border border-[#eaecef]'
  }[variant.toLowerCase()] || 'bg-[#f5f6f8] text-[#707a8a] border border-[#eaecef]';

  return (
    <span className={`inline-flex items-center gap-1 rounded tracking-wide ${sizeClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
