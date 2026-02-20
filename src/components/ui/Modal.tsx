"use client";

import { Fragment, ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;
  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${sizeStyles[size]} rounded-2xl shadow-xl animate-fadeIn`}
        style={{
          backgroundColor: "var(--color-bg-elevated)",
          border: "1px solid var(--color-border)",
        }}
      >
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2
              className="text-lg font-semibold font-title"
              style={{ color: "var(--color-text-primary)" }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 transition-colors hover:opacity-80"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="max-h-[80vh] overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
  if (typeof window === "undefined") return null;
  return createPortal(modalContent, document.body);
}
