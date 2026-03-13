"use client";

import { useRef } from "react";
import { DOCUMENT_UPLOAD_ACCEPT } from "@/lib/document-upload";

interface DocumentCaptureButtonProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export function DocumentCaptureButton({
  onCapture,
  disabled = false,
}: DocumentCaptureButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCapture(file);
      e.target.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_UPLOAD_ACCEPT}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="p-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: "var(--color-text-secondary)" }}
        onMouseOver={(e) => {
          e.currentTarget.style.color = "var(--color-brand-primary)";
          e.currentTarget.style.backgroundColor = "var(--color-brand-light)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.color = "var(--color-text-secondary)";
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        aria-label="Add document"
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </>
  );
}
