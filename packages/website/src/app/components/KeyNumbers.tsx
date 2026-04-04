"use client";

import { Trophy, DollarSign, Clock, Hash, Zap, Compass, BookOpen, Scissors } from "lucide-react";

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
  { key: "normal" as const, label: "One-shot", bg: "bg-mode-n/15", text: "text-mode-n", icon: Zap },
  { key: "normal-guided" as const, label: "Guided", bg: "bg-mode-g/15", text: "text-mode-g", icon: Compass },
  { key: "plan-resume" as const, label: "Plan + Resume", bg: "bg-mode-pr/15", text: "text-mode-pr", icon: BookOpen },
  { key: "plan-clear" as const, label: "Plan + Clear", bg: "bg-mode-pc/15", text: "text-mode-pc", icon: Scissors },
];

function pct(value: number, baseline: number): string {
  if (baseline === 0) return "—";
  const diff = ((value - baseline) / baseline) * 100;
  if (Math.abs(diff) < 1) return "same";
  return `${diff > 0 ? "+" : ""}${diff.toFixed(0)}%`;
}

function pctColor(value: number, baseline: number, lowerIsBetter: boolean): string {
  if (baseline === 0) return "text-muted-foreground/40";
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

  return (
    <div>
      <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-6">
        Results at a glance
      </h2>
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 pb-3 border-b border-border">
            <div />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Trophy className="h-3.5 w-3.5" /> Score
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <DollarSign className="h-3.5 w-3.5" /> Cost/task
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Clock className="h-3.5 w-3.5" /> Duration
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Hash className="h-3.5 w-3.5" /> Turns
            </div>
          </div>

          {MODES.map((m) => {
            const s = overall[m.key];
            if (s.n === 0) return null;
            const isBaseline = m.key === "normal";
            const Icon = m.icon;

            return (
              <div key={m.key} className="grid grid-cols-[1fr_100px_100px_100px_100px] gap-3 items-center border-b border-border/40 py-4">
                <div className="flex items-center gap-2.5">
                  <span className={`flex items-center justify-center h-6 w-6 rounded-md ${m.bg} ${m.text} shrink-0`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium">{m.label}</span>
                  {isBaseline && (
                    <span className="text-[10px] font-mono text-muted-foreground/40">baseline</span>
                  )}
                </div>

                <div>
                  <div className="text-sm font-mono font-semibold tabular-nums">{(s.avgScore * 100).toFixed(1)}%</div>
                  {!isBaseline && (
                    <div className={`text-[11px] font-mono tabular-nums ${pctColor(s.avgScore, baseline.avgScore, false)}`}>
                      {pct(s.avgScore, baseline.avgScore)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-mono tabular-nums">${s.avgCost.toFixed(2)}</div>
                  {!isBaseline && (
                    <div className={`text-[11px] font-mono tabular-nums ${pctColor(s.avgCost, baseline.avgCost, true)}`}>
                      {pct(s.avgCost, baseline.avgCost)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-mono tabular-nums">{formatDuration(s.avgDurationMs)}</div>
                  {!isBaseline && (
                    <div className={`text-[11px] font-mono tabular-nums ${pctColor(s.avgDurationMs, baseline.avgDurationMs, true)}`}>
                      {pct(s.avgDurationMs, baseline.avgDurationMs)}
                    </div>
                  )}
                </div>

                <div>
                  <div className="text-sm font-mono tabular-nums">{Math.round(s.avgTurns)}</div>
                  {!isBaseline && (
                    <div className={`text-[11px] font-mono tabular-nums ${pctColor(s.avgTurns, baseline.avgTurns, true)}`}>
                      {pct(s.avgTurns, baseline.avgTurns)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
