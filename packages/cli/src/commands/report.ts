import { readFile } from "node:fs/promises";
import path from "node:path";
import type { RunSummaryType } from "@planmode-bench/schema";

export async function reportCommand(runId?: string): Promise<void> {
  const resultsDir = path.join(process.cwd(), "results");

  let summaryPath: string;
  if (runId) {
    summaryPath = path.join(resultsDir, "runs", runId, "summary.json");
  } else {
    summaryPath = path.join(resultsDir, "latest.json");
  }

  let summary: RunSummaryType;
  try {
    const content = await readFile(summaryPath, "utf-8");
    summary = JSON.parse(content);
  } catch {
    console.error(`No results found at ${summaryPath}`);
    console.error("Run benchmarks first: pnpm cli run");
    process.exit(1);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`  planmode-bench Results`);
  console.log(`${"=".repeat(60)}\n`);
  console.log(`Run: ${summary.run_id}`);
  console.log(`Model: ${summary.model}`);
  console.log(`Tasks: ${summary.total_tasks} | Runs: ${summary.total_runs}`);
  console.log(`Cost: $${summary.total_cost_usd.toFixed(4)}`);
  console.log();

  // Overall comparison
  console.log(`${"─".repeat(60)}`);
  console.log(`  OVERALL COMPARISON`);
  console.log(`${"─".repeat(60)}`);

  const modes = ["normal", "plan-resume", "plan-clear"] as const;
  const headers = ["Metric", "Normal", "Plan+Resume", "Plan+Clear"];

  console.log(
    headers.map((h) => h.padEnd(15)).join("")
  );
  console.log("─".repeat(60));

  const o = summary.overall;
  const rows = [
    ["Avg Score", ...modes.map((m) => o[m].avg_score.toFixed(3))],
    ["Success Rate", ...modes.map((m) => `${(o[m].success_rate * 100).toFixed(1)}%`)],
    ["Avg Cost", ...modes.map((m) => `$${o[m].avg_cost_usd.toFixed(4)}`)],
    ["Avg Duration", ...modes.map((m) => `${(o[m].avg_duration_ms / 1000).toFixed(1)}s`)],
    ["Avg Tokens", ...modes.map((m) => Math.round(o[m].avg_tokens).toString())],
    ["Avg Turns", ...modes.map((m) => o[m].avg_turns.toFixed(1))],
  ];

  for (const row of rows) {
    console.log(row.map((c) => c.padEnd(15)).join(""));
  }

  // Per task
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  PER-TASK RESULTS`);
  console.log(`${"─".repeat(60)}`);

  for (const task of summary.per_task) {
    const sig = task.p_value !== undefined && task.p_value < 0.05 ? " *" : "";
    console.log(
      `\n  ${task.task_id}: winner=${task.winner}${sig}`
    );
    for (const mode of modes) {
      const data = task[mode];
      console.log(
        `    ${mode.padEnd(14)} avg=${data.avg.toFixed(3)} std=${data.std.toFixed(3)} scores=[${data.scores.map((s) => s.toFixed(2)).join(", ")}]`
      );
    }
  }

  console.log(`\n* = statistically significant (p < 0.05)\n`);
}
