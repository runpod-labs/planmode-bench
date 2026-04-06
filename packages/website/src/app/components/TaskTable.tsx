"use client";

import { useState, useMemo, Fragment } from "react";
import { Zap, BookOpen, Scissors, Box } from "lucide-react";

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

const MODES = ["normal", "plan-resume", "plan-clear"] as const;
type Mode = (typeof MODES)[number];

const MODE_META: Record<
  Mode,
  { label: string; bg: string; text: string; icon: typeof Zap }
> = {
  normal: { label: "one-shot", bg: "bg-mode-n/15", text: "text-mode-n", icon: Zap },
  "plan-resume": { label: "plan+resume", bg: "bg-mode-pr/15", text: "text-mode-pr", icon: BookOpen },
  "plan-clear": { label: "plan+clear", bg: "bg-mode-pc/15", text: "text-mode-pc", icon: Scissors },
};

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

type SortKey = "task" | "project" | "difficulty" | `${Mode}-score` | `${Mode}-cost` | `${Mode}-time`;
type SortDir = "asc" | "desc";

const DIFF_ORDER: Record<string, number> = { easy: 0, medium: 1, hard: 2 };

export default function TaskTable({ tasks, model }: { tasks: TaskResult[]; model: string }) {
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
        className={`cursor-pointer select-none whitespace-nowrap pt-3 pb-3 text-[10px] font-mono font-normal uppercase tracking-widest hover:text-foreground ${className} ${active ? "text-muted-foreground" : "text-muted-foreground/70"}`}
        onClick={() => handleSort(id)}
      >
        {label}
        {active && <span className="ml-0.5">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </th>
    );
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-mono uppercase tracking-widest text-foreground/70 text-center mt-8">
        all results
      </h2>
      <p className="mb-8 text-sm text-muted-foreground text-center">
        {tasks.length} tasks, 5 runs per mode in Claude Code using <code className="px-1.5 py-0.5 rounded bg-muted/30 text-xs font-mono text-foreground/80">{model}</code>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <colgroup>
            <col className="w-[120px]" />
            <col />
            {MODES.map((m) => (
              <Fragment key={m}>
                <col className="w-[70px]" />
                <col className="w-[70px]" />
                <col className="w-[70px]" />
              </Fragment>
            ))}
          </colgroup>
          <thead>
            {/* Mode group headers */}
            <tr className="border-b border-border/60">
              <th colSpan={2} className="pt-4 pb-3" />
              {MODES.map((m) => {
                const meta = MODE_META[m];
                const Icon = meta.icon;
                return (
                  <th key={m} colSpan={3} className="pt-4 pb-3 text-center border-l border-border/40">
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
            </tr>
            {/* Sub headers */}
            <tr className="border-b border-border">
              <Th label="Project" id="project" className="pr-3 text-left" />
              <Th label="Task" id="task" className="pr-3 text-left" />
              {MODES.map((m) => (
                <Fragment key={m}>
                  <Th label="Score" id={`${m}-score` as SortKey} className="text-right px-3 border-l border-border/40" />
                  <Th label="Cost" id={`${m}-cost` as SortKey} className="text-right px-3" />
                  <Th label="Time" id={`${m}-time` as SortKey} className="text-right px-3" />
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => {
              const activeModes = MODES.filter(
                (m) => task.results[m]?.totalCost > 0
              );
              const maxScore = activeModes.length > 0
                ? Math.max(...activeModes.map((m) => task.results[m].score))
                : 0;
              const minCost = activeModes.length > 0
                ? Math.min(...activeModes.map((m) => task.results[m].totalCost))
                : 0;
              const minTime = activeModes.length > 0
                ? Math.min(...activeModes.map((m) => task.results[m].durationMs))
                : 0;

              return (
                <tr
                  key={task.id}
                  className="border-b border-border/40 hover:bg-card/30"
                >
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
                        <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                          {task.project}
                        </span>
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                        <Box className="h-3.5 w-3.5 shrink-0" />
                        generic
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 min-w-[200px] max-w-[280px]">
                    <span className="text-foreground text-xs leading-snug line-clamp-2">
                      {task.name}
                    </span>
                  </td>
                  {MODES.map((m) => {
                    const r = task.results[m];
                    const hasData = r && r.totalCost > 0;
                    const isTopScore = hasData && r.score === maxScore && maxScore > 0;
                    const isTopCost = hasData && r.totalCost === minCost && minCost > 0;
                    const isTopTime = hasData && r.durationMs === minTime && minTime > 0;
                    const base = "rounded-full px-2 py-0.5 inline-block";
                    const winner = `${base} text-foreground bg-foreground/10`;
                    const normal = `${base} text-muted-foreground`;
                    const empty = `${base} text-muted-foreground/80`;
                    return (
                      <Fragment key={m}>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums border-l border-border/40">
                          <span className={isTopScore ? winner : hasData ? normal : empty}>
                            {hasData ? (r.score * 100).toFixed(0) : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                          <span className={isTopCost ? winner : hasData ? normal : empty}>
                            {hasData ? `$${r.totalCost.toFixed(2)}` : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs tabular-nums">
                          <span className={isTopTime ? winner : hasData ? normal : empty}>
                            {hasData ? formatDuration(r.durationMs) : "—"}
                          </span>
                        </td>
                      </Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
