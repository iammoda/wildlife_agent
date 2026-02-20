"use client";

import { IntakeWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";

interface AnimalsInCareListProps {
  animals: IntakeWithRelations[];
}

export function AnimalsInCareList({ animals }: AnimalsInCareListProps) {
  if (animals.length === 0) {
    return (
      <Card variant="bordered">
        <p className="text-sm text-secondary-text text-center py-4">
          No animals currently under care.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <h3 className="font-title text-lg font-semibold text-primary-text">
          Animals Under Care
        </h3>
        <span
          className="intake-pill"
          style={{
            backgroundColor: "var(--color-brand-light)",
            color: "var(--color-brand-accent)",
          }}
        >
          {animals.length}
        </span>
      </div>
      <div className="space-y-2">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="intake-row-accent flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-sm font-medium px-2.5 py-1 rounded-full"
                style={{
                  backgroundColor: "var(--color-brand-light)",
                  color: "var(--color-brand-accent)",
                }}
              >
                {animal.intake_number}
              </span>
              <div className="text-sm">
                <span className="font-medium text-primary-text">
                  {animal.species}
                </span>
                {animal.intake_reason && (
                  <span className="text-sm text-secondary-text ml-2">
                    {" \u2022 "}
                    {animal.intake_reason}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <span className="text-xs text-secondary-text">
                {formatDate(animal.intake_date)}
              </span>
              <span className="intake-pill status-pill-success text-[10px]">
                Under Care
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="hint-row text-xs">
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="inline-icon inline-icon-muted"
          aria-hidden="true"
        >
          <path
            d="M8 14C11.3137 14 14 11.3137 14 8C10.6863 8 8 10.6863 8 14Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M8 14C8 10.6863 5.31371 8 2 8C2 11.3137 4.68629 14 8 14Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path d="M8 14V5.5" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 5.5C9.8 5.2 11.2 3.8 11.5 2C9.7 2.3 8.3 3.7 8 5.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
        Tip: say "show me [intake number]" to view details.
      </p>
    </Card>
  );
}
