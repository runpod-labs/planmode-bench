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

interface ModeResult {
  score: number;
  planCost: number;
  execCost: number;
  totalCost: number;
}

interface TaskResult {
  id: string;
  name: string;
  project: string;
  results: {
    normal: ModeResult;
    "plan-resume": ModeResult;
    "plan-clear": ModeResult;
  };
}

const COLORS = {
  normalExec: "#3B82F6",
  planResumePlan: "#C4B5FD",
  planResumeExec: "#8B5CF6",
  planClearPlan: "#6EE7B7",
  planClearExec: "#10B981",
};

export default function CostBreakdownChart({
  tasks,
}: {
  tasks: TaskResult[];
}) {
  const data = tasks.map((t) => ({
    name: t.name.length > 20 ? t.name.slice(0, 18) + "..." : t.name,
    fullName: t.name,
    "Normal": t.results.normal.totalCost,
    "P+R Plan": t.results["plan-resume"].planCost,
    "P+R Exec": t.results["plan-resume"].execCost,
    "P+C Plan": t.results["plan-clear"].planCost,
    "P+C Exec": t.results["plan-clear"].execCost,
  }));

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-1 text-lg font-semibold">Cost Breakdown by Task</h2>
      <p className="mb-4 text-xs text-text-muted">
        Plan modes add planning cost on top of execution cost. Normal mode has no
        planning phase.
      </p>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} barCategoryGap="15%">
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
          <XAxis
            dataKey="name"
            tick={{ fill: "#9898b0", fontSize: 10 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
            angle={-35}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: "#9898b0", fontSize: 13 }}
            axisLine={{ stroke: "#2a2a3a" }}
            tickLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(1)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#232330",
              border: "1px solid #2a2a3a",
              borderRadius: "8px",
              color: "#f0f0f5",
              fontSize: "12px",
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "#9898b0" }} />
          <Bar
            dataKey="Normal"
            fill={COLORS.normalExec}
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="P+R Plan" stackId="pr" fill={COLORS.planResumePlan} />
          <Bar
            dataKey="P+R Exec"
            stackId="pr"
            fill={COLORS.planResumeExec}
            radius={[4, 4, 0, 0]}
          />
          <Bar dataKey="P+C Plan" stackId="pc" fill={COLORS.planClearPlan} />
          <Bar
            dataKey="P+C Exec"
            stackId="pc"
            fill={COLORS.planClearExec}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
