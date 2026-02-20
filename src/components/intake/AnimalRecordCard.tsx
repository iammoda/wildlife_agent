"use client";

import { Intake, IntakeWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { DISPOSITION_CODES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

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
  const disposition = "disposition" in intake ? intake.disposition : null;
  const dispCode =
    typeof disposition === "string"
      ? disposition
      : disposition?.disposition_code;
  const dispInfo = dispCode
    ? DISPOSITION_CODES[dispCode as keyof typeof DISPOSITION_CODES]
    : null;

  return (
    <Card variant="bordered" className="space-y-4 card-accent-top animate-fadeIn">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="font-title text-xl font-semibold text-primary-text">
            {intake.species}
          </h3>
          <p
            className="inline-flex rounded-full px-2.5 py-1 text-xs font-mono"
            style={{
              backgroundColor: "var(--color-bg-tertiary)",
              color: "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
            }}
          >
            {intake.intake_number}
          </p>
        </div>
        <StatusBadge
          status={dispInfo?.shortTitle || "Under Care"}
          isPositive={dispInfo?.isPositive ?? true}
        />
      </div>

      <div
        className="grid grid-cols-1 gap-2 rounded-lg p-3 text-sm sm:grid-cols-2"
        style={{ backgroundColor: "var(--color-bg-secondary)" }}
      >
        <LabelValueRow label="Intake Date" value={formatDate(intake.intake_date)} />
        <LabelValueRow label="Quantity" value={String(intake.quantity)} />
        <LabelValueRow label="Sex" value={intake.sex} />
        {intake.intake_reason && <LabelValueRow label="Reason" value={intake.intake_reason} />}
      </div>

      {(intake.found_location || intake.finder_name || intake.notes) && (
        <div className="section-divider space-y-2 pt-3">
          {intake.found_location && (
            <div className="meta-row text-sm">
              <LocationIcon />
              <p>
                <span className="text-secondary-text">Found:</span>{" "}
                <span className="text-primary-text">{intake.found_location}</span>
              </p>
            </div>
          )}
          {intake.finder_name && (
            <div className="meta-row text-sm">
              <FinderIcon />
              <p>
                <span className="text-secondary-text">Finder:</span>{" "}
                <span className="text-primary-text">
                  {intake.finder_name}
                  {intake.finder_phone && ` \u00b7 ${intake.finder_phone}`}
                </span>
              </p>
            </div>
          )}
          {intake.notes && (
            <div className="text-sm italic text-secondary-text">{intake.notes}</div>
          )}
        </div>
      )}

      {(showEditButton || onAddCareLog || onDelete) && (
        <div
          className="section-divider flex flex-wrap gap-2 pt-3"
        >
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
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="btn-delete-ghost"
              onClick={onDelete}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function LabelValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md px-2 py-1.5" style={{ backgroundColor: "var(--color-bg-tertiary)" }}>
      <p className="text-xs uppercase tracking-wide text-secondary-text">{label}</p>
      <p className="text-sm font-medium text-primary-text">{value}</p>
    </div>
  );
}

function StatusBadge({
  status,
  isPositive,
}: {
  status: string;
  isPositive: boolean;
}) {
  return (
    <span className={`intake-pill text-xs ${isPositive ? "status-pill-success" : "status-pill-danger"}`}>
      {status}
    </span>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-icon inline-icon-muted"
      aria-hidden="true"
    >
      <path
        d="M8 14C8 14 12 10 12 6.8C12 4.7 10.2 3 8 3C5.8 3 4 4.7 4 6.8C4 10 8 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="6.8" r="1.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function FinderIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="inline-icon inline-icon-muted"
      aria-hidden="true"
    >
      <circle cx="8" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3.5 13C3.9 10.8 5.5 9.5 8 9.5C10.5 9.5 12.1 10.8 12.5 13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
