"use client";

import { Intake, IntakeWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { DISPOSITION_CODES } from "@/lib/constants";

interface AnimalRecordCardProps {
  intake: Intake | IntakeWithRelations;
}

export function AnimalRecordCard({ intake }: AnimalRecordCardProps) {
  const disposition = "disposition" in intake ? intake.disposition : null;
  const dispCode = disposition?.disposition_code;
  const dispInfo = dispCode
    ? DISPOSITION_CODES[dispCode as keyof typeof DISPOSITION_CODES]
    : null;
  return (
    <Card variant="bordered" className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-primary-text">{intake.species}</h3>
          <p className="text-sm font-mono text-secondary-text">
            {intake.intake_number}
          </p>
        </div>
        <StatusBadge
          status={dispInfo?.shortTitle || "Under Care"}
          isPositive={dispInfo?.isPositive ?? true}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-secondary-text">Intake Date: </span>
          <span className="text-primary-text">
            {formatDate(intake.intake_date)}
          </span>
        </div>
        <div>
          <span className="text-secondary-text">Quantity: </span>
          <span className="text-primary-text">{intake.quantity}</span>
        </div>
        <div>
          <span className="text-secondary-text">Sex: </span>
          <span className="text-primary-text">{intake.sex}</span>
        </div>
        {intake.intake_reason && (
          <div>
            <span className="text-secondary-text">Reason: </span>
            <span className="text-primary-text">{intake.intake_reason}</span>
          </div>
        )}
      </div>
      {intake.found_location && (
        <div className="text-sm">
          <span className="text-secondary-text">Found: </span>
          <span className="text-primary-text">{intake.found_location}</span>
        </div>
      )}
      {intake.finder_name && (
        <div className="text-sm">
          <span className="text-secondary-text">Finder: </span>
          <span className="text-primary-text">
            {intake.finder_name}
            {intake.finder_phone && ` · ${intake.finder_phone}`}
          </span>
        </div>
      )}
      {intake.notes && (
        <div className="text-sm text-secondary-text italic">{intake.notes}</div>
      )}
    </Card>
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
    <span
      className={`
        px-2 py-1 text-xs font-medium rounded-full
        ${
          isPositive
            ? "bg-success-green/10 text-success-green"
            : "bg-error-red/10 text-error-red"
        }
      `}
    >
      {status}
    </span>
  );
}
