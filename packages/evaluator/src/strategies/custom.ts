import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { StrategyResultType } from "@planmode-bench/schema";

const execAsync = promisify(exec);

export async function evaluateCustom(
  workDir: string,
  command: string,
  weight: number
): Promise<StrategyResultType> {
  try {
    const { stdout } = await execAsync(command, {
      cwd: workDir,
      timeout: 60_000,
    });

    const result = JSON.parse(stdout.trim()) as { score: number; details?: Record<string, unknown> };
    const score = Math.max(0, Math.min(1, result.score));

    return {
      type: "custom",
      score,
      weight,
      weighted_score: score * weight,
      passed: score >= 0.5,
      details: result.details ?? {},
    };
  } catch (error) {
    return {
      type: "custom",
      score: 0,
      weight,
      weighted_score: 0,
      passed: false,
      details: { error: (error as Error).message },
    };
  }
}
