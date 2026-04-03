"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TaskResult {
  id: string;
  name: string;
  results: {
    normal: { breakdown: Record<string, number> };
    "plan-resume": { breakdown: Record<string, number> };
    "plan-clear": { breakdown: Record<string, number> };
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  correctness: "Correctness",
  completeness: "Completeness",
  codeQuality: "Code Quality",
  edgeCases: "Edge Cases",
};

export default function CategoryChart({ tasks }: { tasks: TaskResult[] }) {
  // Average breakdowns across all tasks
  const categories = Object.keys(tasks[0].results.normal.breakdown);

  const data = categories.map((cat) => {
    const avg = (mode: "normal" | "plan-resume" | "plan-clear") =>
      Math.round(
        tasks.reduce((sum, t) => sum + t.results[mode].breakdown[cat], 0) /
          tasks.length
      );

    return {
      category: CATEGORY_LABELS[cat] || cat,
      Normal: avg("normal"),
      "Plan + Resume": avg("plan-resume"),
      "Plan + Clear": avg("plan-clear"),
    };
  });

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-4 text-lg font-semibold">Category Breakdown (Avg)</h2>
      <ResponsiveContainer width="100%" height={340}>
        <RadarChart data={data}>
          <PolarGrid stroke="#2a2a3a" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "#9898b0", fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: "#5a5a72", fontSize: 11 }}
            axisLine={false}
          />
          <Radar
            name="Normal"
            dataKey="Normal"
            stroke="#3B82F6"
            fill="#3B82F6"
            fillOpacity={0.15}
          />
          <Radar
            name="Plan + Resume"
            dataKey="Plan + Resume"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.15}
          />
          <Radar
            name="Plan + Clear"
            dataKey="Plan + Clear"
            stroke="#10B981"
            fill="#10B981"
            fillOpacity={0.15}
          />
          <Legend wrapperStyle={{ fontSize: "13px", color: "#9898b0" }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
