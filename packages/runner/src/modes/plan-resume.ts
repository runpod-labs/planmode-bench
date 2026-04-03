import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Task, RunMetricsType, PlanMetricsType } from "@planmode-bench/schema";
import { extractMetrics, mergeMetrics } from "../metrics.js";

export interface PlanResumeResult {
  metrics: RunMetricsType;
  planMetrics: PlanMetricsType;
  sessionId?: string;
}

/**
 * Plan+Resume mode: Two phases, same session.
 * Phase 1: Plan -- All tools available, but prompted to only explore and plan.
 *   Uses `permissionMode: "plan"` which is the real plan mode behavior in
 *   Claude Code (read-only, no edits).
 * Phase 2: Execute -- Resume same session with full permissions.
 *
 * Context is preserved -- all exploration tokens stay in the session.
 */
export async function runPlanResumeMode(
  task: Task,
  workDir: string,
  model: string,
  planBudgetRatio: number = 0.3
): Promise<PlanResumeResult> {
  const planBudget = task.setup.max_budget_usd * planBudgetRatio;
  const executeBudget = task.setup.max_budget_usd * (1 - planBudgetRatio);

  // Phase 1: Plan (real plan mode -- Claude can read/explore but not edit)
  let planResult: SDKResultMessage | null = null;

  for await (const message of query({
    prompt: `${task.prompt}\n\nAnalyze the codebase thoroughly. Read all relevant files. Then create a detailed step-by-step implementation plan. Do NOT make any changes -- only read, explore, and plan.`,
    options: {
      cwd: workDir,
      permissionMode: "plan",
      maxTurns: 20,
      maxBudgetUsd: planBudget,
      model,
    },
  })) {
    if (message.type === "result") {
      planResult = message;
    }
  }

  if (!planResult) {
    throw new Error(`Plan phase for ${task.id} produced no result`);
  }

  const planMetricsRaw = extractMetrics(planResult);
  const planContent = planResult.subtype === "success" ? planResult.result : "";
  const sessionId = planResult.session_id;

  // Phase 2: Execute (resume same session, full permissions)
  let executeResult: SDKResultMessage | null = null;

  for await (const message of query({
    prompt: "Now implement the plan you created above. Make all the necessary code changes.",
    options: {
      cwd: workDir,
      resume: sessionId,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 150,
      maxBudgetUsd: executeBudget,
      model,
    },
  })) {
    if (message.type === "result") {
      executeResult = message;
    }
  }

  if (!executeResult) {
    throw new Error(`Execute phase for ${task.id} produced no result`);
  }

  const executeMetricsRaw = extractMetrics(executeResult);

  return {
    metrics: mergeMetrics(planMetricsRaw, executeMetricsRaw),
    planMetrics: {
      plan_duration_ms: planMetricsRaw.duration_ms,
      plan_api_ms: planMetricsRaw.duration_api_ms,
      plan_tokens_in: planMetricsRaw.input_tokens,
      plan_tokens_out: planMetricsRaw.output_tokens,
      plan_cost_usd: planMetricsRaw.total_cost_usd,
      plan_content: planContent,
      execute_duration_ms: executeMetricsRaw.duration_ms,
      execute_api_ms: executeMetricsRaw.duration_api_ms,
      execute_tokens_in: executeMetricsRaw.input_tokens,
      execute_tokens_out: executeMetricsRaw.output_tokens,
      execute_cost_usd: executeMetricsRaw.total_cost_usd,
    },
    sessionId,
  };
}
