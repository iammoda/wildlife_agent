"use client";

import { ChartData } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartCardProps {
  data: ChartData;
}

const COLORS = [
  "#2D5A27",
  "#7C5C3B",
  "#22C55E",
  "#6B7280",
  "#EF4444",
];

export function ChartCard({ data }: ChartCardProps) {
  return (
    <Card variant="bordered" className="space-y-3">
      <h3 className="font-semibold text-primary-text">{data.title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(data)}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function renderChart(data: ChartData) {
  switch (data.type) {
    case "bar":
      return (
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7EFE9" />
          <XAxis
            dataKey={data.xKey || "name"}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E7EFE9",
              borderRadius: "8px",
            }}
          />
          <Bar
            dataKey={data.yKey || "value"}
            fill="#2D5A27"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E7EFE9" />
          <XAxis
            dataKey={data.xKey || "name"}
            tick={{ fill: "#6B7280", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E7EFE9",
              borderRadius: "8px",
            }}
          />
          <Line
            type="monotone"
            dataKey={data.yKey || "value"}
            stroke="#2D5A27"
            strokeWidth={2}
            dot={{ fill: "#2D5A27" }}
          />
        </LineChart>
      );
    case "pie":
      return (
        <PieChart>
          <Pie
            data={data.data}
            dataKey={data.valueKey || "value"}
            nameKey={data.nameKey || "name"}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => {
              const safePercent = percent ?? 0;
              return `${name} (${(safePercent * 100).toFixed(0)}%)`;
            }}
          >
            {data.data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #E7EFE9",
              borderRadius: "8px",
            }}
          />
          <Legend />
        </PieChart>
      );
    default:
      return <div>Unsupported chart type</div>;
  }
}
