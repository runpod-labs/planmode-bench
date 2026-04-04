import type { AggregatedModeStatsType, RunResultType } from "@planmode-bench/schema";

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Welch's t-test for comparing two sample means.
 * Returns the p-value (two-tailed).
 */
export function welchTTest(a: number[], b: number[]): number {
  if (a.length < 2 || b.length < 2) return 1.0;

  const meanA = mean(a);
  const meanB = mean(b);
  const varA = a.reduce((sum, v) => sum + (v - meanA) ** 2, 0) / (a.length - 1);
  const varB = b.reduce((sum, v) => sum + (v - meanB) ** 2, 0) / (b.length - 1);

  const seA = varA / a.length;
  const seB = varB / b.length;
  const se = Math.sqrt(seA + seB);

  if (se === 0) return 1.0;

  const t = Math.abs(meanA - meanB) / se;

  // Welch-Satterthwaite degrees of freedom
  const df = (seA + seB) ** 2 / (seA ** 2 / (a.length - 1) + seB ** 2 / (b.length - 1));

  // Approximate p-value using the normal distribution for large df
  // For small df, this is an approximation
  const p = 2 * (1 - normalCDF(t));
  return Math.max(0, Math.min(1, p));
}

function normalCDF(x: number): number {
  // Approximation of the standard normal CDF
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * t-critical value for 95% confidence interval (two-tailed).
 * Lookup table for df 1-29, z-approximation for df >= 30.
 */
export function tCritical95(df: number): number {
  const table: Record<number, number> = {
    1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571,
    6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262, 10: 2.228,
    11: 2.201, 12: 2.179, 13: 2.160, 14: 2.145, 15: 2.131,
    16: 2.120, 17: 2.110, 18: 2.101, 19: 2.093, 20: 2.086,
    21: 2.080, 22: 2.074, 23: 2.069, 24: 2.064, 25: 2.060,
    26: 2.056, 27: 2.052, 28: 2.048, 29: 2.045,
  };
  if (df < 1) return Infinity;
  if (df <= 29) return table[df];
  return 1.96;
}

/**
 * Compute 95% confidence interval for the mean of score values (clamped to [0, 1]).
 * For n < 2, returns [mean, mean].
 */
export function confidenceInterval95(values: number[]): { ci_lower: number; ci_upper: number } {
  if (values.length < 2) {
    const m = values.length === 0 ? 0 : mean(values);
    return { ci_lower: m, ci_upper: m };
  }
  const m = mean(values);
  const s = stddev(values);
  const n = values.length;
  const t = tCritical95(n - 1);
  const margin = t * (s / Math.sqrt(n));
  return {
    ci_lower: Math.max(0, m - margin),
    ci_upper: Math.min(1, m + margin),
  };
}

export function aggregateResults(results: RunResultType[]): AggregatedModeStatsType {
  const scores = results.map((r) => r.evaluation.overall_score);
  const durations = results.map((r) => r.metrics.duration_ms);
  const costs = results.map((r) => r.metrics.total_cost_usd);
  const tokens = results.map((r) => r.metrics.input_tokens + r.metrics.output_tokens);
  const turns = results.map((r) => r.metrics.num_turns);

  const ci = confidenceInterval95(scores);

  return {
    avg_score: mean(scores),
    median_score: median(scores),
    success_rate: scores.length > 0 ? scores.filter((s) => s >= 0.5).length / scores.length : 0,
    avg_duration_ms: mean(durations),
    avg_cost_usd: mean(costs),
    avg_tokens: mean(tokens),
    avg_turns: mean(turns),
    ci_lower: ci.ci_lower,
    ci_upper: ci.ci_upper,
    n: scores.length,
  };
}
