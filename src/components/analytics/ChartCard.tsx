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

// Earthy palette matching the design system
const COLORS = [
  "var(--color-brand-primary)",   // forest green
  "#7C5C3B",                       // warm brown
  "var(--color-brand-accent)",     // soft green
  "#4C7A5A",                       // muted sage
  "#C78B3A",                       // amber
  "#6B8F71",                       // dusty green
  "#A67C52",                       // tan
  "#3D6B4F",                       // deep green
];

// Chart styling derived from CSS variables (resolved at render)
const GRID_COLOR = "#3A423A";
const TICK_COLOR = "#8A928A";
const TOOLTIP_BG = "#242824";
const TOOLTIP_BORDER = "#3A423A";
const TOOLTIP_TEXT = "#E8EAE8";
const PRIMARY_FILL = "#2D5A27";

export function ChartCard({ data }: ChartCardProps) {
  return (
    <Card variant="bordered" className="animate-fadeIn overflow-hidden">
      <div className="p-4 space-y-3">
        <h3
          className="font-title text-base font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          {data.title}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart(data)}
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}

const tooltipStyle = {
  backgroundColor: TOOLTIP_BG,
  border: `1px solid ${TOOLTIP_BORDER}`,
  borderRadius: "8px",
  color: TOOLTIP_TEXT,
};

function renderChart(data: ChartData) {
  switch (data.type) {
    case "bar":
      return (
        <BarChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey={data.xKey || "name"}
            tick={{ fill: TICK_COLOR, fontSize: 12 }}
          />
          <YAxis tick={{ fill: TICK_COLOR, fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar
            dataKey={data.yKey || "value"}
            fill={PRIMARY_FILL}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
    case "line":
      return (
        <LineChart data={data.data}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
          <XAxis
            dataKey={data.xKey || "name"}
            tick={{ fill: TICK_COLOR, fontSize: 12 }}
          />
          <YAxis tick={{ fill: TICK_COLOR, fontSize: 12 }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey={data.yKey || "value"}
            stroke={PRIMARY_FILL}
            strokeWidth={2}
            dot={{ fill: PRIMARY_FILL }}
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
                  fill={TOOLTIP_TEXT}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                >
                  {`${name} (${(safePercent * 100).toFixed(0)}%)`}
                </text>
              );
            }}
            labelLine={{ stroke: TICK_COLOR }}
          >
            {data.data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ color: TICK_COLOR }} />
        </PieChart>
      );
    default:
      return <div>Unsupported chart type</div>;
  }
}
