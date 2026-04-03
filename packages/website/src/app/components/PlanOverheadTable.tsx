"use client";

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

function fmt(n: number): string {
  return "$" + n.toFixed(2);
}

function pct(overhead: number): string {
  if (!isFinite(overhead)) return "N/A";
  return (overhead > 0 ? "+" : "") + overhead.toFixed(0) + "%";
}

export default function PlanOverheadTable({
  tasks,
}: {
  tasks: TaskResult[];
}) {
  // Compute averages
  const avgNormalCost =
    tasks.reduce((s, t) => s + t.results.normal.totalCost, 0) / tasks.length;
  const avgPRPlanCost =
    tasks.reduce((s, t) => s + t.results["plan-resume"].planCost, 0) /
    tasks.length;
  const avgPRExecCost =
    tasks.reduce((s, t) => s + t.results["plan-resume"].execCost, 0) /
    tasks.length;
  const avgPRTotal =
    tasks.reduce((s, t) => s + t.results["plan-resume"].totalCost, 0) /
    tasks.length;
  const avgPCPlanCost =
    tasks.reduce((s, t) => s + t.results["plan-clear"].planCost, 0) /
    tasks.length;
  const avgPCExecCost =
    tasks.reduce((s, t) => s + t.results["plan-clear"].execCost, 0) /
    tasks.length;
  const avgPCTotal =
    tasks.reduce((s, t) => s + t.results["plan-clear"].totalCost, 0) /
    tasks.length;

  const prOverhead = ((avgPRTotal - avgNormalCost) / avgNormalCost) * 100;
  const pcOverhead = ((avgPCTotal - avgNormalCost) / avgNormalCost) * 100;

  const prPlanPct = (avgPRPlanCost / avgPRTotal) * 100;
  const pcPlanPct = (avgPCPlanCost / avgPCTotal) * 100;

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-1 text-lg font-semibold">
        Plan Cost Overhead Analysis
      </h2>
      <p className="mb-5 text-xs text-text-muted">
        Planning adds significant cost without improving quality. The plan phase
        alone often exceeds the total normal mode cost.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-normal/20 bg-normal/5 p-4">
          <div className="text-xs text-text-muted">Normal (baseline)</div>
          <div className="mt-1 text-xl font-bold font-mono text-normal">
            {fmt(avgNormalCost)}
          </div>
          <div className="text-xs text-text-muted">avg total / task</div>
        </div>
        <div className="rounded-lg border border-plan-resume/20 bg-plan-resume/5 p-4">
          <div className="text-xs text-text-muted">Plan+Resume</div>
          <div className="mt-1 text-xl font-bold font-mono text-plan-resume">
            {fmt(avgPRTotal)}
          </div>
          <div className="mt-1 flex gap-3 text-xs text-text-muted">
            <span>Plan: {fmt(avgPRPlanCost)} ({prPlanPct.toFixed(0)}%)</span>
            <span>Exec: {fmt(avgPRExecCost)}</span>
          </div>
          <div className="mt-1 text-xs font-medium text-amber-400">
            {pct(prOverhead)} overhead vs Normal
          </div>
        </div>
        <div className="rounded-lg border border-plan-clear/20 bg-plan-clear/5 p-4">
          <div className="text-xs text-text-muted">Plan+Clear</div>
          <div className="mt-1 text-xl font-bold font-mono text-plan-clear">
            {fmt(avgPCTotal)}
          </div>
          <div className="mt-1 flex gap-3 text-xs text-text-muted">
            <span>Plan: {fmt(avgPCPlanCost)} ({pcPlanPct.toFixed(0)}%)</span>
            <span>Exec: {fmt(avgPCExecCost)}</span>
          </div>
          <div className="mt-1 text-xs font-medium text-amber-400">
            {pct(pcOverhead)} overhead vs Normal
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="pb-2 pr-3 font-medium">Task</th>
              <th className="pb-2 pr-3 text-center font-medium text-normal">
                Normal Total
              </th>
              <th className="pb-2 pr-3 text-center font-medium text-plan-resume">
                P+R Plan
              </th>
              <th className="pb-2 pr-3 text-center font-medium text-plan-resume">
                P+R Total
              </th>
              <th className="pb-2 pr-3 text-center font-medium">
                P+R Overhead
              </th>
              <th className="pb-2 pr-3 text-center font-medium text-plan-clear">
                P+C Plan
              </th>
              <th className="pb-2 pr-3 text-center font-medium text-plan-clear">
                P+C Total
              </th>
              <th className="pb-2 text-center font-medium">P+C Overhead</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const normalTotal = task.results.normal.totalCost;
              const prPlan = task.results["plan-resume"].planCost;
              const prTotal = task.results["plan-resume"].totalCost;
              const pcPlan = task.results["plan-clear"].planCost;
              const pcTotal = task.results["plan-clear"].totalCost;
              const prOh =
                normalTotal > 0
                  ? ((prTotal - normalTotal) / normalTotal) * 100
                  : 0;
              const pcOh =
                normalTotal > 0
                  ? ((pcTotal - normalTotal) / normalTotal) * 100
                  : 0;

              return (
                <tr
                  key={task.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="py-2 pr-3 font-medium text-text-primary">
                    {task.name}
                  </td>
                  <td className="py-2 pr-3 text-center font-mono text-normal">
                    {fmt(normalTotal)}
                  </td>
                  <td className="py-2 pr-3 text-center font-mono text-text-muted">
                    {fmt(prPlan)}
                  </td>
                  <td className="py-2 pr-3 text-center font-mono text-plan-resume">
                    {fmt(prTotal)}
                  </td>
                  <td className="py-2 pr-3 text-center font-mono text-amber-400">
                    {pct(prOh)}
                  </td>
                  <td className="py-2 pr-3 text-center font-mono text-text-muted">
                    {fmt(pcPlan)}
                  </td>
                  <td className="py-2 pr-3 text-center font-mono text-plan-clear">
                    {fmt(pcTotal)}
                  </td>
                  <td className="py-2 text-center font-mono text-amber-400">
                    {pct(pcOh)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
