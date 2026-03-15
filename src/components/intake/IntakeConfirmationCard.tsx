"use client";

import { useState } from "react";
import { ParsedIntake } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  getDispositionInfo,
  REQUIRED_INTAKE_FIELDS,
  isRequiredIntakeFieldMissing,
} from "@/lib/constants";

interface IntakeConfirmationCardProps {
  data: ParsedIntake;
  onConfirm: () => void;
  onEdit: () => void;
  onDiscard?: () => void;
  isProcessing?: boolean;
}

export function IntakeConfirmationCard({
  data,
  onConfirm,
  onEdit,
  onDiscard,
  isProcessing = false,
}: IntakeConfirmationCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const missingFields = REQUIRED_INTAKE_FIELDS.filter((field) => {
    const value = data[field.key as keyof ParsedIntake];
    return isRequiredIntakeFieldMissing(field.key, value);
  }).map((field) => field.label);

  const hasAllRequired = missingFields.length === 0;

  const handleSaveClick = () => {
    if (hasAllRequired) {
      onConfirm();
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    onConfirm();
  };

  // Build compact subtitle parts: date, quantity, status
  const subtitleParts: string[] = [];
  const intakeDateStr = formatShortDate(data.intake_date);
  if (intakeDateStr) {
    subtitleParts.push(intakeDateStr);
  }
  const qty = data.quantity ?? 1;
  subtitleParts.push(qty === 1 ? "1 animal" : `${qty} animals`);
  if (data.sex && data.sex !== "Unknown") {
    subtitleParts.push(data.sex);
  }
  if (data.disposition) {
    subtitleParts.push(getDispositionInfo(data.disposition).shortTitle);
  }
  if (data.intake_reason && data.intake_reason !== "Unknown") {
    subtitleParts.push(data.intake_reason);
  }

  // Collect populated detail fields (shown on expand)
  const detailLines = buildDetailLines(data);

  return (
    <>
      <Card variant="bordered" className="animate-fadeIn overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Headline: species + intake number */}
          <div className="flex items-start justify-between gap-3">
            <h3
              className="font-title text-lg font-semibold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {data.species || "New Intake"}
            </h3>
            {data.intake_number && (
              <span
                className="text-xs font-mono px-2 py-0.5 rounded-full flex-shrink-0"
                style={{
                  color: "var(--color-brand-accent)",
                  backgroundColor: "var(--color-brand-light)",
                }}
              >
                {data.intake_number}
              </span>
            )}
          </div>

          {/* Compact subtitle */}
          <p
            className="text-sm leading-snug"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {subtitleParts.join(" \u00B7 ")}
          </p>

          {/* Missing fields — soft prose, not an alarm */}
          {!hasAllRequired && (
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              Still need: {missingFields.join(", ").toLowerCase()}
            </p>
          )}

          {/* Expanded details — only populated fields, no section headers */}
          {showDetails && detailLines.length > 0 && (
            <div
              className="pt-1 space-y-1.5 animate-fadeIn"
            >
              {detailLines.map(({ label, value }) => (
                <div key={label} className="text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>{label}: </span>
                  <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Toggle details */}
          {detailLines.length > 0 && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--color-brand-accent)" }}
            >
              {showDetails ? "\u2212 Hide details" : "+ Show details"}
            </button>
          )}
        </div>

        {/* Action bar — clean separator */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border-light)" }}
        >
          {onDiscard && (
            <button
              onClick={onDiscard}
              disabled={isProcessing}
              className="text-sm transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              Discard
            </button>
          )}
          <div className="flex-1" />
          <Button
            onClick={onEdit}
            variant="ghost"
            size="sm"
            className="btn-edit-subtle"
            disabled={isProcessing}
          >
            Edit
          </Button>
          <Button
            onClick={handleSaveClick}
            variant="ghost"
            size="sm"
            className="btn-primary-green"
            disabled={isProcessing}
          >
            {isProcessing ? "Saving..." : "Save"}
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Save with missing info?"
        size="sm"
      >
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            These fields are still empty: {missingFields.join(", ").toLowerCase()}.
            You can fill them in later.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmSave} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Save anyway"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// --- Helpers ---

interface DetailLine {
  label: string;
  value: string;
}

/**
 * Collects only populated fields beyond what's already shown in the subtitle.
 * Excludes species, intake_number, intake_date, quantity, sex, disposition,
 * and intake_reason since those are in the headline/subtitle.
 */
function buildDetailLines(data: ParsedIntake): DetailLine[] {
  const lines: DetailLine[] = [];
  const add = (label: string, value?: string | null) => {
    if (value) lines.push({ label, value });
  };

  add("Finder", data.finder_name);
  add("Phone", data.finder_phone);
  add("Email", data.finder_email);
  add("Found", formatShortDate(data.found_date));
  add("Location", data.found_location);
  add("Address", data.finder_address);
  add("Weight", data.weight);
  add("Age", data.age);
  if (data.distress_code) {
    add(
      "Distress",
      data.distress_subcode
        ? `${data.distress_code}-${data.distress_subcode}`
        : data.distress_code
    );
  }
  add("Food offered", data.food_offered);
  add("Donation", data.donation_amount);
  add("Disposition date", formatShortDate(data.disposition_date));
  add("Description", data.how_description);
  add("Notes", data.notes);
  add("Exam notes", data.exam_notes);

  return lines;
}

function formatShortDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
