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
    <Card variant="bordered" className="space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="#EF4444"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-primary-text">
            Delete {label}?
          </h3>
          <p className="text-sm text-secondary-text mt-1">
            <strong>{name}</strong> will be permanently deleted. This action
            cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          className="bg-red-600 hover:bg-red-700"
          disabled={isProcessing}
        >
          {isProcessing ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </Card>
  );
}
