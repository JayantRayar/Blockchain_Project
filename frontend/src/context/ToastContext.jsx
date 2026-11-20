import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(({ title, message, type = 'info', duration = 4500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success') => addToast({ title, message, type: 'success' }),
    error: (message, title = 'Error') => addToast({ title, message, type: 'error', duration: 6000 }),
    warning: (message, title = 'Notice') => addToast({ title, message, type: 'warning' }),
    info: (message, title = 'Info') => addToast({ title, message, type: 'info' })
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-lg border border-[#eaecef] bg-white shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#03a66d]" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-[#cf304a]" />}
              {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-[#b37400]" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-[#2563eb]" />}
            </div>
            <div className="flex-1 min-w-0">
              {item.title && <h4 className="font-semibold text-xs leading-tight text-[#1e2329] mb-0.5">{item.title}</h4>}
              <p className="text-xs text-[#707a8a] break-words leading-relaxed">{item.message}</p>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-0.5 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
