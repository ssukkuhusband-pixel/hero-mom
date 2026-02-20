'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';

// --- Types ---

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  /** ms timestamp when this toast was created — drives float-up animation */
  createdAt: number;
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

/** How long the toast is visible (ms) before it starts fading */
const TOAST_DISPLAY_MS = 2200;
/** How long the float-up + fade animation takes (ms) */
const TOAST_FADE_MS = 800;
/** Total lifetime = display + fade */
const TOAST_LIFETIME_MS = TOAST_DISPLAY_MS + TOAST_FADE_MS;

// --- Provider ---

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++;
      const createdAt = Date.now();
      setToasts((prev) => [...prev, { id, message, variant, createdAt }]);

      // Remove after full lifetime
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_LIFETIME_MS);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container — all toasts spawn at the same spot and float up */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px] pointer-events-none">
        <div className="relative">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`
                absolute left-0 right-0
                bg-cream-900/95 text-cream-100
                rounded-xl px-4 py-2.5
                shadow-[0_8px_24px_rgba(44,24,16,0.3)]
                backdrop-blur-sm
                flex items-center gap-2.5
                text-sm
                ${VARIANT_STYLES[toast.variant]}
                toast-float-up
              `}
            >
              <span className="text-base shrink-0">
                {VARIANT_ICONS[toast.variant]}
              </span>
              <span className="flex-1 line-clamp-2">{toast.message}</span>
            </div>
          ))}
        </div>
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
