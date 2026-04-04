import { query, type SDKResultMessage, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Task, RunMetricsType } from "@planmode-bench/schema";
import { extractMetrics } from "../metrics.js";
import { withRetry } from "../retry.js";

export interface NormalModeResult {
  metrics: RunMetricsType;
  sessionId?: string;
  messages: SDKMessage[];
}

/**
 * Normal mode: Single session, Claude does everything in one go.
 * No planning phase, no context clearing. All tools available.
 */
export async function runNormalMode(
  task: Task,
  workDir: string,
  model: string
): Promise<NormalModeResult> {
  return withRetry(async () => {
    let resultMessage: SDKResultMessage | null = null;
    const messages: SDKMessage[] = [];

    for await (const message of query({
      prompt: task.prompt,
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
      throw new Error(`Normal mode run for ${task.id} produced no result`);
    }

    return {
      metrics: extractMetrics(resultMessage),
      sessionId: resultMessage.session_id,
      messages,
    };
  }, { label: `normal/${task.id}` });
}
