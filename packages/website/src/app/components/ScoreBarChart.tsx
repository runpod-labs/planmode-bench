"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TaskResult {
  id: string;
  name: string;
  results: {
    normal: { score: number };
    "plan-resume": { score: number };
    "plan-clear": { score: number };
  };
}

const COLORS = {
  normal: "#3B82F6",
  "plan-resume": "#8B5CF6",
  "plan-clear": "#10B981",
};

const MODE_LABELS: Record<string, string> = {
  normal: "Normal",
  "plan-resume": "Plan + Resume",
  "plan-clear": "Plan + Clear",
};

export default function ScoreBarChart({ tasks }: { tasks: TaskResult[] }) {
  const data = tasks.map((t) => ({
    name: t.name,
    Normal: t.results.normal.score,
    "Plan + Resume": t.results["plan-resume"].score,
    "Plan + Clear": t.results["plan-clear"].score,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-4 text-lg font-semibold">Scores by Task</h2>
      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9898b0", fontSize: 13 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#9898b0", fontSize: 13 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#232330",
              border: "1px solid #2a2a3a",
              borderRadius: "8px",
              color: "#f0f0f5",
              fontSize: "13px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "13px", color: "#9898b0" }}
          />
          <Bar
            dataKey="Normal"
            fill={COLORS.normal}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Plan + Resume"
            fill={COLORS["plan-resume"]}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="Plan + Clear"
            fill={COLORS["plan-clear"]}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
