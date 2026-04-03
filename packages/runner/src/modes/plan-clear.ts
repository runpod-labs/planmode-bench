import { writeFile } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { query, type SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Task, RunMetricsType, PlanMetricsType } from "@planmode-bench/schema";
import { extractMetrics, mergeMetrics } from "../metrics.js";

const execAsync = promisify(exec);

export interface PlanClearResult {
  metrics: RunMetricsType;
  planMetrics: PlanMetricsType;
  sessionId?: string;
}

/**
 * Plan+Clear mode: Two phases, FRESH session for execution.
 * Phase 1: Plan -- Uses `permissionMode: "plan"` (real plan mode). Claude
 *   explores the codebase and produces a plan saved to PLAN.md.
 * Phase 2: Execute -- Brand NEW session with full permissions. Gets the
 *   original task prompt + reference to PLAN.md. Context is cleared.
 *
 * This simulates the real user workflow:
 * 1. Enter plan mode -> Claude explores, creates plan
 * 2. Accept plan -> context clears
 * 3. Fresh session implements from plan + original requirements
 */
export async function runPlanClearMode(
  task: Task,
  workDir: string,
  model: string,
  planBudgetRatio: number = 0.3
): Promise<PlanClearResult> {
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

  // Save plan to file in workspace
  const planPath = path.join(workDir, "PLAN.md");
  await writeFile(planPath, planContent, "utf-8");

  // Commit the plan file so it's part of the repo
  await execAsync("git add PLAN.md && git commit -m 'add implementation plan'", {
    cwd: workDir,
  });

  // Phase 2: Execute in a FRESH session (no resume -- context is cleared)
  // Include the ORIGINAL task prompt so Claude knows the full requirements.
  let executeResult: SDKResultMessage | null = null;

  for await (const message of query({
    prompt: `${task.prompt}\n\nAn implementation plan has been prepared for you in the file PLAN.md. Read it first, then execute the plan step by step, making all the necessary code changes.`,
    options: {
      cwd: workDir,
      // No `resume` -- brand new session with fresh context
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 50,
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
    sessionId: executeResult.session_id,
  };
}
