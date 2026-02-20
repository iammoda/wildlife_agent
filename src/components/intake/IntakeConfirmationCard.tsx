"use client";

import { useState, ReactNode } from "react";
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
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    onConfirm();
  };

  return (
    <>
      <Card variant="bordered" className="space-y-6 p-6 animate-fadeIn card-accent-top">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <h3
              className="font-title text-2xl font-semibold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Intake Preview
            </h3>
            {data.species && (
              <p className="text-base font-medium" style={{ color: "var(--color-text-primary)" }}>
                {data.species}
              </p>
            )}
          </div>
          {data.intake_number && (
            <span
              className="text-sm font-mono px-3 py-1.5 rounded-full"
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
            className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--color-error) 12%, var(--color-bg-secondary))",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            <WarningIcon />
            <div>
              <p className="font-medium">Missing required information</p>
              <p className="mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {missingFields.join(", ")}
              </p>
            </div>
          </div>
        )}

        <PreviewSection title="Core Intake">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField label="Intake Date" value={formatDisplayDate(data.intake_date)} />
            <DetailField label="Quantity" value={data.quantity?.toString()} />
            <DetailField label="Sex" value={data.sex} />
            <DetailField label="Intake Reason" value={data.intake_reason} required />
          </div>
        </PreviewSection>

        <PreviewSection title="Finder Details">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField label="Finder Name" value={data.finder_name} required />
            <DetailField label="Finder Phone" value={data.finder_phone} required />
            <DetailField label="Finder Email" value={data.finder_email} />
            <DetailField label="Found Date" value={formatDisplayDate(data.found_date)} />
            <DetailField label="Found Location" value={data.found_location} required fullWidth />
            <DetailField label="Finder Address" value={data.finder_address} fullWidth />
          </div>
        </PreviewSection>

        <PreviewSection title="Condition & Outcome">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <DetailField label="Weight" value={data.weight} />
            <DetailField label="Age" value={data.age} />
            <DetailField label="Distress Code" value={formatDistressCode(data)} />
            <DetailField label="Food Offered" value={data.food_offered} />
            <DetailField label="Donation Amount" value={data.donation_amount} />
            <DetailField label="Disposition Code" value={data.disposition} />
            <DetailField
              label="Disposition Date"
              value={formatDisplayDate(data.disposition_date)}
            />
          </div>
        </PreviewSection>

        {(data.how_description || data.notes || data.exam_notes) && (
          <PreviewSection title="Notes">
            <div className="space-y-3">
              <DetailField
                label="Description"
                value={data.how_description}
                asText
              />
              <DetailField label="Notes" value={data.notes} asText />
              <DetailField label="Exam Notes" value={data.exam_notes} asText />
            </div>
          </PreviewSection>
        )}

        <div className="section-divider flex flex-wrap gap-2 pt-4">
          <Button
            onClick={onEdit}
            variant="ghost"
            className="btn-edit-subtle"
            disabled={isProcessing}
          >
            Edit
          </Button>
          <Button
            onClick={handleSaveClick}
            variant="ghost"
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

interface PreviewSectionProps {
  title: string;
  children: ReactNode;
}

function PreviewSection({ title, children }: PreviewSectionProps) {
  return (
        <section className="space-y-3 rounded-xl border p-4" style={{ borderColor: "var(--color-border-light)" }}>
      <h4
        className="text-sm font-semibold"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {title}
      </h4>
      {children}
    </section>
  );
}

interface DetailFieldProps {
  label: string;
  value?: string | null;
  required?: boolean;
  fullWidth?: boolean;
  asText?: boolean;
}

function DetailField({ label, value, required, fullWidth, asText }: DetailFieldProps) {
  const isEmpty = !value;
  const showMissing = required && isEmpty;
  if (isEmpty && !required) return null;

  return (
    <div
      className={`border-b px-0 pb-2.5 ${fullWidth ? "md:col-span-2" : ""}`}
      style={{ borderColor: "var(--color-border-light)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      {showMissing ? (
        <p className="italic text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Not provided
        </p>
      ) : (
        <p
          className={`mt-1 text-base font-medium leading-relaxed ${asText ? "whitespace-pre-wrap break-words" : ""}`}
          style={{ color: "var(--color-text-primary)" }}
        >
          {value}
        </p>
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

function formatDisplayDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function WarningIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path d="M12 9v4" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  );
}
