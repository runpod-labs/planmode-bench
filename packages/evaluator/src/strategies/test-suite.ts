import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { StrategyResultType } from "@planmode-bench/schema";

const execAsync = promisify(exec);

export async function evaluateTestSuite(
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

    const output = stdout + stderr;

    // Try to parse common test output formats
    // vitest/jest: Tests  X passed (Y)
    // mocha: X passing, Y failing
    const vitestMatch = output.match(/(\d+)\s+passed/);
    const failMatch = output.match(/(\d+)\s+fail/i);

    const passed = vitestMatch ? parseInt(vitestMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 0;
    const total = passed + failed || 1;
    const score = passed / total;

    return {
      type: "test-suite",
      score,
      weight,
      weighted_score: score * weight,
      passed: failed === 0 && passed > 0,
      details: {
        command,
        tests_passed: passed,
        tests_failed: failed,
        tests_total: total,
        output: output.slice(-2000),
      },
    };
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    const output = (err.stdout ?? "") + (err.stderr ?? "");

    // Even on failure, try to parse test counts
    const vitestMatch = output.match(/(\d+)\s+passed/);
    const failMatch = output.match(/(\d+)\s+fail/i);
    const passed = vitestMatch ? parseInt(vitestMatch[1], 10) : 0;
    const failed = failMatch ? parseInt(failMatch[1], 10) : 0;
    const total = passed + failed || 1;
    const score = passed / total;

    return {
      type: "test-suite",
      score,
      weight,
      weighted_score: score * weight,
      passed: false,
      details: {
        command,
        tests_passed: passed,
        tests_failed: failed,
        tests_total: total,
        error: err.message,
        output: output.slice(-2000),
      },
    };
  }
}
