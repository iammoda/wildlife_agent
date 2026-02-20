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
    <Card variant="bordered" className="space-y-3">
      <h3 className="font-semibold text-primary-text">
        Animals Under Care ({animals.length})
      </h3>
      <div className="space-y-2">
        {animals.map((animal) => (
          <div
            key={animal.id}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ backgroundColor: "var(--color-bg-secondary)" }}
          >
            <div className="flex items-center gap-3">
              <span
                className="font-mono text-sm font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: "var(--color-brand-light)",
                  color: "var(--color-brand-primary)",
                }}
              >
                {animal.intake_number}
              </span>
              <div>
                <span className="font-medium text-primary-text">
                  {animal.species}
                </span>
                {animal.intake_reason && (
                  <span className="text-sm text-secondary-text ml-2">
                    ({animal.intake_reason})
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-xs text-secondary-text">
                {formatDate(animal.intake_date)}
              </span>
              <span className="text-[10px] font-medium rounded-full px-2 py-0.5 bg-success-green/10 text-success-green">
                Under Care
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-secondary-text">
        Tip: say "show me [intake number]" to view details.
      </p>
    </Card>
  );
}
