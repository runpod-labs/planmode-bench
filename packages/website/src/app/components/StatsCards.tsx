"use client";

interface OverallStats {
  avgScore: number;
  medianScore: number;
  successRate: number;
  avgCost: number;
  avgTokens: number;
  avgTurns: number;
}

interface OverallData {
  normal: OverallStats;
  "plan-resume": OverallStats;
  "plan-clear": OverallStats;
}

const MODES = ["normal", "plan-resume", "plan-clear"] as const;

const labels: Record<string, string> = {
  normal: "Normal",
  "plan-resume": "Plan + Resume",
  "plan-clear": "Plan + Clear",
};

const colors: Record<string, string> = {
  normal: "border-normal/30 bg-normal/5",
  "plan-resume": "border-plan-resume/30 bg-plan-resume/5",
  "plan-clear": "border-plan-clear/30 bg-plan-clear/5",
};

const textColors: Record<string, string> = {
  normal: "text-normal",
  "plan-resume": "text-plan-resume",
  "plan-clear": "text-plan-clear",
};

export default function StatsCards({ overall }: { overall: OverallData }) {
  const stats = MODES.map((mode) => ({
    mode,
    avgScore: overall[mode].avgScore,
    avgCost: overall[mode].avgCost,
    successRate: overall[mode].successRate,
    avgTurns: overall[mode].avgTurns,
  }));

  const normalCost = stats[0].avgCost;
  const planResumeCost = stats[1].avgCost;
  const planClearCost = stats[2].avgCost;

  const planResumeOverhead = ((planResumeCost - normalCost) / normalCost) * 100;
  const planClearOverhead = ((planClearCost - normalCost) / normalCost) * 100;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.mode}
            className={`rounded-xl border p-5 ${colors[s.mode]}`}
          >
            <div className="text-sm text-text-secondary">{labels[s.mode]}</div>
            <div className={`mt-1 text-3xl font-bold ${textColors[s.mode]}`}>
              {(s.avgScore * 100).toFixed(1)}
            </div>
            <div className="mt-0.5 text-xs text-text-muted">
              avg score / 100
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span>Avg cost: ${s.avgCost.toFixed(2)}</span>
              <span>Avg turns: {s.avgTurns}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-normal/20 bg-normal/5 p-5">
          <div className="text-sm text-text-secondary">
            Normal wins on both quality and cost
          </div>
          <div className="mt-1 text-2xl font-bold text-normal">
            Best value
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            Highest score at lowest cost
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="text-sm text-text-secondary">
            Plan+Resume overhead
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-400">
            +{planResumeOverhead.toFixed(0)}%
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            ${normalCost.toFixed(2)} vs ${planResumeCost.toFixed(2)} per task
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="text-sm text-text-secondary">
            Plan+Clear overhead
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-400">
            +{planClearOverhead.toFixed(0)}%
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            ${normalCost.toFixed(2)} vs ${planClearCost.toFixed(2)} per task
          </div>
        </div>
      </div>
    </div>
  );
}
