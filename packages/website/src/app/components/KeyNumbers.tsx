"use client";

import { Trophy, DollarSign, Clock, Hash, Zap, BookOpen, Scissors } from "lucide-react";

interface Stats {
  avgScore: number;
  avgCost: number;
  avgTokens: number;
  avgTurns: number;
  avgDurationMs: number;
  n: number;
}

interface Props {
  overall: Record<string, Stats>;
}

const MODES = [
  { key: "normal" as const, label: "one-shot", bg: "bg-mode-n/15", text: "text-mode-n", barColor: "bg-mode-n", icon: Zap },
  { key: "plan-resume" as const, label: "plan + resume", bg: "bg-mode-pr/15", text: "text-mode-pr", barColor: "bg-mode-pr", icon: BookOpen },
  { key: "plan-clear" as const, label: "plan + clear", bg: "bg-mode-pc/15", text: "text-mode-pc", barColor: "bg-mode-pc", icon: Scissors },
];

function pct(value: number, baseline: number): string {
  if (baseline === 0) return "";
  const diff = ((value - baseline) / baseline) * 100;
  if (Math.abs(diff) < 1) return "";
  return `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;
}

function pctColor(value: number, baseline: number, lowerIsBetter: boolean): string {
  if (baseline === 0) return "text-muted-foreground";
  const diff = ((value - baseline) / baseline) * 100;
  if (Math.abs(diff) < 1) return "text-muted-foreground";
  if (lowerIsBetter) return diff < 0 ? "text-emerald-400" : "text-red-400";
  return diff > 0 ? "text-emerald-400" : "text-red-400";
}

function formatDuration(ms: number): string {
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}


export default function KeyNumbers({ overall }: Props) {
  const baseline = overall.normal;
  const active = MODES.filter((m) => overall[m.key]?.n);

  const maxScore = Math.max(...active.map((m) => overall[m.key]!.avgScore));
  const maxCost = Math.max(...active.map((m) => overall[m.key]!.avgCost));
  const maxDuration = Math.max(...active.map((m) => overall[m.key]!.avgDurationMs));
  const maxTurns = Math.max(...active.map((m) => overall[m.key]!.avgTurns));

  const metrics = [
    { label: "score", icon: Trophy, getValue: (s: Stats) => Math.round(s.avgScore * 100) + "%", getRaw: (s: Stats) => s.avgScore, max: maxScore, lowerIsBetter: false },
    { label: "cost/task", icon: DollarSign, getValue: (s: Stats) => "$" + s.avgCost.toFixed(2), getRaw: (s: Stats) => s.avgCost, max: maxCost, lowerIsBetter: true },
    { label: "duration", icon: Clock, getValue: (s: Stats) => formatDuration(s.avgDurationMs), getRaw: (s: Stats) => s.avgDurationMs, max: maxDuration, lowerIsBetter: true },
    { label: "turns", icon: Hash, getValue: (s: Stats) => String(Math.round(s.avgTurns)), getRaw: (s: Stats) => s.avgTurns, max: maxTurns, lowerIsBetter: true },
  ];

  return (
    <div>
      <h2 className="text-lg font-mono uppercase tracking-widest text-foreground/70 mb-10 text-center mt-8">
        results at a glance
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <div key={metric.label} className="rounded-xl border border-border bg-card/30 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
                <MetricIcon className="h-4 w-4" />
                {metric.label}
              </div>

              <div className="space-y-4">
                {active.map((m) => {
                  const s = overall[m.key]!;
                  const Icon = m.icon;
                  const isBaseline = m.key === "normal";
                  const raw = metric.getRaw(s);
                  const baselineRaw = metric.getRaw(baseline);
                  const diffLabel = isBaseline ? "" : pct(raw, baselineRaw);
                  const barPct = metric.max > 0 ? (raw / metric.max) * 100 : 0;
                  const basePct = metric.max > 0 ? (baselineRaw / metric.max) * 100 : 0;
                  const isMore = raw > baselineRaw;
                  const deltaPct = Math.abs(barPct - basePct);

                  return (
                    <div key={m.key} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center justify-center h-4 w-4 rounded ${m.bg} ${m.text} shrink-0`}>
                          <Icon className="h-2.5 w-2.5" />
                        </span>
                        <span className="text-xs text-muted-foreground flex-1">{m.label}</span>
                        <span className="text-sm font-mono font-medium tabular-nums text-right">{metric.getValue(s)}</span>
                      </div>
                      <div className="relative">
                        <div className="relative h-7 w-full rounded-md bg-muted/20 overflow-hidden">
                          {isBaseline || deltaPct < 5 ? (
                            /* Simple solid bar — baseline or negligible delta */
                            <div className={`absolute inset-y-0 left-0 ${m.barColor} opacity-80`} style={{ width: `${barPct}%` }} />
                          ) : isMore ? (
                            <>
                              {/* Baseline reference portion in muted one-shot color */}
                              <div className="absolute inset-y-0 left-0 bg-mode-n/20" style={{ width: `${basePct}%` }} />
                              {/* Delta extension in plan mode color */}
                              <div className={`absolute inset-y-0 ${m.barColor} border-l border-white/10`} style={{ left: `${basePct}%`, width: `${deltaPct}%` }} />
                            </>
                          ) : (
                            <>
                              {/* Plan mode bar (shorter than baseline) */}
                              <div className={`absolute inset-y-0 left-0 ${m.barColor} opacity-80`} style={{ width: `${barPct}%` }} />
                              {/* Subtle deficit area */}
                              <div className="absolute inset-y-0 bg-foreground/[0.03]" style={{ left: `${barPct}%`, width: `${deltaPct}%` }} />
                              {/* Baseline reference marker */}
                              <div className="absolute top-1 bottom-1 w-px bg-mode-n/30" style={{ left: `${basePct}%` }} />
                            </>
                          )}
                        </div>
                        {/* Delta label centered on the delta segment */}
                        {diffLabel && (
                          <span
                            className="absolute top-1/2 text-[11px] font-mono font-semibold tabular-nums whitespace-nowrap text-foreground drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                            style={{ left: `calc(${Math.min(barPct, basePct)}% + 6px)`, transform: 'translateY(-50%)' }}
                          >
                            {diffLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
