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
  "#4C7A5A",
  "#C78B3A",
  "#3B82F6",
  "#EF4444",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
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
          <CartesianGrid strokeDasharray="3 3" stroke="#3A423A" />
          <XAxis
            dataKey={data.xKey || "name"}
            tick={{ fill: "#A8B0A8", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#A8B0A8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#242824",
              border: "1px solid #3A423A",
              borderRadius: "8px",
              color: "#F0F2F0",
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
          <CartesianGrid strokeDasharray="3 3" stroke="#3A423A" />
          <XAxis
            dataKey={data.xKey || "name"}
            tick={{ fill: "#A8B0A8", fontSize: 12 }}
          />
          <YAxis tick={{ fill: "#A8B0A8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#242824",
              border: "1px solid #3A423A",
              borderRadius: "8px",
              color: "#F0F2F0",
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
            label={({ name, percent, x, y }) => {
              const safePercent = percent ?? 0;
              return (
                <text
                  x={Number(x)}
                  y={Number(y)}
                  fill="#F0F2F0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                >
                  {`${name} (${(safePercent * 100).toFixed(0)}%)`}
                </text>
              );
            }}
            labelLine={{ stroke: "#A8B0A8" }}
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
              backgroundColor: "#242824",
              border: "1px solid #3A423A",
              borderRadius: "8px",
              color: "#F0F2F0",
            }}
          />
          <Legend wrapperStyle={{ color: "#A8B0A8" }} />
        </PieChart>
      );
    default:
      return <div>Unsupported chart type</div>;
  }
}
