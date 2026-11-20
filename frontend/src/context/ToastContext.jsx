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
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              item.type === 'success'
                ? 'bg-[#0f191b]/95 border-emerald-500/30 text-emerald-200'
                : item.type === 'error'
                ? 'bg-[#1e1215]/95 border-rose-500/30 text-rose-200'
                : item.type === 'warning'
                ? 'bg-[#1f190e]/95 border-amber-500/30 text-amber-200'
                : 'bg-[#121620]/95 border-sky-500/30 text-sky-200'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 min-w-0">
              {item.title && <h4 className="font-semibold text-sm leading-tight text-white mb-0.5">{item.title}</h4>}
              <p className="text-xs text-slate-300 break-words leading-relaxed">{item.message}</p>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors p-1"
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
