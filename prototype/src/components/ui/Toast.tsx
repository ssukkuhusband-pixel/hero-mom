'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

// --- Types ---

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  exiting: boolean;
}

interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
}

// --- Context ---

const ToastContext = createContext<ToastContextValue | null>(null);

// --- Variant styles ---

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-l-4 border-l-cozy-forest',
  info: 'border-l-4 border-l-cozy-sky',
  warning: 'border-l-4 border-l-cozy-amber',
  error: 'border-l-4 border-l-cozy-red',
};

const VARIANT_ICONS: Record<ToastVariant, string> = {
  success: '\u2705',
  info: '\u2139\uFE0F',
  warning: '\u26A0\uFE0F',
  error: '\u274C',
};

// --- Provider ---

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const removeToast = useCallback((id: number) => {
    // Mark as exiting for animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, message, variant, exiting: false }]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[90%] max-w-[400px] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              bg-cream-900 text-cream-100
              rounded-xl px-4 py-3
              shadow-[0_8px_24px_rgba(44,24,16,0.3)]
              flex items-center gap-2.5
              text-sm
              ${VARIANT_STYLES[toast.variant]}
              ${toast.exiting ? 'toast-exit' : 'toast-enter'}
            `}
          >
            <span className="text-base shrink-0">
              {VARIANT_ICONS[toast.variant]}
            </span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-cream-500 hover:text-cream-200 transition-colors text-xs"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// --- Hook ---

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
