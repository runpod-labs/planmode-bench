import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parse as parseYAML } from "yaml";
import {
  TaskSchema,
  RunnerConfig,
  type Task,
  type Mode,
  type RunResultType,
  type RunSummaryType,
} from "@planmode-bench/schema";
import { aggregateResults, mean, stddev, welchTTest } from "@planmode-bench/evaluator";
import { executeTask } from "./executor.js";
import { prepareAllBases } from "./sandbox.js";

export interface RunOptions {
  tasksDir: string;
  outputDir: string;
  configOverrides?: Partial<{
    tasks: string[];
    modes: Mode[];
    runs_per_task: number;
    model: string;
    concurrency: number;
    plan_budget_ratio: number;
  }>;
}

async function loadTask(taskDir: string): Promise<Task> {
  const yamlContent = await readFile(path.join(taskDir, "task.yaml"), "utf-8");
  const raw = parseYAML(yamlContent);
  return TaskSchema.parse(raw);
}

async function discoverTasks(
  tasksDir: string,
  filter: string[]
): Promise<Task[]> {
  const { glob } = await import("node:fs");
  const { promisify } = await import("node:util");

  // Find all task.yaml files
  const { readdir } = await import("node:fs/promises");
  const tasks: Task[] = [];

  const categories = await readdir(tasksDir);
  for (const category of categories) {
    const categoryPath = path.join(tasksDir, category);
    try {
      const taskDirs = await readdir(categoryPath);
      for (const taskName of taskDirs) {
        const taskPath = path.join(categoryPath, taskName);
        try {
          const task = await loadTask(taskPath);
          if (filter[0] === "all" || filter.includes(task.id)) {
            tasks.push(task);
          }
        } catch {
          // Skip directories without valid task.yaml
        }
      }
    } catch {
      // Skip non-directories
    }
  }

  return tasks;
}

export async function run(options: RunOptions): Promise<RunSummaryType> {
  const config = RunnerConfig.parse(options.configOverrides ?? {});

  console.log(`\nplanmode-bench runner`);
  console.log(`Model: ${config.model}`);
  console.log(`Modes: ${config.modes.join(", ")}`);
  console.log(`Runs per task: ${config.runs_per_task}`);
  console.log();

  // Discover tasks
  const tasks = await discoverTasks(options.tasksDir, config.tasks);
  console.log(`Found ${tasks.length} task(s)\n`);

  if (tasks.length === 0) {
    throw new Error("No tasks found");
  }

  // Create output directory
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(options.outputDir, "runs", runId);
  const tasksOutputDir = path.join(runDir, "tasks");
  await mkdir(tasksOutputDir, { recursive: true });

  // Step 1: Prepare all base installations (clone repos, install deps)
  // This only happens once per task -- subsequent runs use worktrees
  await prepareAllBases(tasks, options.tasksDir);

  // Step 2: Build the list of all jobs
  interface Job {
    task: Task;
    mode: Mode;
    runNumber: number;
  }
  const jobs: Job[] = [];
  for (const task of tasks) {
    for (const mode of config.modes) {
      for (let runNum = 1; runNum <= config.runs_per_task; runNum++) {
        jobs.push({ task, mode, runNumber: runNum });
      }
    }
  }

  console.log(`Running ${jobs.length} jobs (concurrency: ${config.concurrency})\n`);

  // Step 3: Execute with concurrency
  const allResults: RunResultType[] = [];
  const startTime = performance.now();

  // Process jobs in batches of `concurrency`
  for (let i = 0; i < jobs.length; i += config.concurrency) {
    const batch = jobs.slice(i, i + config.concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (job) => {
        try {
          const result = await executeTask({
            task: job.task,
            mode: job.mode,
            runNumber: job.runNumber,
            tasksDir: options.tasksDir,
            config,
          });

          // Save individual result
          const resultFile = path.join(
            tasksOutputDir,
            `${job.task.id.replace("/", "--")}--${job.mode}--run${job.runNumber}.json`
          );
          await writeFile(resultFile, JSON.stringify(result, null, 2));

          return result;
        } catch (error) {
          console.error(`  [${job.mode}] ${job.task.id} run ${job.runNumber} FAILED: ${(error as Error).message}`);
          return null;
        }
      })
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled" && r.value) {
        allResults.push(r.value);
      }
    }
  }

  const totalDuration = Math.round(performance.now() - startTime);

  // Generate summary
  const summary = generateSummary(
    runId,
    config,
    tasks,
    allResults,
    totalDuration
  );

  // Save summary
  await writeFile(
    path.join(runDir, "summary.json"),
    JSON.stringify(summary, null, 2)
  );

  // Save as latest
  await writeFile(
    path.join(options.outputDir, "latest.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log(`\nResults saved to ${runDir}`);
  console.log(`Total cost: $${summary.total_cost_usd.toFixed(4)}`);
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);

  return summary;
}

function generateSummary(
  runId: string,
  config: { model: string; runs_per_task: number; modes: Mode[] },
  tasks: Task[],
  results: RunResultType[],
  totalDuration: number
): RunSummaryType {
  const modes: Mode[] = ["normal", "plan-resume", "plan-clear"];

  const resultsByMode = (mode: Mode) => results.filter((r) => r.mode === mode);

  const overallByMode = Object.fromEntries(
    modes.map((mode) => [mode, aggregateResults(resultsByMode(mode))])
  ) as Record<Mode, ReturnType<typeof aggregateResults>>;

  // By category
  const categories = [...new Set(tasks.map((t) => t.category))];
  const byCategory = Object.fromEntries(
    categories.map((cat) => {
      const taskIds = tasks.filter((t) => t.category === cat).map((t) => t.id);
      return [
        cat,
        Object.fromEntries(
          modes.map((mode) => [
            mode,
            aggregateResults(
              results.filter((r) => r.mode === mode && taskIds.includes(r.task_id))
            ),
          ])
        ),
      ];
    })
  );

  // By difficulty
  const difficulties = [...new Set(tasks.map((t) => t.difficulty))];
  const byDifficulty = Object.fromEntries(
    difficulties.map((diff) => {
      const taskIds = tasks.filter((t) => t.difficulty === diff).map((t) => t.id);
      return [
        diff,
        Object.fromEntries(
          modes.map((mode) => [
            mode,
            aggregateResults(
              results.filter((r) => r.mode === mode && taskIds.includes(r.task_id))
            ),
          ])
        ),
      ];
    })
  );

  // Per task comparisons
  const perTask = tasks.map((task) => {
    const taskResults = results.filter((r) => r.task_id === task.id);

    const modeScores = Object.fromEntries(
      modes.map((mode) => {
        const scores = taskResults
          .filter((r) => r.mode === mode)
          .map((r) => r.evaluation.overall_score);
        return [mode, { scores, avg: mean(scores), std: stddev(scores) }];
      })
    ) as Record<Mode, { scores: number[]; avg: number; std: number }>;

    // Determine winner (highest average score)
    const modeAvgs = modes.map((m) => ({ mode: m, avg: modeScores[m].avg }));
    modeAvgs.sort((a, b) => b.avg - a.avg);
    const winner =
      modeAvgs[0].avg - modeAvgs[1].avg < 0.01 ? "tie" : modeAvgs[0].mode;

    // P-value: compare best plan mode vs normal
    const normalScores = modeScores["normal"].scores;
    const bestPlanMode =
      modeScores["plan-clear"].avg >= modeScores["plan-resume"].avg
        ? "plan-clear"
        : "plan-resume";
    const bestPlanScores = modeScores[bestPlanMode].scores;
    const p_value = welchTTest(normalScores, bestPlanScores);

    return {
      task_id: task.id,
      ...modeScores,
      winner: winner as "normal" | "plan-resume" | "plan-clear" | "tie",
      p_value,
    };
  });

  return {
    schema_version: 1,
    run_id: runId,
    timestamp: new Date().toISOString(),
    model: config.model,
    runs_per_task: config.runs_per_task,
    total_tasks: tasks.length,
    total_runs: results.length,
    total_cost_usd: results.reduce((sum, r) => sum + r.metrics.total_cost_usd, 0),
    total_duration_ms: totalDuration,
    overall: overallByMode as any,
    by_category: byCategory as any,
    by_difficulty: byDifficulty as any,
    per_task: perTask,
  };
}
