"use client";

import { ParsedIntake } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface IntakeConfirmationCardProps {
  data: ParsedIntake;
  onConfirm: () => void;
  onEdit: () => void;
}

export function IntakeConfirmationCard({
  data,
  onConfirm,
  onEdit,
}: IntakeConfirmationCardProps) {
  return (
    <Card variant="bordered" className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 
          className="font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Intake Preview
        </h3>
        {data.intake_number && (
          <span 
            className="text-sm font-mono px-2 py-1 rounded-lg"
            style={{ 
              color: "var(--color-brand-primary)",
              backgroundColor: "var(--color-brand-light)"
            }}
          >
            {data.intake_number}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Field label="Species" value={data.species} />
        <Field label="Quantity" value={data.quantity?.toString()} />
        <Field label="Sex" value={data.sex} />
        <Field label="Reason" value={data.intake_reason} />
        <Field label="Found Location" value={data.found_location} />
        <Field label="Finder" value={data.finder_name} />
        <Field label="Phone" value={data.finder_phone} />
        <Field label="Weight" value={data.weight} />
        <Field label="Age" value={data.age} />
        <Field label="Distress Code" value={formatDistressCode(data)} />
      </div>
      {data.how_description && (
        <div className="text-sm">
          <span style={{ color: "var(--color-text-secondary)" }}>Description: </span>
          <span style={{ color: "var(--color-text-primary)" }}>{data.how_description}</span>
        </div>
      )}
      {data.confidence != null && (
        <div 
          className="text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          Confidence: {Math.round(data.confidence * 100)}%
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button onClick={onEdit} variant="secondary" size="sm">
          Edit
        </Button>
        <Button onClick={onConfirm} size="sm">
          Save Intake
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span style={{ color: "var(--color-text-secondary)" }}>{label}: </span>
      <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
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
