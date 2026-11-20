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
          <div className={`p-2.5 rounded-xl shrink-0 ${isDanger ? 'bg-[#fdf2f3] text-[#cf304a]' : 'bg-[#fff8e6] text-[#b37400]'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-xs text-[#707a8a] leading-relaxed mt-0.5">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#eaecef]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium rounded-lg text-slate-700 bg-white border border-[#eaecef] hover:bg-[#f5f6f8] transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
              isDanger
                ? 'bg-[#cf304a] hover:bg-[#b02239] active:scale-95'
                : 'bg-[#FCD535] hover:bg-[#F0B90B] !text-[#181a20] active:scale-95'
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
