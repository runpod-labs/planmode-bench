import { query, type SDKResultMessage, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Task, RunMetricsType } from "@planmode-bench/schema";
import { extractMetrics } from "../metrics.js";

export interface NormalGuidedResult {
  metrics: RunMetricsType;
  sessionId?: string;
  messages: SDKMessage[];
}

/**
 * Normal-guided mode: Single session, but prompted to explore and think first.
 * No enforced plan mode -- Claude has all tools from the start.
 * Tests whether just ASKING to think first is enough.
 */
export async function runNormalGuidedMode(
  task: Task,
  workDir: string,
  model: string
): Promise<NormalGuidedResult> {
  let resultMessage: SDKResultMessage | null = null;
  const messages: SDKMessage[] = [];

  for await (const message of query({
    prompt: `${task.prompt}\n\nBefore you start implementing, first explore the codebase thoroughly. Read the relevant files, understand the architecture and patterns used, and think about your approach. Then implement your solution step by step.`,
    options: {
      cwd: workDir,
      permissionMode: "bypassPermissions",
      allowDangerouslySkipPermissions: true,
      maxTurns: 150,
      maxBudgetUsd: task.setup.max_budget_usd,
      model,
    },
  })) {
    messages.push(message);
    if (message.type === "result") {
      resultMessage = message;
    }
  }

  if (!resultMessage) {
    throw new Error(`Normal-guided mode run for ${task.id} produced no result`);
  }

  return {
    metrics: extractMetrics(resultMessage),
    sessionId: resultMessage.session_id,
    messages,
  };
}
