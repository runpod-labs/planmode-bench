import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { StrategyResultType } from "@planmode-bench/schema";

const execAsync = promisify(exec);

export async function evaluateBuild(
  workDir: string,
  command: string,
  weight: number
): Promise<StrategyResultType> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: 60_000,
      shell: "/bin/bash",
    });

    return {
      type: "build",
      score: 1.0,
      weight,
      weighted_score: weight,
      passed: true,
      details: {
        command,
        exit_code: 0,
        output: (stdout + stderr).slice(-1000),
      },
    };
  } catch (error) {
    const err = error as { code?: number; stdout?: string; stderr?: string };
    return {
      type: "build",
      score: 0.0,
      weight,
      weighted_score: 0.0,
      passed: false,
      details: {
        command,
        exit_code: err.code ?? 1,
        output: ((err.stdout ?? "") + (err.stderr ?? "")).slice(-1000),
      },
    };
  }
}
