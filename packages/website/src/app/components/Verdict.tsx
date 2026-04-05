"use client";

import { Equal, TrendingUp, Clock } from "lucide-react";

interface Stats {
  avgScore: number;
  avgCost: number;
  avgDurationMs: number;
  n: number;
}

interface Props {
  overall: Record<string, Stats>;
  totalTasks: number;
  model: string;
}

function formatDuration(ms: number): string {
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

function pctDiff(a: number, b: number): number {
  if (b === 0) return 0;
  return ((a - b) / b) * 100;
}

export default function Verdict({ overall, totalTasks, model }: Props) {
  const oneshot = overall.normal ?? { avgScore: 0, avgCost: 0, avgDurationMs: 0, n: 0 };

  // Average the two plan mode for comparison
  const planModes = [overall["plan-resume"], overall["plan-clear"]].filter(
    (s) => s?.n > 0
  );
  const planAvgScore =
    planModes.reduce((s, m) => s + m.avgScore, 0) / planModes.length;
  const planAvgCost =
    planModes.reduce((s, m) => s + m.avgCost, 0) / planModes.length;
  const planAvgDuration =
    planModes.reduce((s, m) => s + m.avgDurationMs, 0) / planModes.length;

  const scoreDiff = pctDiff(planAvgScore, oneshot.avgScore);
  const costDiff = pctDiff(planAvgCost, oneshot.avgCost);
  const timeDiff = pctDiff(planAvgDuration, oneshot.avgDurationMs);

  const scoreLabel =
    Math.abs(scoreDiff) < 5
      ? "same accuracy"
      : scoreDiff > 0
        ? `+${scoreDiff.toFixed(0)}% better`
        : `${scoreDiff.toFixed(0)}% worse`;

  return (
    <div>
      {/* Claim — constrained width */}
      <div className="mx-auto max-w-5xl">
        <h1 className="text-6xl sm:text-7xl lg:text-8xl font-heading tracking-tight">
          stop using plan mode.
        </h1>
        <p className="mt-14 max-w-5xl text-lg leading-relaxed text-muted-foreground">
          does planning before coding actually help?
          we tested 3 modes across {totalTasks} tasks on real codebases
          like vLLM, bun, T3 Code, llama.cpp, unsloth, diffusers, transformers.js, and AI SDK.
          plan mode costs more, takes longer, and doesn&apos;t improve accuracy
        </p>
      </div>

      {/* Big numbers — full width */}
      <div className="mt-12 grid gap-px bg-border rounded-xl overflow-hidden border border-border sm:grid-cols-3">
        {/* Accuracy */}
        <div className="bg-background p-8 sm:p-10 lg:p-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Equal className="h-4 w-4" />
            accuracy
          </div>
          <div className="text-5xl sm:text-6xl font-heading tabular-nums tracking-tight">
            {scoreLabel}
          </div>
          <div className="mt-4 flex items-baseline gap-3 text-sm font-mono text-muted-foreground">
            <span>
              one-shot{" "}
              <span className="text-foreground font-medium">
                {(oneshot.avgScore * 100).toFixed(0)}%
              </span>
            </span>
            <span className="text-muted-foreground">vs</span>
            <span>
              plan mode{" "}
              <span className="text-foreground font-medium">
                {(planAvgScore * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        </div>

        {/* Cost */}
        <div className="bg-background p-8 sm:p-10 lg:p-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <TrendingUp className="h-4 w-4" />
            cost per task
          </div>
          <div className="text-5xl sm:text-6xl font-heading tabular-nums tracking-tight text-red-400">
            +{costDiff.toFixed(0)}% pricier
          </div>
          <div className="mt-4 flex items-baseline gap-3 text-sm font-mono text-muted-foreground">
            <span>
              one-shot{" "}
              <span className="text-foreground font-medium">
                ${oneshot.avgCost.toFixed(2)}
              </span>
            </span>
            <span className="text-muted-foreground">vs</span>
            <span>
              plan mode{" "}
              <span className="text-foreground font-medium">
                ${planAvgCost.toFixed(2)}
              </span>
            </span>
          </div>
        </div>

        {/* Time */}
        <div className="bg-background p-8 sm:p-10 lg:p-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            time per task
          </div>
          <div className="text-5xl sm:text-6xl font-heading tabular-nums tracking-tight text-red-400">
            +{timeDiff.toFixed(0)}% slower
          </div>
          <div className="mt-4 flex items-baseline gap-3 text-sm font-mono text-muted-foreground">
            <span>
              one-shot{" "}
              <span className="text-foreground font-medium">
                {formatDuration(oneshot.avgDurationMs)}
              </span>
            </span>
            <span className="text-muted-foreground">vs</span>
            <span>
              plan mode{" "}
              <span className="text-foreground font-medium">
                {formatDuration(planAvgDuration)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
