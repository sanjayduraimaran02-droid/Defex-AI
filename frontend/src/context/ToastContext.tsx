import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', duration = 3000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const newToast: ToastMessage = { id, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((msg: string, d?: number) => showToast(msg, 'success', d), [showToast]);
  const error = useCallback((msg: string, d?: number) => showToast(msg, 'error', d), [showToast]);
  const warning = useCallback((msg: string, d?: number) => showToast(msg, 'warning', d), [showToast]);
  const info = useCallback((msg: string, d?: number) => showToast(msg, 'info', d), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismissToast }}>
      {children}
      {/* Toast Container - Fixed Bottom Right */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-3 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto bg-white border border-[#E5E7EB] rounded-[10px] p-3 shadow-lg relative overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-2 fade-in ${
                isSuccess
                  ? 'border-l-4 border-l-[#22C55E]'
                  : isError
                  ? 'border-l-4 border-l-[#EF4444]'
                  : isWarning
                  ? 'border-l-4 border-l-[#F59E0B]'
                  : 'border-l-4 border-l-[#2563EB]'
              }`}
              style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  {isSuccess ? (
                    <CheckCircle2 className="w-4 h-4 text-[#22C55E] shrink-0" />
                  ) : isError ? (
                    <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  ) : isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  ) : (
                    <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
                  )}
                  <p className="text-xs font-semibold text-[#1A1A2E] leading-snug">
                    {toast.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="text-[#9CA3AF] hover:text-[#1A1A2E] p-0.5 rounded transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Animated Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F1F3F5] overflow-hidden">
                <div
                  className={`h-full animate-toast-progress ${
                    isSuccess
                      ? 'bg-[#22C55E]'
                      : isError
                      ? 'bg-[#EF4444]'
                      : isWarning
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#2563EB]'
                  }`}
                  style={{
                    animationDuration: `${toast.duration || 3000}ms`,
                    animationTimingFunction: 'linear',
                    animationFillMode: 'forwards',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
