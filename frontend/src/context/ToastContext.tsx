import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X, RotateCcw } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
  durationMs?: number;
}

interface ToastContextType {
  showToast: (
    title: string,
    description?: string,
    type?: ToastType,
    action?: ToastAction,
    durationMs?: number
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Individual Toast Item with Live Countdown Timer
const ToastItem: React.FC<{
  toast: ToastMessage;
  onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
  const durationSeconds = Math.round((toast.durationMs || 5000) / 1000);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onRemove(toast.id);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, toast.id, onRemove]);

  return (
    <div
      className={`pointer-events-auto flex items-center justify-between p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 transform animate-slide-up ${
        toast.type === 'success'
          ? 'bg-emerald-950/95 text-emerald-100 border-emerald-500/40 shadow-emerald-950/50'
          : toast.type === 'error'
          ? 'bg-rose-950/95 text-rose-100 border-rose-500/40 shadow-rose-950/50'
          : toast.type === 'warning'
          ? 'bg-amber-950/95 text-amber-100 border-amber-500/40 shadow-amber-950/50'
          : 'bg-indigo-950/95 text-indigo-100 border-indigo-500/40 shadow-indigo-950/50'
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0 pr-2">
        <div className="mt-0.5 shrink-0">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm leading-tight text-white">{toast.title}</h4>
          {toast.description && (
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.description}</p>
          )}
        </div>
      </div>

      {/* Interactive Toast Action with Dynamic Running Countdown Timer */}
      {toast.action && (
        <button
          onClick={() => {
            toast.action?.onClick();
            onRemove(toast.id);
          }}
          className="ml-3 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border border-indigo-400/40 hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{toast.action.label} ({timeLeft}s)</span>
        </button>
      )}

      <button
        onClick={() => onRemove(toast.id)}
        className="ml-2 text-white/60 hover:text-white shrink-0 p-1 rounded-lg transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (
    title: string,
    description?: string,
    type: ToastType = 'success',
    action?: ToastAction,
    durationMs: number = 5000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, title, description, type, action, durationMs };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Render Toast Popups */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
