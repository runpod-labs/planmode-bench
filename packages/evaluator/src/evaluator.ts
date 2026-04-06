import type { EvaluationStrategyType, EvaluationResultType } from "@planmode-bench/schema";
import { evaluateTestSuite } from "./strategies/test-suite.js";
import { evaluateBuild } from "./strategies/build.js";
import { evaluateFileCheck } from "./strategies/file-check.js";
import { evaluateRegex } from "./strategies/regex.js";
import { evaluateCustom } from "./strategies/custom.js";
import { evaluateTestIntegrity } from "./strategies/test-integrity.js";
import { evaluateLLMJudge } from "./strategies/llm-judge.js";

export async function evaluate(
  workDir: string,
  strategies: EvaluationStrategyType[],
  shellPrefix: string = ""
): Promise<EvaluationResultType> {
  const start = performance.now();
  const strategyResults = [];
  const prefix = (cmd: string) => shellPrefix ? `${shellPrefix}${cmd}` : cmd;

  for (const strategy of strategies) {
    switch (strategy.type) {
      case "test-suite":
        strategyResults.push(
          await evaluateTestSuite(workDir, prefix(strategy.command), strategy.weight)
        );
        break;
      case "build":
        strategyResults.push(
          await evaluateBuild(workDir, prefix(strategy.command), strategy.weight)
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
          await evaluateCustom(workDir, prefix(strategy.command), strategy.weight)
        );
        break;
      case "lint":
        // Lint uses the same logic as build (exit code 0 = pass)
        strategyResults.push(
          await evaluateBuild(workDir, prefix(strategy.command), strategy.weight)
        );
        break;
      case "test-integrity":
        strategyResults.push(
          await evaluateTestIntegrity(workDir, strategy.weight)
        );
        break;
      case "llm-judge":
        strategyResults.push(
          await evaluateLLMJudge(workDir, strategy.rubric, strategy.model ?? "claude-haiku-4-5-20251001", strategy.weight)
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
