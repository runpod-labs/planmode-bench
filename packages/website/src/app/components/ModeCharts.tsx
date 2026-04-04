"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Stats {
  avgScore: number;
  avgCost: number;
  avgTokens: number;
  avgTurns: number;
  avgDurationMs: number;
  n: number;
}

interface Props {
  overall: {
    normal: Stats;
    "normal-guided": Stats;
    "plan-resume": Stats;
    "plan-clear": Stats;
  };
}

const MODES = [
  { key: "normal" as const, label: "One-shot", color: "#6888f0" },
  { key: "normal-guided" as const, label: "Guided", color: "#f0a850" },
  { key: "plan-resume" as const, label: "Plan+Resume", color: "#9b7ef0" },
  { key: "plan-clear" as const, label: "Plan+Clear", color: "#5ec9a0" },
];

const tooltipStyle = {
  backgroundColor: "oklch(0.17 0.005 285.885)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "6px",
  color: "oklch(0.985 0 0)",
  fontSize: "12px",
};

function formatDuration(ms: number): string {
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

function MiniChart({
  title,
  data,
  formatter,
  tooltipFormatter,
}: {
  title: string;
  data: { name: string; value: number; color: string }[];
  formatter: (v: number) => string;
  tooltipFormatter?: (v: number) => string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div>
      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/50 mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="25%">
          <XAxis
            dataKey="name"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={formatter}
            domain={[0, maxVal * 1.15]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [
              (tooltipFormatter || formatter)(value),
              undefined,
            ]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ModeCharts({ overall }: Props) {
  const activeModes = MODES.filter((m) => overall[m.key].n > 0);

  const scoreData = activeModes.map((m) => ({
    name: m.label,
    value: Math.round(overall[m.key].avgScore * 1000) / 10,
    color: m.color,
  }));

  const costData = activeModes.map((m) => ({
    name: m.label,
    value: overall[m.key].avgCost,
    color: m.color,
  }));

  const tokenData = activeModes.map((m) => ({
    name: m.label,
    value: overall[m.key].avgTokens,
    color: m.color,
  }));

  const durationData = activeModes.map((m) => ({
    name: m.label,
    value: overall[m.key].avgDurationMs,
    color: m.color,
  }));

  return (
    <div>
      <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-8">
        Visual comparison
      </h2>
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <MiniChart
          title="Avg Score"
          data={scoreData}
          formatter={(v) => `${v}%`}
        />
        <MiniChart
          title="Avg Cost / Task"
          data={costData}
          formatter={(v) => `$${v.toFixed(2)}`}
          tooltipFormatter={(v) => `$${v.toFixed(3)}`}
        />
        <MiniChart
          title="Avg Tokens"
          data={tokenData}
          formatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
          tooltipFormatter={(v) => v.toLocaleString()}
        />
        <MiniChart
          title="Avg Duration"
          data={durationData}
          formatter={formatDuration}
        />
      </div>
    </div>
  );
}
