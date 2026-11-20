import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title} maxWidth="max-w-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl shrink-0 ${isDanger ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed mt-0.5">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#1a2232]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-300 bg-[#161d2a] border border-[#222c40] hover:bg-[#1c2536] hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-md cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 active:scale-95'
                : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
