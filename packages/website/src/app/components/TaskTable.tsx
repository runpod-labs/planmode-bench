"use client";

import { useState, useMemo, Fragment } from "react";
import { Zap, Compass, BookOpen, Scissors } from "lucide-react";

interface ModeResult {
  score: number;
  totalCost: number;
  durationMs: number;
}

interface TaskResult {
  id: string;
  name: string;
  category: string;
  project: string;
  difficulty: string;
  repoUrl?: string;
  repoOrg?: string;
  results: Record<string, ModeResult>;
}

const MODES = ["normal", "normal-guided", "plan-resume", "plan-clear"] as const;
type Mode = (typeof MODES)[number];

const MODE_META: Record<
  Mode,
  { label: string; bg: string; text: string; icon: typeof Zap }
> = {
  normal: { label: "One-shot", bg: "bg-mode-n/15", text: "text-mode-n", icon: Zap },
  "normal-guided": { label: "Guided", bg: "bg-mode-g/15", text: "text-mode-g", icon: Compass },
  "plan-resume": { label: "Plan+Resume", bg: "bg-mode-pr/15", text: "text-mode-pr", icon: BookOpen },
  "plan-clear": { label: "Plan+Clear", bg: "bg-mode-pc/15", text: "text-mode-pc", icon: Scissors },
};

function getWinner(results: Record<string, ModeResult>): Mode | "tie" {
  const active = MODES.filter((m) => results[m] && results[m].totalCost > 0);
  if (active.length === 0) return "tie";
  const scores = active.map((m) => ({ mode: m, score: results[m].score }));
  const maxScore = Math.max(...scores.map((s) => s.score));
  const winners = scores.filter((s) => s.score === maxScore);
  if (winners.length === active.length) return "tie";
  if (winners.length === 1) return winners[0].mode;
  const cheapest = winners.reduce((a, b) =>
    results[a.mode].totalCost <= results[b.mode].totalCost ? a : b
  );
  return cheapest.mode;
}

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

type SortKey = "task" | "project" | "difficulty" | `${Mode}-score` | `${Mode}-cost` | `${Mode}-time`;
type SortDir = "asc" | "desc";

const DIFF_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

export default function TaskTable({ tasks }: { tasks: TaskResult[] }) {
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

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;

      if (sortKey === "task") { va = a.name; vb = b.name; }
      else if (sortKey === "project") { va = a.project; vb = b.project; }
      else if (sortKey === "difficulty") { va = DIFF_ORDER[a.difficulty] ?? 0; vb = DIFF_ORDER[b.difficulty] ?? 0; }
      else {
        const parts = sortKey.split("-");
        const suffix = parts.pop()!;
        const mode = parts.join("-") as Mode;
        if (suffix === "score") { va = a.results[mode]?.score ?? 0; vb = b.results[mode]?.score ?? 0; }
        else if (suffix === "cost") { va = a.results[mode]?.totalCost ?? 0; vb = b.results[mode]?.totalCost ?? 0; }
        else if (suffix === "time") { va = a.results[mode]?.durationMs ?? 0; vb = b.results[mode]?.durationMs ?? 0; }
      }

      if (typeof va === "string")
        return sortDir === "asc" ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
      return sortDir === "asc" ? va - (vb as number) : (vb as number) - va;
    });
  }, [tasks, sortKey, sortDir]);

  function Th({ label, id, className = "" }: { label: string; id: SortKey; className?: string }) {
    const active = sortKey === id;
    return (
      <th
        className={`cursor-pointer select-none whitespace-nowrap pb-2 text-[10px] font-mono font-normal uppercase tracking-widest transition-colors hover:text-foreground ${className} ${active ? "text-muted-foreground" : "text-muted-foreground/40"}`}
        onClick={() => handleSort(id)}
      >
        {label}
        {active && <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </th>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50">
        All results
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {/* Mode group headers */}
            <tr className="border-b border-border/60">
              <th colSpan={3} className="pb-2" />
              {MODES.map((m) => {
                const meta = MODE_META[m];
                const Icon = meta.icon;
                return (
                  <th key={m} colSpan={3} className="pb-2 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={`flex items-center justify-center h-4 w-4 rounded ${meta.bg} ${meta.text}`}>
                        <Icon className="h-2.5 w-2.5" />
                      </span>
                      <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">
                        {meta.label}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th className="pb-2" />
            </tr>
            {/* Sub headers */}
            <tr className="border-b border-border">
              <Th label="Task" id="task" className="pr-3 text-left" />
              <Th label="Project" id="project" className="pr-3 text-left" />
              <Th label="Diff" id="difficulty" className="pr-3 text-left" />
              {MODES.map((m) => (
                <Fragment key={m}>
                  <Th label="Score" id={`${m}-score` as SortKey} className="text-right px-1.5" />
                  <Th label="Cost" id={`${m}-cost` as SortKey} className="text-right px-1.5" />
                  <Th label="Time" id={`${m}-time` as SortKey} className="text-right px-1.5" />
                </Fragment>
              ))}
              <th className="pb-2 pl-2 text-right text-[10px] font-mono font-normal uppercase tracking-widest text-muted-foreground/40">
                Best
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const winner = getWinner(task.results);
              const activeScores = MODES.filter(
                (m) => task.results[m]?.totalCost > 0
              ).map((m) => task.results[m].score);
              const maxScore =
                activeScores.length > 0 ? Math.max(...activeScores) : 0;

              return (
                <tr
                  key={task.id}
                  className="border-b border-border/40 hover:bg-card/30 transition-colors"
                >
                  <td className="py-3 pr-3 min-w-[200px] max-w-[280px]">
                    <span className="text-foreground text-xs leading-snug line-clamp-2">
                      {task.name}
                    </span>
                  </td>
                  <td className="py-3 pr-3">
                    {task.repoUrl ? (
                      <a
                        href={task.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:underline underline-offset-2"
                      >
                        <img
                          src={`https://github.com/${task.repoOrg}.png?size=20`}
                          alt=""
                          className="h-3.5 w-3.5 rounded-sm"
                          loading="lazy"
                        />
                        <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                          {task.project}
                        </span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/30">&mdash;</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {task.difficulty}
                    </span>
                  </td>
                  {MODES.map((m) => {
                    const r = task.results[m];
                    const hasData = r && r.totalCost > 0;
                    const isTop = hasData && r.score === maxScore && maxScore > 0;
                    return (
                      <Fragment key={m}>
                        <td className={`py-3 px-1.5 text-right font-mono text-xs tabular-nums ${isTop ? "text-foreground font-medium" : hasData ? "text-muted-foreground" : "text-muted-foreground/20"}`}>
                          {hasData ? (r.score * 100).toFixed(0) : "—"}
                        </td>
                        <td className={`py-3 px-1.5 text-right font-mono text-xs tabular-nums ${hasData ? "text-muted-foreground" : "text-muted-foreground/20"}`}>
                          {hasData ? `$${r.totalCost.toFixed(2)}` : "—"}
                        </td>
                        <td className={`py-3 px-1.5 text-right font-mono text-xs tabular-nums ${hasData ? "text-muted-foreground/60" : "text-muted-foreground/20"}`}>
                          {hasData ? formatDuration(r.durationMs) : "—"}
                        </td>
                      </Fragment>
                    );
                  })}
                  <td className="py-3 pl-2 text-right">
                    {winner === "tie" ? (
                      <span className="text-[10px] text-muted-foreground/30">tie</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        {(() => {
                          const wm = MODE_META[winner];
                          const WIcon = wm.icon;
                          return (
                            <>
                              <span className={`flex items-center justify-center h-3.5 w-3.5 rounded-sm ${wm.bg} ${wm.text}`}>
                                <WIcon className="h-2 w-2" />
                              </span>
                              {wm.label}
                            </>
                          );
                        })()}
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
