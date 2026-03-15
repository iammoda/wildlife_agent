"use client";

import { Intake, IntakeWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getDispositionInfo } from "@/lib/constants";

interface AnimalRecordCardProps {
  intake: Intake | IntakeWithRelations;
  showEditButton?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddCareLog?: () => void;
}

export function AnimalRecordCard({
  intake,
  showEditButton = true,
  onEdit,
  onDelete,
  onAddCareLog,
}: AnimalRecordCardProps) {
  const relationDisposition =
    "dispositions" in intake ? intake.dispositions : null;
  const relationCode = Array.isArray(relationDisposition)
    ? relationDisposition[0]?.disposition_code
    : relationDisposition?.disposition_code;
  const rawDisposition = intake.disposition ?? relationCode;
  const dispInfo = getDispositionInfo(rawDisposition);

  // Build compact subtitle
  const subtitleParts: string[] = [];
  const dateStr = formatShortDate(intake.intake_date);
  if (dateStr) subtitleParts.push(dateStr);
  const qty = intake.quantity ?? 1;
  subtitleParts.push(qty === 1 ? "1 animal" : `${qty} animals`);
  if (intake.sex && intake.sex !== "Unknown") subtitleParts.push(intake.sex);
  if (intake.intake_reason) subtitleParts.push(intake.intake_reason);

  // Collect detail lines (only populated fields)
  const details: { label: string; value: string }[] = [];
  if (intake.found_location) details.push({ label: "Found", value: intake.found_location });
  if (intake.finder_name) {
    let finderVal = intake.finder_name;
    if (intake.finder_phone) finderVal += ` \u00B7 ${intake.finder_phone}`;
    details.push({ label: "Finder", value: finderVal });
  }
  if (intake.notes) details.push({ label: "Notes", value: intake.notes });

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-2">
        {/* Headline: species + status */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              className="font-title text-lg font-semibold leading-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              {intake.species}
            </h3>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--color-text-muted)" }}
            >
              {intake.intake_number}
            </span>
          </div>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              color: dispInfo.isPositive
                ? "var(--color-success)"
                : "var(--color-error)",
              backgroundColor: dispInfo.isPositive
                ? "color-mix(in srgb, var(--color-success) 12%, transparent)"
                : "color-mix(in srgb, var(--color-error) 12%, transparent)",
            }}
          >
            {dispInfo.shortTitle}
          </span>
        </div>

        {/* Compact subtitle */}
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {subtitleParts.join(" \u00B7 ")}
        </p>

        {/* Detail lines */}
        {details.length > 0 && (
          <div className="pt-1 space-y-1">
            {details.map(({ label, value }) => (
              <p key={label} className="text-sm">
                <span style={{ color: "var(--color-text-muted)" }}>
                  {label}:{" "}
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {value}
                </span>
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {(showEditButton || onAddCareLog || onDelete) && (
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: "1px solid var(--color-border-light)" }}
        >
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-sm transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              Delete
            </button>
          )}
          <div className="flex-1" />
          {showEditButton && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="btn-edit-subtle"
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          {onAddCareLog && (
            <Button
              variant="ghost"
              size="sm"
              className="btn-primary-green"
              onClick={onAddCareLog}
            >
              Add Care Log
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function formatShortDate(value: string | Date): string | undefined {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
