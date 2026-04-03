"use client";

import { useState, useMemo, Fragment } from "react";

interface ModeResult {
  score: number;
  planCost: number;
  execCost: number;
  totalCost: number;
}

interface TaskResult {
  id: string;
  name: string;
  category: string;
  project: string;
  difficulty: string;
  results: {
    normal: ModeResult;
    "plan-resume": ModeResult;
    "plan-clear": ModeResult;
  };
}

const MODES = ["normal", "plan-resume", "plan-clear"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  normal: "Normal",
  "plan-resume": "Plan+Resume",
  "plan-clear": "Plan+Clear",
};

const MODE_COLORS: Record<Mode, string> = {
  normal: "text-normal",
  "plan-resume": "text-plan-resume",
  "plan-clear": "text-plan-clear",
};

const MODE_BG: Record<Mode, string> = {
  normal: "bg-normal/10",
  "plan-resume": "bg-plan-resume/10",
  "plan-clear": "bg-plan-clear/10",
};

const MODE_BORDER: Record<Mode, string> = {
  normal: "border-normal/30",
  "plan-resume": "border-plan-resume/30",
  "plan-clear": "border-plan-clear/30",
};

type SortKey =
  | "task"
  | "project"
  | "normal-score"
  | "normal-plan"
  | "normal-exec"
  | "normal-total"
  | "plan-resume-score"
  | "plan-resume-plan"
  | "plan-resume-exec"
  | "plan-resume-total"
  | "plan-clear-score"
  | "plan-clear-plan"
  | "plan-clear-exec"
  | "plan-clear-total"
  | "overhead";

type SortDir = "asc" | "desc";

function getWinner(results: TaskResult["results"]): Mode | "tie" {
  const scores = MODES.map((m) => ({ mode: m, score: results[m].score }));
  const maxScore = Math.max(...scores.map((s) => s.score));
  const winners = scores.filter((s) => s.score === maxScore);

  if (winners.length === 3) return "tie";
  if (winners.length === 1) return winners[0].mode;

  // Tiebreak by lowest cost
  const cheapest = winners.reduce((a, b) =>
    results[a.mode].totalCost <= results[b.mode].totalCost ? a : b
  );
  return cheapest.mode;
}

function getCostWinner(results: TaskResult["results"]): Mode {
  return MODES.reduce((best, m) =>
    results[m].totalCost < results[best].totalCost ? m : best
  );
}

function fmt(n: number): string {
  return "$" + n.toFixed(2);
}

function fmtScore(n: number): string {
  return (n * 100).toFixed(0);
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <span className="ml-1 inline-block text-text-muted opacity-40">
        {"<>"}
      </span>
    );
  }
  return (
    <span className="ml-1 inline-block text-text-secondary">
      {dir === "asc" ? "\u25B2" : "\u25BC"}
    </span>
  );
}

export default function ResultsTable({ tasks }: { tasks: TaskResult[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("task");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir(key === "task" || key === "project" ? "asc" : "desc");
    }
  }

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      switch (sortKey) {
        case "task":
          va = a.name;
          vb = b.name;
          break;
        case "project":
          va = a.project;
          vb = b.project;
          break;
        case "overhead": {
          const oa =
            a.results.normal.totalCost > 0
              ? ((a.results["plan-clear"].totalCost -
                  a.results.normal.totalCost) /
                  a.results.normal.totalCost) *
                100
              : 0;
          const ob =
            b.results.normal.totalCost > 0
              ? ((b.results["plan-clear"].totalCost -
                  b.results.normal.totalCost) /
                  b.results.normal.totalCost) *
                100
              : 0;
          va = oa;
          vb = ob;
          break;
        }
        default: {
          // Parse the actual field from the sort key
          let actualMode: Mode;
          let actualField: string;
          if (sortKey.startsWith("normal-")) {
            actualMode = "normal";
            actualField = sortKey.replace("normal-", "");
          } else if (sortKey.startsWith("plan-resume-")) {
            actualMode = "plan-resume";
            actualField = sortKey.replace("plan-resume-", "");
          } else if (sortKey.startsWith("plan-clear-")) {
            actualMode = "plan-clear";
            actualField = sortKey.replace("plan-clear-", "");
          } else {
            break;
          }

          const fieldMap: Record<string, keyof ModeResult> = {
            score: "score",
            plan: "planCost",
            exec: "execCost",
            total: "totalCost",
          };
          const f = fieldMap[actualField];
          if (f) {
            va = a.results[actualMode][f];
            vb = b.results[actualMode][f];
          }
          break;
        }
      }

      if (typeof va === "string" && typeof vb === "string") {
        return sortDir === "asc"
          ? va.localeCompare(vb)
          : vb.localeCompare(va);
      }
      return sortDir === "asc"
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number);
    });
    return sorted;
  }, [tasks, sortKey, sortDir]);

  function Th({
    label,
    sortId,
    className = "",
  }: {
    label: string;
    sortId: SortKey;
    className?: string;
  }) {
    return (
      <th
        className={`cursor-pointer select-none whitespace-nowrap pb-3 pr-3 text-xs font-medium transition-colors hover:text-text-primary ${className}`}
        onClick={() => handleSort(sortId)}
      >
        {label}
        <SortIcon active={sortKey === sortId} dir={sortDir} />
      </th>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-1 text-lg font-semibold">Per-Task Results</h2>
      <p className="mb-5 text-xs text-text-muted">
        Click any column header to sort. Scores are 0-100. Costs in USD. Winner
        determined by highest score, then lowest cost.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <Th label="Task" sortId="task" />
              <Th label="Project" sortId="project" />
              {MODES.map((m) => (
                <th
                  key={m}
                  colSpan={4}
                  className={`pb-2 text-center text-xs font-semibold ${MODE_COLORS[m]}`}
                >
                  {MODE_LABELS[m]}
                </th>
              ))}
              <th className="pb-2 text-center text-xs font-medium text-text-secondary">
                &nbsp;
              </th>
            </tr>
            <tr className="border-b border-border/60 text-left text-text-muted">
              <th className="pb-2" />
              <th className="pb-2" />
              {MODES.map((m) => (
                <Fragment key={m}>
                  <Th
                    label="Score"
                    sortId={`${m}-score` as SortKey}
                    className="text-center"
                  />
                  <Th
                    label="Plan"
                    sortId={`${m}-plan` as SortKey}
                    className="text-center"
                  />
                  <Th
                    label="Exec"
                    sortId={`${m}-exec` as SortKey}
                    className="text-center"
                  />
                  <Th
                    label="Total"
                    sortId={`${m}-total` as SortKey}
                    className="text-center"
                  />
                </Fragment>
              ))}
              <Th label="Winner" sortId="task" className="text-center" />
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => {
              const winner = getWinner(task.results);
              const costWinner = getCostWinner(task.results);

              return (
                <tr
                  key={task.id}
                  className="border-b border-border/30 transition-colors hover:bg-surface-overlay/50 last:border-0"
                >
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-text-primary text-xs">
                      {task.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-[11px] text-text-secondary">
                      {task.project}
                    </span>
                  </td>
                  {MODES.map((m) => {
                    const r = task.results[m];
                    const isCostWinner = m === costWinner;
                    const isHighestScore =
                      r.score ===
                      Math.max(...MODES.map((x) => task.results[x].score));

                    return (
                      <Fragment key={m}>
                        <td className="py-2.5 pr-1 text-center">
                          <span
                            className={`inline-block min-w-[36px] rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${
                              isHighestScore
                                ? `${MODE_BG[m]} ${MODE_COLORS[m]}`
                                : "text-text-secondary"
                            }`}
                          >
                            {fmtScore(r.score)}
                          </span>
                        </td>
                        <td className="py-2.5 pr-1 text-center font-mono text-xs text-text-muted">
                          {r.planCost > 0 ? fmt(r.planCost) : "\u2014"}
                        </td>
                        <td className="py-2.5 pr-1 text-center font-mono text-xs text-text-muted">
                          {fmt(r.execCost)}
                        </td>
                        <td
                          className={`py-2.5 pr-3 text-center font-mono text-xs font-medium ${
                            isCostWinner
                              ? MODE_COLORS[m]
                              : "text-text-secondary"
                          }`}
                        >
                          {fmt(r.totalCost)}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="py-2.5 text-center">
                    {winner === "tie" ? (
                      <span className="inline-flex items-center rounded-full bg-surface-overlay px-2.5 py-0.5 text-[11px] font-medium text-text-muted">
                        Tie
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${MODE_BG[winner]} ${MODE_COLORS[winner]} ${MODE_BORDER[winner]}`}
                      >
                        {MODE_LABELS[winner]}
                      </span>
                    )}
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

