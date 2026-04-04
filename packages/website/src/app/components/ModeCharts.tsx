"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Trophy, DollarSign, Hash, Clock, Zap, Compass, BookOpen, Scissors } from "lucide-react";

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
  { key: "normal" as const, label: "one-shot", color: "#6888f0", icon: Zap, bg: "bg-mode-n/15", text: "text-mode-n" },
  { key: "plan-resume" as const, label: "plan+resume", color: "#9b7ef0", icon: BookOpen, bg: "bg-mode-pr/15", text: "text-mode-pr" },
  { key: "plan-clear" as const, label: "plan+clear", color: "#5ec9a0", icon: Scissors, bg: "bg-mode-pc/15", text: "text-mode-pc" },
];

const tooltipStyle = {
  backgroundColor: "oklch(0.17 0.005 285.885)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "6px",
  color: "oklch(0.985 0 0)",
  fontSize: "13px",
};

function formatDuration(ms: number): string {
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

interface ChartDatum {
  name: string;
  value: number;
  color: string;
  label: string;
  modeKey: string;
}

function ChartCard({
  title,
  icon,
  data,
  formatter,
  modes,
}: {
  title: string;
  icon: React.ReactNode;
  data: ChartDatum[];
  formatter: (v: number) => string;
  modes: typeof MODES;
}) {
  const maxVal = Math.max(...data.map((d) => d.value));

  return (
    <div className="rounded-xl border border-border bg-card/30 p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barCategoryGap="20%">
          <XAxis
            dataKey="name"
            tick={false}
            axisLine={false}
            tickLine={false}
            height={0}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
            tickFormatter={formatter}
            domain={[0, maxVal * 1.2]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value: number) => [formatter(value), undefined]}
          />
          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
            <LabelList
              dataKey="label"
              position="top"
              fill="rgba(255,255,255,0.85)"
              fontSize={13}
              fontWeight={500}
              fontFamily="var(--font-sans)"
              offset={8}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Icon labels below bars */}
      <div className="grid" style={{ gridTemplateColumns: `52px repeat(${data.length}, 1fr)` }}>
        <div />
        {data.map((d) => {
          const mode = modes.find((m) => m.key === d.modeKey);
          if (!mode) return null;
          const Icon = mode.icon;
          return (
            <div key={d.modeKey} className="flex flex-col items-center gap-1 text-center">
              <span className={`flex items-center justify-center h-5 w-5 rounded-md ${mode.bg} ${mode.text}`}>
                <Icon className="h-3 w-3" />
              </span>
              <span className="text-[11px] text-muted-foreground">{d.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ModeCharts({ overall }: Props) {
  const activeModes = MODES.filter((m) => overall[m.key]?.n > 0);

  function buildData(getValue: (s: Stats) => number, fmt: (v: number) => string): ChartDatum[] {
    return activeModes.map((m) => {
      const raw = getValue(overall[m.key]);
      return {
        name: m.label,
        value: raw,
        color: m.color,
        label: fmt(raw),
        modeKey: m.key,
      };
    });
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ChartCard
        title="avg score"
        icon={<Trophy className="h-4 w-4" />}
        data={buildData(
          (s) => Math.round(s.avgScore * 1000) / 10,
          (v) => `${v.toFixed(1)}%`
        )}
        formatter={(v) => `${v.toFixed(0)}%`}
        modes={activeModes}
      />
      <ChartCard
        title="avg cost / task"
        icon={<DollarSign className="h-4 w-4" />}
        data={buildData(
          (s) => s.avgCost,
          (v) => `$${v.toFixed(2)}`
        )}
        formatter={(v) => `$${v.toFixed(2)}`}
        modes={activeModes}
      />
      <ChartCard
        title="avg tokens"
        icon={<Hash className="h-4 w-4" />}
        data={buildData(
          (s) => s.avgTokens,
          (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)
        )}
        formatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)}
        modes={activeModes}
      />
      <ChartCard
        title="avg duration"
        icon={<Clock className="h-4 w-4" />}
        data={buildData(
          (s) => s.avgDurationMs,
          formatDuration
        )}
        formatter={formatDuration}
        modes={activeModes}
      />
    </div>
  );
}
