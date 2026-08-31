import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = true,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onCancel}
      />

      <div className="relative w-full max-w-md bg-slate-900 dark:bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 animate-slide-up">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              isDanger ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-sm transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white font-medium text-sm rounded-xl shadow-lg transition-all ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
