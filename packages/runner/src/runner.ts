import { readFile, mkdir, writeFile, readdir, access } from "node:fs/promises";
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
import { aggregateResults, mean, stddev, welchTTest, confidenceInterval95 } from "@planmode-bench/evaluator";
import { executeTask } from "./executor.js";
import { prepareAllBases } from "./sandbox.js";

export interface RunOptions {
  tasksDir: string;
  outputDir: string;
  /** Resume an existing run instead of creating a new one */
  resumeRunId?: string;
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

/** Get the result filename for a job */
function jobResultFile(taskId: string, mode: string, runNumber: number): string {
  return `${taskId.replace("/", "--")}--${mode}--run${runNumber}.json`;
}

/** Check if a job result already exists on disk */
async function jobCompleted(tasksOutputDir: string, filename: string): Promise<boolean> {
  try {
    await access(path.join(tasksOutputDir, filename));
    return true;
  } catch {
    return false;
  }
}

/** Load an existing result from disk */
async function loadResult(tasksOutputDir: string, filename: string): Promise<RunResultType | null> {
  try {
    const content = await readFile(path.join(tasksOutputDir, filename), "utf-8");
    return JSON.parse(content) as RunResultType;
  } catch {
    return null;
  }
}

/**
 * Persistent job queue with file-based state.
 *
 * Each job writes its result to disk immediately on completion.
 * On resume, already-completed jobs are skipped.
 * Concurrency is capped -- only N jobs run at a time.
 * If the process crashes, just re-run with --resume to continue.
 */
export async function run(options: RunOptions): Promise<RunSummaryType> {
  const config = RunnerConfig.parse(options.configOverrides ?? {});

  console.log(`\nplanmode-bench runner`);
  console.log(`Model: ${config.model}`);
  console.log(`Modes: ${config.modes.join(", ")}`);
  console.log(`Runs per task: ${config.runs_per_task}`);
  console.log(`Concurrency: ${config.concurrency}`);
  console.log();

  // Discover tasks
  const tasks = await discoverTasks(options.tasksDir, config.tasks);
  console.log(`Found ${tasks.length} task(s)\n`);

  if (tasks.length === 0) {
    throw new Error("No tasks found");
  }

  // Create or resume output directory
  const runId = options.resumeRunId ?? new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(options.outputDir, "runs", runId);
  const tasksOutputDir = path.join(runDir, "tasks");
  await mkdir(tasksOutputDir, { recursive: true });

  // Save run metadata
  await writeFile(
    path.join(runDir, "meta.json"),
    JSON.stringify({
      run_id: runId,
      model: config.model,
      modes: config.modes,
      runs_per_task: config.runs_per_task,
      concurrency: config.concurrency,
      tasks: tasks.map((t) => t.id),
      started_at: new Date().toISOString(),
    }, null, 2)
  );

  // Step 1: Prepare all base installations in parallel
  await prepareAllBases(tasks, options.tasksDir);

  // Step 2: Build job queue and check what's already done
  interface Job {
    task: Task;
    mode: Mode;
    runNumber: number;
    filename: string;
  }

  const allJobs: Job[] = [];
  const pendingJobs: Job[] = [];
  const allResults: RunResultType[] = [];

  for (const task of tasks) {
    for (const mode of config.modes) {
      for (let runNum = 1; runNum <= config.runs_per_task; runNum++) {
        const filename = jobResultFile(task.id, mode, runNum);
        const job: Job = { task, mode, runNumber: runNum, filename };
        allJobs.push(job);

        if (await jobCompleted(tasksOutputDir, filename)) {
          // Already done -- load the result
          const existing = await loadResult(tasksOutputDir, filename);
          if (existing) {
            allResults.push(existing);
            console.log(`  [skip] ${task.id} ${mode} run${runNum} (already done)`);
          }
        } else {
          pendingJobs.push(job);
        }
      }
    }
  }

  const totalJobs = allJobs.length;
  const skipped = totalJobs - pendingJobs.length;

  if (skipped > 0) {
    console.log(`\nResuming: ${skipped} done, ${pendingJobs.length} pending\n`);
  }

  console.log(`Running ${pendingJobs.length}/${totalJobs} jobs (concurrency: ${config.concurrency})\n`);

  // Step 3: Process pending jobs with capped concurrency
  const startTime = performance.now();
  let completed = skipped;

  // Semaphore for concurrency control
  let running = 0;
  const queue = [...pendingJobs];

  // Create logs directory for session logs
  const logsDir = path.join(runDir, "logs");
  await mkdir(logsDir, { recursive: true });

  async function processJob(job: Job): Promise<void> {
    try {
      const { runResult, messages } = await executeTask({
        task: job.task,
        mode: job.mode,
        runNumber: job.runNumber,
        tasksDir: options.tasksDir,
        config,
      });

      // Persist result immediately
      await writeFile(
        path.join(tasksOutputDir, job.filename),
        JSON.stringify(runResult, null, 2)
      );

      // Save session log for debugging/analysis
      const logFilename = job.filename.replace(".json", ".log.json");
      const logMessages = messages
        .filter((m) => m.type === "assistant" || m.type === "user" || m.type === "result")
        .map((m) => ({ type: m.type, ...(m as any) }));
      await writeFile(
        path.join(logsDir, logFilename),
        JSON.stringify(logMessages, null, 2)
      );

      allResults.push(runResult);
      completed++;
      console.log(
        `  [${completed}/${totalJobs}] ${job.task.id} ${job.mode} run${job.runNumber}: ${runResult.evaluation.overall_score.toFixed(2)} ($${runResult.metrics.total_cost_usd.toFixed(4)})`
      );
    } catch (error) {
      completed++;
      const errorMessage = (error as Error).message;
      console.error(
        `  [${completed}/${totalJobs}] ${job.task.id} ${job.mode} run${job.runNumber} FAILED: ${errorMessage}`
      );

      // Persist error result to disk for debugging visibility
      const errorResult: RunResultType = {
        schema_version: 1,
        task_id: job.task.id,
        task_name: job.task.name,
        mode: job.mode,
        run_number: job.runNumber,
        timestamp: new Date().toISOString(),
        model: config.model,
        metrics: {
          duration_ms: 0,
          duration_api_ms: 0,
          num_turns: 0,
          total_cost_usd: 0,
          input_tokens: 0,
          output_tokens: 0,
          stop_reason: null,
          is_error: true,
        },
        evaluation: {
          overall_score: 0,
          strategy_results: [],
          evaluation_duration_ms: 0,
        },
        error_message: errorMessage,
      };

      await writeFile(
        path.join(tasksOutputDir, job.filename),
        JSON.stringify(errorResult, null, 2)
      );

      allResults.push(errorResult);
    }
  }

  // Run jobs with a proper semaphore (not batching)
  // This keeps `concurrency` jobs running at all times
  await new Promise<void>((resolve) => {
    let idx = 0;

    function next() {
      while (running < config.concurrency && idx < queue.length) {
        const job = queue[idx++];
        running++;
        processJob(job).finally(() => {
          running--;
          if (idx >= queue.length && running === 0) {
            resolve();
          } else {
            next();
          }
        });
      }
      // If queue was empty from the start
      if (queue.length === 0) resolve();
    }

    next();
  });

  const totalDuration = Math.round(performance.now() - startTime);

  // Generate and save summary
  const summary = generateSummary(runId, config, tasks, allResults, totalDuration);

  await writeFile(path.join(runDir, "summary.json"), JSON.stringify(summary, null, 2));
  await writeFile(path.join(options.outputDir, "latest.json"), JSON.stringify(summary, null, 2));

  // Auto-write to visualizer data directory
  try {
    const projectRoot = path.resolve(options.outputDir, "..");
    const websiteDataPath = path.join(projectRoot, "packages", "website", "src", "data", "sample-results.json");
    const websiteData = transformForWebsite(summary, allResults, tasks);
    await writeFile(websiteDataPath, JSON.stringify(websiteData, null, 2));
    console.log(`\nWebsite data updated: ${websiteDataPath}`);
  } catch (err) {
    console.warn(`\nCould not update website data: ${(err as Error).message}`);
  }

  console.log(`\nResults saved to ${runDir}`);
  console.log(`Total cost: $${summary.total_cost_usd.toFixed(4)}`);
  console.log(`Total duration: ${(totalDuration / 1000).toFixed(1)}s`);
  console.log(`Jobs: ${completed}/${totalJobs} (${skipped} resumed)`);

  return summary;
}

function generateSummary(
  runId: string,
  config: { model: string; runs_per_task: number; modes: Mode[] },
  tasks: Task[],
  results: RunResultType[],
  totalDuration: number
): RunSummaryType {
  const modes = config.modes;
  // Exclude infra errors (worktree failures, budget caps) from scoring
  const validResults = results.filter((r) => !r.metrics.is_error);
  const errorCount = results.length - validResults.length;
  if (errorCount > 0) {
    console.log(`  Excluding ${errorCount} error run(s) from aggregation`);
  }
  const resultsByMode = (mode: Mode) => validResults.filter((r) => r.mode === mode);

  const overallByMode = Object.fromEntries(
    modes.map((mode) => [mode, aggregateResults(resultsByMode(mode))])
  );

  const categories = [...new Set(tasks.map((t) => t.category))];
  const byCategory = Object.fromEntries(
    categories.map((cat) => {
      const taskIds = tasks.filter((t) => t.category === cat).map((t) => t.id);
      return [
        cat,
        Object.fromEntries(
          modes.map((mode) => [
            mode,
            aggregateResults(validResults.filter((r) => r.mode === mode && taskIds.includes(r.task_id))),
          ])
        ),
      ];
    })
  );

  const difficulties = [...new Set(tasks.map((t) => t.difficulty))];
  const byDifficulty = Object.fromEntries(
    difficulties.map((diff) => {
      const taskIds = tasks.filter((t) => t.difficulty === diff).map((t) => t.id);
      return [
        diff,
        Object.fromEntries(
          modes.map((mode) => [
            mode,
            aggregateResults(validResults.filter((r) => r.mode === mode && taskIds.includes(r.task_id))),
          ])
        ),
      ];
    })
  );

  const perTask = tasks.map((task) => {
    const taskResults = validResults.filter((r) => r.task_id === task.id);
    const modeScores = Object.fromEntries(
      modes.map((mode) => {
        const scores = taskResults.filter((r) => r.mode === mode).map((r) => r.evaluation.overall_score);
        const ci = confidenceInterval95(scores);
        return [mode, {
          scores,
          avg: mean(scores),
          std: stddev(scores),
          ci_lower: ci.ci_lower,
          ci_upper: ci.ci_upper,
          success_rate: scores.length > 0 ? scores.filter((s) => s >= 0.5).length / scores.length : 0,
        }];
      })
    ) as Record<string, { scores: number[]; avg: number; std: number; ci_lower: number; ci_upper: number; success_rate: number }>;

    const modeAvgs = modes.map((m) => ({ mode: m, avg: modeScores[m].avg }));
    modeAvgs.sort((a, b) => b.avg - a.avg);
    const winner = modeAvgs.length < 2 ? modeAvgs[0]?.mode ?? "tie" : (modeAvgs[0].avg - modeAvgs[1].avg < 0.01 ? "tie" : modeAvgs[0].mode);

    const normalScores = modeScores["normal"]?.scores ?? [];
    const planModes = modes.filter((m) => m.startsWith("plan-"));
    let p_value: number | undefined;
    if (normalScores.length >= 2 && planModes.length > 0) {
      const bestPlanMode = planModes.reduce((best, m) =>
        (modeScores[m]?.avg ?? 0) >= (modeScores[best]?.avg ?? 0) ? m : best
      , planModes[0]);
      const bestPlanScores = modeScores[bestPlanMode]?.scores ?? [];
      if (bestPlanScores.length >= 2) {
        p_value = welchTTest(normalScores, bestPlanScores);
      }
    }

    return {
      task_id: task.id,
      modes: modeScores,
      winner,
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
    overall: overallByMode,
    by_category: byCategory,
    by_difficulty: byDifficulty,
    per_task: perTask,
  };
}

function transformForWebsite(
  summary: RunSummaryType,
  allResults: RunResultType[],
  tasks: Task[]
): object {
  const modes = Object.keys(summary.overall);

  function modeStats(stats: Record<string, any>) {
    return {
      avgScore: stats.avg_score,
      medianScore: stats.median_score,
      successRate: stats.success_rate,
      avgCost: stats.avg_cost_usd,
      avgDurationMs: stats.avg_duration_ms,
      avgTokens: stats.avg_tokens,
      avgTurns: stats.avg_turns,
      ciLower: stats.ci_lower,
      ciUpper: stats.ci_upper,
      n: stats.n,
    };
  }

  return {
    meta: {
      runId: summary.run_id,
      timestamp: summary.timestamp,
      claudeModel: summary.model,
      totalTasks: summary.total_tasks,
      modes,
    },
    overall: Object.fromEntries(
      modes.map((m) => [m, modeStats(summary.overall[m])])
    ),
    tasks: tasks.map((task) => {
      const taskPerMode = (mode: string) => {
        const modeResults = allResults.filter(
          (r) => r.task_id === task.id && r.mode === mode && !r.metrics.is_error
        );
        if (modeResults.length === 0) {
          return { score: 0, planCost: 0, execCost: 0, totalCost: 0, durationMs: 0 };
        }
        const avg = (fn: (r: RunResultType) => number) =>
          modeResults.reduce((s, r) => s + fn(r), 0) / modeResults.length;
        return {
          score: avg((r) => r.evaluation.overall_score),
          planCost: avg((r) => r.plan_metrics?.plan_cost_usd ?? 0),
          execCost: avg((r) => r.plan_metrics?.execute_cost_usd ?? r.metrics.total_cost_usd),
          totalCost: avg((r) => r.metrics.total_cost_usd),
          durationMs: avg((r) => r.metrics.duration_ms),
        };
      };

      // Extract repo info from source_repo URL if available
      const repoUrl = task.setup.source_repo?.url?.replace(/\.git$/, "");
      const repoRef = task.setup.source_repo?.ref;
      const repoMatch = repoUrl?.match(/github\.com\/([^/]+)\/([^/]+)/);
      const repoOrg = repoMatch?.[1];
      const repoName = repoMatch?.[2];

      return {
        id: task.id,
        name: task.name,
        category: task.category,
        project: repoName ?? "self-contained",
        difficulty: task.difficulty,
        ...(repoUrl && { repoUrl }),
        ...(repoOrg && { repoOrg }),
        ...(repoRef && { repoRef }),
        results: Object.fromEntries(
          modes.map((m) => [m, taskPerMode(m)])
        ),
      };
    }),
  };
}
