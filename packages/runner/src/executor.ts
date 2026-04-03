import type {
  Task,
  Mode,
  RunResultType,
  RunnerConfigType,
} from "@planmode-bench/schema";
import { evaluate } from "@planmode-bench/evaluator";
import { runNormalMode } from "./modes/normal.js";
import { runPlanResumeMode } from "./modes/plan-resume.js";
import { runPlanClearMode } from "./modes/plan-clear.js";
import { createWorkspace } from "./sandbox.js";

export interface ExecuteOptions {
  task: Task;
  mode: Mode;
  runNumber: number;
  tasksDir: string;
  config: RunnerConfigType;
}

export async function executeTask(options: ExecuteOptions): Promise<RunResultType> {
  const { task, mode, runNumber, tasksDir, config } = options;

  console.log(
    `  [${mode}] run ${runNumber}/${config.runs_per_task} for ${task.id}...`
  );

  const workspace = await createWorkspace(task, tasksDir);

  try {
    let metrics;
    let planMetrics;
    let sessionId;

    switch (mode) {
      case "normal": {
        const result = await runNormalMode(task, workspace.dir, config.model);
        metrics = result.metrics;
        sessionId = result.sessionId;
        break;
      }
      case "plan-resume": {
        const result = await runPlanResumeMode(
          task,
          workspace.dir,
          config.model,
          config.plan_budget_ratio
        );
        metrics = result.metrics;
        planMetrics = result.planMetrics;
        sessionId = result.sessionId;
        break;
      }
      case "plan-clear": {
        const result = await runPlanClearMode(
          task,
          workspace.dir,
          config.model,
          config.plan_budget_ratio
        );
        metrics = result.metrics;
        planMetrics = result.planMetrics;
        sessionId = result.sessionId;
        break;
      }
    }

    // Evaluate the result
    const evaluation = await evaluate(workspace.dir, task.evaluation, workspace.shellPrefix);

    const runResult: RunResultType = {
      schema_version: 1,
      task_id: task.id,
      task_name: task.name,
      mode,
      run_number: runNumber,
      timestamp: new Date().toISOString(),
      model: config.model,
      metrics,
      plan_metrics: planMetrics,
      evaluation,
      session_id: sessionId,
    };

    console.log(
      `  [${mode}] run ${runNumber} score: ${evaluation.overall_score.toFixed(2)} (${metrics.total_cost_usd.toFixed(4)} USD, ${metrics.duration_ms}ms)`
    );

    return runResult;
  } finally {
    await workspace.cleanup();
  }
}
