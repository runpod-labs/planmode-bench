"use client";

interface ModeResult {
  score: number;
  maxScore: number;
  pass: boolean;
  cost: number;
}

interface TaskResult {
  results: {
    normal: ModeResult;
    "plan-resume": ModeResult;
    "plan-clear": ModeResult;
  };
}

function avg(nums: number[]): number {
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function avgCost(nums: number[]): string {
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(3);
}

function pct(nums: boolean[]): number {
  return Math.round((nums.filter(Boolean).length / nums.length) * 100);
}

export default function StatsCards({ tasks }: { tasks: TaskResult[] }) {
  const modes = ["normal", "plan-resume", "plan-clear"] as const;

  const stats = modes.map((mode) => ({
    mode,
    avgScore: avg(tasks.map((t) => t.results[mode].score)),
    avgCost: avgCost(tasks.map((t) => t.results[mode].cost)),
    successRate: pct(tasks.map((t) => t.results[mode].pass)),
  }));

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

  const costDelta =
    ((parseFloat(stats[2].avgCost) - parseFloat(stats[0].avgCost)) /
      parseFloat(stats[0].avgCost)) *
    100;

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
              {s.avgScore}
            </div>
            <div className="mt-0.5 text-xs text-text-muted">avg score / 100</div>
            <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
              <span>Avg cost: ${s.avgCost}</span>
              <span>Pass: {s.successRate}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="text-sm text-text-secondary">
            Score delta (Plan+Clear vs Normal)
          </div>
          <div className="mt-1 text-2xl font-bold text-plan-clear">
            +{stats[2].avgScore - stats[0].avgScore} pts
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            {(
              ((stats[2].avgScore - stats[0].avgScore) / stats[0].avgScore) *
              100
            ).toFixed(1)}
            % improvement
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface-raised p-5">
          <div className="text-sm text-text-secondary">
            Cost delta (Plan+Clear vs Normal)
          </div>
          <div
            className={`mt-1 text-2xl font-bold ${costDelta > 0 ? "text-amber-400" : "text-plan-clear"}`}
          >
            {costDelta > 0 ? "+" : ""}
            {costDelta.toFixed(1)}%
          </div>
          <div className="mt-0.5 text-xs text-text-muted">
            ${stats[0].avgCost} vs ${stats[2].avgCost} per task
          </div>
        </div>
      </div>
    </div>
  );
}
