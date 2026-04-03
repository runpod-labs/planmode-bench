import { readFile } from "node:fs/promises";
import path from "node:path";
import type { StrategyResultType } from "@planmode-bench/schema";

interface RegexPattern {
  pattern: string;
  should_match: boolean;
}

export async function evaluateRegex(
  workDir: string,
  file: string,
  patterns: RegexPattern[],
  weight: number
): Promise<StrategyResultType> {
  let content: string;
  try {
    content = await readFile(path.join(workDir, file), "utf-8");
  } catch {
    return {
      type: "regex",
      score: 0,
      weight,
      weighted_score: 0,
      passed: false,
      details: { error: `File not found: ${file}` },
    };
  }

  let matched = 0;
  const patternResults: Record<string, unknown>[] = [];

  for (const { pattern, should_match } of patterns) {
    const regex = new RegExp(pattern);
    const doesMatch = regex.test(content);
    const correct = doesMatch === should_match;
    if (correct) matched++;
    patternResults.push({ pattern, should_match, actual_match: doesMatch, correct });
  }

  const score = patterns.length > 0 ? matched / patterns.length : 0;

  return {
    type: "regex",
    score,
    weight,
    weighted_score: score * weight,
    passed: matched === patterns.length,
    details: { patterns_matched: matched, patterns_total: patterns.length, pattern_results: patternResults },
  };
}
