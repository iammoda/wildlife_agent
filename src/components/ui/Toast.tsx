"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast: ToastItem = { id, message, variant };
      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed right-4 top-4 z-50 space-y-2"
        style={{ maxWidth: 360 }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="rounded-lg px-4 py-3 shadow-lg border text-sm animate-fadeIn"
            style={getToastStyle(toast.variant)}
            role="status"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function getToastStyle(variant: ToastVariant): React.CSSProperties {
  if (variant === "error") {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--color-error) 15%, var(--color-bg-elevated))",
      color: "var(--color-error)",
      borderColor:
        "color-mix(in srgb, var(--color-error) 25%, transparent)",
    };
  }
  if (variant === "info") {
    return {
      backgroundColor:
        "color-mix(in srgb, var(--color-brand-accent) 15%, var(--color-bg-elevated))",
      color: "var(--color-brand-accent)",
      borderColor:
        "color-mix(in srgb, var(--color-brand-accent) 25%, transparent)",
    };
  }
  // success
  return {
    backgroundColor:
      "color-mix(in srgb, var(--color-success) 15%, var(--color-bg-elevated))",
    color: "var(--color-success)",
    borderColor:
      "color-mix(in srgb, var(--color-success) 25%, transparent)",
  };
}
