"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DeleteConfirmationProps {
  recordType: "intake" | "care_log";
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function DeleteConfirmation({
  recordType,
  name,
  onConfirm,
  onCancel,
  isProcessing = false,
}: DeleteConfirmationProps) {
  const label = recordType === "intake" ? "intake record" : "care log";

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-2">
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          Delete this {label}?
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <strong>{name}</strong> will be permanently deleted.
        </p>
      </div>
      <div
        className="flex items-center justify-end gap-2 px-4 py-3"
        style={{ borderTop: "1px solid var(--color-border-light)" }}
      >
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="text-sm transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          Cancel
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onConfirm}
          className="btn-delete-ghost"
          disabled={isProcessing}
        >
          {isProcessing ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Card>
  );
}
