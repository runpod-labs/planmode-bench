import type { EvaluationStrategyType, EvaluationResultType } from "@planmode-bench/schema";
import { evaluateTestSuite } from "./strategies/test-suite.js";
import { evaluateBuild } from "./strategies/build.js";
import { evaluateFileCheck } from "./strategies/file-check.js";
import { evaluateRegex } from "./strategies/regex.js";
import { evaluateCustom } from "./strategies/custom.js";
import { evaluateTestIntegrity } from "./strategies/test-integrity.js";

export async function evaluate(
  workDir: string,
  strategies: EvaluationStrategyType[]
): Promise<EvaluationResultType> {
  const start = performance.now();
  const strategyResults = [];

  for (const strategy of strategies) {
    switch (strategy.type) {
      case "test-suite":
        strategyResults.push(
          await evaluateTestSuite(workDir, strategy.command, strategy.weight)
        );
        break;
      case "build":
        strategyResults.push(
          await evaluateBuild(workDir, strategy.command, strategy.weight)
        );
        break;
      case "file-check":
        strategyResults.push(
          await evaluateFileCheck(workDir, strategy.checks, strategy.weight)
        );
        break;
      case "regex":
        strategyResults.push(
          await evaluateRegex(workDir, strategy.file, strategy.patterns, strategy.weight)
        );
        break;
      case "custom":
        strategyResults.push(
          await evaluateCustom(workDir, strategy.command, strategy.weight)
        );
        break;
      case "lint":
        // Lint uses the same logic as build (exit code 0 = pass)
        strategyResults.push(
          await evaluateBuild(workDir, strategy.command, strategy.weight)
        );
        break;
      case "diff":
        // Diff evaluation: simplified to file-check for now
        strategyResults.push({
          type: "diff",
          score: 0,
          weight: strategy.weight,
          weighted_score: 0,
          passed: false,
          details: { note: "Diff strategy not yet implemented" },
        });
        break;
      case "test-integrity":
        strategyResults.push(
          await evaluateTestIntegrity(workDir, strategy.weight)
        );
        break;
    }
  }

  const overall_score = strategyResults.reduce(
    (sum, r) => sum + r.weighted_score,
    0
  );

  return {
    overall_score,
    strategy_results: strategyResults,
    evaluation_duration_ms: Math.round(performance.now() - start),
  };
}
