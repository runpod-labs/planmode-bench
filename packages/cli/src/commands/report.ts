import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { RunSummaryType, RunResultType } from "@planmode-bench/schema";

export async function reportCommand(runId?: string): Promise<void> {
  const resultsDir = path.join(process.cwd(), "results");

  let runDir: string;
  let summaryPath: string;
  if (runId) {
    runDir = path.join(resultsDir, "runs", runId);
    summaryPath = path.join(runDir, "summary.json");
  } else {
    summaryPath = path.join(resultsDir, "latest.json");
    // Find the actual run dir from latest
    runDir = "";
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

  // Load individual results to get plan_metrics
  const allResults: RunResultType[] = [];
  const actualRunDir = runDir || path.join(resultsDir, "runs", summary.run_id);
  const tasksDir = path.join(actualRunDir, "tasks");
  try {
    const files = await readdir(tasksDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const content = await readFile(path.join(tasksDir, file), "utf-8");
        allResults.push(JSON.parse(content));
      }
    }
  } catch {
    // Can't load individual results
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`  planmode-bench Results`);
  console.log(`${"=".repeat(70)}\n`);
  console.log(`Run: ${summary.run_id}`);
  console.log(`Model: ${summary.model}`);
  console.log(`Tasks: ${summary.total_tasks} | Runs: ${summary.total_runs}`);
  console.log(`Total Cost: $${summary.total_cost_usd.toFixed(4)}`);
  console.log();

  // Overall comparison
  const modes = ["normal", "plan-resume", "plan-clear"] as const;
  const col = 18;

  console.log(`${"─".repeat(70)}`);
  console.log(`  OVERALL COMPARISON`);
  console.log(`${"─".repeat(70)}`);
  console.log(["Metric", "Normal", "Plan+Resume", "Plan+Clear"].map((h) => h.padEnd(col)).join(""));
  console.log("─".repeat(70));

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
    console.log(row.map((c) => c.padEnd(col)).join(""));
  }

  // Plan mode cost breakdown
  if (allResults.length > 0) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`  PLAN MODE COST BREAKDOWN`);
    console.log(`${"─".repeat(70)}`);
    console.log(
      ["", "Plan Phase", "Execute Phase", "Total", "Plan Overhead"].map((h) => h.padEnd(col)).join("")
    );
    console.log("─".repeat(70));

    for (const mode of ["plan-resume", "plan-clear"] as const) {
      const modeResults = allResults.filter((r) => r.mode === mode && r.plan_metrics);
      if (modeResults.length === 0) continue;

      const planCosts = modeResults.map((r) => r.plan_metrics!.plan_cost_usd);
      const execCosts = modeResults.map((r) => r.plan_metrics!.execute_cost_usd);
      const totalCosts = modeResults.map((r) => r.metrics.total_cost_usd);
      const planTimes = modeResults.map((r) => r.plan_metrics!.plan_duration_ms);
      const execTimes = modeResults.map((r) => r.plan_metrics!.execute_duration_ms);

      const avgPlanCost = planCosts.reduce((a, b) => a + b, 0) / planCosts.length;
      const avgExecCost = execCosts.reduce((a, b) => a + b, 0) / execCosts.length;
      const avgTotalCost = totalCosts.reduce((a, b) => a + b, 0) / totalCosts.length;
      const avgPlanTime = planTimes.reduce((a, b) => a + b, 0) / planTimes.length;
      const avgExecTime = execTimes.reduce((a, b) => a + b, 0) / execTimes.length;

      // Compare to normal mode avg cost
      const normalResults = allResults.filter((r) => r.mode === "normal");
      const avgNormalCost = normalResults.length > 0
        ? normalResults.reduce((s, r) => s + r.metrics.total_cost_usd, 0) / normalResults.length
        : 0;
      const overhead = avgNormalCost > 0 ? ((avgTotalCost - avgNormalCost) / avgNormalCost * 100) : 0;

      const label = mode === "plan-resume" ? "Plan+Resume" : "Plan+Clear";
      console.log(
        [
          `${label} $`,
          `$${avgPlanCost.toFixed(4)}`,
          `$${avgExecCost.toFixed(4)}`,
          `$${avgTotalCost.toFixed(4)}`,
          `+${overhead.toFixed(0)}% vs normal`,
        ].map((c) => c.padEnd(col)).join("")
      );
      console.log(
        [
          `${label} t`,
          `${(avgPlanTime / 1000).toFixed(1)}s`,
          `${(avgExecTime / 1000).toFixed(1)}s`,
          `${((avgPlanTime + avgExecTime) / 1000).toFixed(1)}s`,
          ``,
        ].map((c) => c.padEnd(col)).join("")
      );
    }
  }

  // Per task
  console.log(`\n${"─".repeat(70)}`);
  console.log(`  PER-TASK RESULTS`);
  console.log(`${"─".repeat(70)}`);

  for (const task of summary.per_task) {
    const sig = task.p_value !== undefined && task.p_value < 0.05 ? " *" : "";
    console.log(`\n  ${task.task_id}: winner=${task.winner}${sig}`);

    for (const mode of modes) {
      const data = task[mode];
      const scoreStr = `avg=${data.avg.toFixed(3)}`;
      const scoresStr = `[${data.scores.map((s) => s.toFixed(2)).join(", ")}]`;

      // Find plan metrics for this task+mode
      const taskResults = allResults.filter((r) => r.task_id === task.task_id && r.mode === mode);
      let costDetail = "";
      if (taskResults.length > 0) {
        const r = taskResults[0];
        if (r.plan_metrics) {
          costDetail = ` plan=$${r.plan_metrics.plan_cost_usd.toFixed(4)} exec=$${r.plan_metrics.execute_cost_usd.toFixed(4)}`;
        }
        costDetail = ` total=$${r.metrics.total_cost_usd.toFixed(4)}${costDetail}`;
      }

      console.log(`    ${mode.padEnd(14)} ${scoreStr} ${scoresStr}${costDetail}`);
    }
  }

  console.log(`\n* = statistically significant (p < 0.05)\n`);
}
