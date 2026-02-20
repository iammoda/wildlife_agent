"use client";

import { useState } from "react";
import { ParsedIntake } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { REQUIRED_INTAKE_FIELDS } from "@/lib/constants";

interface IntakeConfirmationCardProps {
  data: ParsedIntake;
  onConfirm: () => void;
  onEdit: () => void;
  isProcessing?: boolean;
}

export function IntakeConfirmationCard({
  data,
  onConfirm,
  onEdit,
  isProcessing = false,
}: IntakeConfirmationCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const missingFields = REQUIRED_INTAKE_FIELDS.filter((field) => {
    const value = data[field.key as keyof ParsedIntake];
    return value === null || value === undefined || value === "";
  }).map((field) => field.label);

  const hasAllRequired = missingFields.length === 0;

  const handleSaveClick = () => {
    if (hasAllRequired) {
      onConfirm();
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    onConfirm();
  };

  return (
    <>
      <Card variant="bordered" className="space-y-4 animate-fadeIn card-accent-top">
        <div className="flex items-center justify-between">
          <h3
            className="font-title text-lg font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Intake Preview
          </h3>
          {data.intake_number && (
            <span
              className="text-xs font-mono px-2.5 py-1 rounded-full"
              style={{
                color: "var(--color-brand-accent)",
                backgroundColor: "var(--color-brand-light)",
                border: "1px solid var(--color-border)",
              }}
            >
              {data.intake_number}
            </span>
          )}
        </div>

        {!hasAllRequired && (
          <div
            className="text-sm px-3 py-2 rounded-lg intake-row-accent"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-error) 12%, var(--color-bg-secondary))",
              color: "var(--color-brand-accent)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            Missing: {missingFields.join(", ")}
          </div>
        )}

        <div
          className="grid grid-cols-1 gap-2 rounded-lg p-3 text-sm sm:grid-cols-2"
          style={{ backgroundColor: "var(--color-bg-secondary)" }}
        >
          <Field label="Species" value={data.species} required />
          <Field label="Quantity" value={data.quantity?.toString()} />
          <Field label="Sex" value={data.sex} />
          <Field label="Reason" value={data.intake_reason} required />
          <Field label="Found Location" value={data.found_location} required />
          <Field label="Found Date" value={data.found_date} />
          <Field label="Finder" value={data.finder_name} required />
          <Field label="Phone" value={data.finder_phone} required />
          <Field label="Email" value={data.finder_email} />
          <Field label="Address" value={data.finder_address} />
          <Field label="Food Offered" value={data.food_offered} />
          <Field label="Donation" value={data.donation_amount} />
          <Field label="Disposition" value={data.disposition} />
          <Field label="Disposition Date" value={data.disposition_date} />
          <Field label="Weight" value={data.weight} />
          <Field label="Age" value={data.age} />
          <Field label="Distress Code" value={formatDistressCode(data)} />
        </div>

        {data.how_description && (
          <div className="text-sm intake-row-accent px-3 py-2">
            <span style={{ color: "var(--color-text-secondary)" }}>
              Description:{" "}
            </span>
            <span style={{ color: "var(--color-text-primary)" }}>
              {data.how_description}
            </span>
          </div>
        )}

        {data.notes && (
          <div className="text-sm intake-row-accent px-3 py-2">
            <span style={{ color: "var(--color-text-secondary)" }}>Notes: </span>
            <span style={{ color: "var(--color-text-primary)" }}>{data.notes}</span>
          </div>
        )}

        {data.exam_notes && (
          <div className="text-sm intake-row-accent px-3 py-2">
            <span style={{ color: "var(--color-text-secondary)" }}>
              Exam Notes:{" "}
            </span>
            <span style={{ color: "var(--color-text-primary)" }}>
              {data.exam_notes}
            </span>
          </div>
        )}

        <div className="section-divider flex gap-2 pt-3">
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
            {isProcessing ? "Saving..." : "Save Intake"}
          </Button>
        </div>
      </Card>

      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Save with missing information?"
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: "var(--color-text-secondary)" }}>
            The following required fields are empty:
          </p>
          <ul className="list-disc list-inside space-y-1">
            {missingFields.map((field) => (
              <li key={field} style={{ color: "var(--color-text-primary)" }}>
                {field}
              </li>
            ))}
          </ul>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            You can add this information later by editing the intake record.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmSave} disabled={isProcessing}>
              {isProcessing ? "Saving..." : "Save Anyway"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

interface FieldProps {
  label: string;
  value?: string | null;
  required?: boolean;
}

function Field({ label, value, required }: FieldProps) {
  const isEmpty = !value;
  const showMissing = required && isEmpty;
  if (isEmpty && !required) return null;
  return (
    <div className="rounded-md px-2 py-1.5" style={{ backgroundColor: "var(--color-bg-tertiary)" }}>
      <span className="text-xs uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
        {label}:{" "}
      </span>
      {showMissing ? (
        <span className="italic text-sm" style={{ color: "var(--color-text-muted)" }}>
          Not provided
        </span>
      ) : (
        <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {value}
        </span>
      )}
    </div>
  );
}

function formatDistressCode(data: ParsedIntake): string | undefined {
  if (!data.distress_code) return undefined;
  if (data.distress_subcode) {
    return `${data.distress_code}-${data.distress_subcode}`;
  }
  return data.distress_code;
}
