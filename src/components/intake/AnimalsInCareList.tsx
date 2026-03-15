"use client";

import { useEffect, useState } from "react";
import { IntakeWithRelations } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { getDispositionInfo } from "@/lib/constants";

interface AnimalsInCareListProps {
  animals: IntakeWithRelations[];
  totalCount: number;
  mode?: "under_care" | "all_intakes";
  statusFilter?: string;
  onViewAnimal?: (intakeNumber: string) => void;
}

export function AnimalsInCareList({
  animals,
  totalCount,
  mode = "under_care",
  statusFilter,
  onViewAnimal,
}: AnimalsInCareListProps) {
  const [visibleCount, setVisibleCount] = useState(5);
  const title = mode === "all_intakes" ? "All Intakes" : "Animals Under Care";
  const emptyMessage =
    mode === "all_intakes"
      ? statusFilter
        ? `No intakes found with status "${statusFilter}".`
        : "No intakes found."
      : statusFilter
        ? `No animals found with status "${statusFilter}".`
        : "No animals currently under care.";

  useEffect(() => {
    setVisibleCount(5);
  }, [animals.length]);

  if (animals.length === 0) {
    return (
      <Card variant="bordered">
        <p
          className="text-sm text-center py-4"
          style={{ color: "var(--color-text-muted)" }}
        >
          {emptyMessage}
        </p>
      </Card>
    );
  }

  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3
            className="font-title text-base font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {title}
          </h3>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {totalCount}
          </span>
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {animals.slice(0, visibleCount).map((animal) => {
            const relationDisposition = animal.dispositions;
            const relationCode = Array.isArray(relationDisposition)
              ? relationDisposition[0]?.disposition_code
              : relationDisposition?.disposition_code;
            const disp = getDispositionInfo(animal.disposition ?? relationCode);
            const dateStr = formatShortDate(animal.intake_date);

            return (
              <div
                key={animal.id}
                className="flex items-center gap-3 py-2 px-2 rounded-lg transition-colors"
                style={{
                  cursor: onViewAnimal ? "pointer" : undefined,
                }}
                onClick={() => onViewAnimal?.(animal.intake_number)}
                onMouseEnter={(e) => {
                  if (onViewAnimal)
                    e.currentTarget.style.backgroundColor =
                      "var(--color-bg-tertiary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {/* Intake number */}
                <span
                  className="font-mono text-xs flex-shrink-0"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {animal.intake_number}
                </span>

                {/* Species + reason */}
                <span
                  className="text-sm flex-1 min-w-0 truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {animal.species}
                  {animal.intake_reason && (
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {" \u00B7 "}
                      {animal.intake_reason}
                    </span>
                  )}
                </span>

                {/* Date + status */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs hidden sm:inline"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {dateStr}
                  </span>
                  {mode === "all_intakes" && (
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{
                        color: disp.isPositive
                          ? "var(--color-success)"
                          : "var(--color-error)",
                        backgroundColor: disp.isPositive
                          ? "color-mix(in srgb, var(--color-success) 12%, transparent)"
                          : "color-mix(in srgb, var(--color-error) 12%, transparent)",
                      }}
                    >
                      {disp.shortTitle}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more */}
        {visibleCount < animals.length && (
          <button
            onClick={() =>
              setVisibleCount((prev) => Math.min(prev + 5, animals.length))
            }
            className="text-xs transition-colors"
            style={{ color: "var(--color-brand-accent)" }}
          >
            Show {Math.min(5, animals.length - visibleCount)} more
          </button>
        )}

        {totalCount > animals.length && (
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Showing {animals.length} of {totalCount}
          </p>
        )}

        {/* Hint */}
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Tap a row to view details.
        </p>
      </div>
    </Card>
  );
}

function formatShortDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
