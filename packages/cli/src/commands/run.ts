import path from "node:path";
import type { Mode } from "@planmode-bench/schema";
import { run } from "@planmode-bench/runner";

interface RunCommandOptions {
  tasks?: string;
  modes?: string;
  runs?: string;
  model?: string;
  concurrency?: string;
  planBudgetRatio?: string;
  resume?: string;
}

export async function runCommand(options: RunCommandOptions): Promise<void> {
  const rootDir = process.cwd();
  const tasksDir = path.join(rootDir, "tasks");
  const outputDir = path.join(rootDir, "results");

  const taskList = options.tasks
    ? options.tasks.split(",").map((t) => t.trim())
    : ["all"];

  const modes = options.modes
    ? (options.modes.split(",").map((m) => m.trim()) as Mode[])
    : (["normal", "plan-resume", "plan-clear"] as Mode[]);

  await run({
    tasksDir,
    outputDir,
    resumeRunId: options.resume,
    configOverrides: {
      tasks: taskList,
      modes,
      runs_per_task: options.runs ? parseInt(options.runs, 10) : undefined,
      model: options.model ?? "claude-sonnet-4-6",
      concurrency: options.concurrency ? parseInt(options.concurrency, 10) : 1,
      plan_budget_ratio: options.planBudgetRatio
        ? parseFloat(options.planBudgetRatio)
        : 0.3,
    },
  });
}
