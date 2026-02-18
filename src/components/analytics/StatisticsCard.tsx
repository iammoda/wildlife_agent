"use client";

import { StatisticsResult } from "@/lib/types";
import { Card } from "@/components/ui/Card";

interface StatisticsCardProps {
  data: StatisticsResult;
}

export function StatisticsCard({ data }: StatisticsCardProps) {
  return (
    <Card variant="bordered" className="space-y-3">
      <h3 className="font-semibold text-primary-text">{data.title}</h3>
      {data.summary && (
        <p className="text-sm text-secondary-text">{data.summary}</p>
      )}
      <div className="grid grid-cols-2 gap-3">
        {data.items.map((item, index) => (
          <div
            key={index}
            className="bg-soft-mist/50 rounded-lg p-3 text-center"
          >
            <div className="text-2xl font-semibold text-wildlife-green">
              {item.value}
            </div>
            <div className="text-sm text-secondary-text">{item.label}</div>
            {item.subvalue && (
              <div className="text-xs text-secondary-text mt-1">
                {item.subvalue}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
