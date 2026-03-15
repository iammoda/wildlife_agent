"use client";

import { StatisticsResult } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface StatisticsCardProps {
  data: StatisticsResult;
}

export function StatisticsCard({ data }: StatisticsCardProps) {
  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-3">
        <h3
          className="font-title text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {data.title}
        </h3>
        {data.summary && (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {data.summary}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          {data.items.map((item, index) => (
            <div key={index} className="space-y-0.5">
              <div
                className="text-xl font-semibold"
                style={{ color: "var(--color-brand-accent)" }}
              >
                {item.value}
              </div>
              <div
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {item.label}
              </div>
              {item.subvalue && (
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {item.subvalue}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
