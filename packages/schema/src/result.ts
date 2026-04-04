import { z } from "zod";

export const ModeEnum = z.enum(["normal", "normal-guided", "plan-resume", "plan-clear"]);

export type Mode = z.infer<typeof ModeEnum>;

export const ToolCallCounts = z.record(z.string(), z.number());

export const RunMetrics = z.object({
  duration_ms: z.number(),
  duration_api_ms: z.number(),
  num_turns: z.number(),
  total_cost_usd: z.number(),
  input_tokens: z.number(),
  output_tokens: z.number(),
  cache_read_tokens: z.number().optional(),
  cache_creation_tokens: z.number().optional(),
  stop_reason: z.string().nullable(),
  is_error: z.boolean(),
  tool_calls: ToolCallCounts.optional(),
});

export type RunMetricsType = z.infer<typeof RunMetrics>;

export const PlanMetrics = z.object({
  plan_duration_ms: z.number(),
  plan_api_ms: z.number(),
  plan_tokens_in: z.number(),
  plan_tokens_out: z.number(),
  plan_cost_usd: z.number(),
  plan_content: z.string(),
  execute_duration_ms: z.number(),
  execute_api_ms: z.number(),
  execute_tokens_in: z.number(),
  execute_tokens_out: z.number(),
  execute_cost_usd: z.number(),
});

export type PlanMetricsType = z.infer<typeof PlanMetrics>;

export const StrategyResult = z.object({
  type: z.string(),
  score: z.number().min(0).max(1),
  weight: z.number().min(0).max(1),
  weighted_score: z.number(),
  passed: z.boolean(),
  details: z.record(z.string(), z.unknown()),
});

export type StrategyResultType = z.infer<typeof StrategyResult>;

export const EvaluationResult = z.object({
  overall_score: z.number().min(0).max(1),
  strategy_results: z.array(StrategyResult),
  evaluation_duration_ms: z.number(),
});

export type EvaluationResultType = z.infer<typeof EvaluationResult>;

export const RunResult = z.object({
  schema_version: z.literal(1),
  task_id: z.string(),
  task_name: z.string(),
  mode: ModeEnum,
  run_number: z.number().int().positive(),
  timestamp: z.string(),
  model: z.string(),
  claude_code_version: z.string().optional(),
  metrics: RunMetrics,
  plan_metrics: PlanMetrics.optional(),
  evaluation: EvaluationResult,
  session_id: z.string().optional(),
  permission_denials: z.array(z.string()).optional(),
});

export type RunResultType = z.infer<typeof RunResult>;

export const AggregatedModeStats = z.object({
  avg_score: z.number(),
  median_score: z.number(),
  success_rate: z.number(),
  avg_duration_ms: z.number(),
  avg_cost_usd: z.number(),
  avg_tokens: z.number(),
  avg_turns: z.number(),
});

export type AggregatedModeStatsType = z.infer<typeof AggregatedModeStats>;

export const ModeDelta = z.object({
  score_diff: z.number(),
  time_diff_pct: z.number(),
  token_diff_pct: z.number(),
  cost_diff_pct: z.number(),
  winner: z.enum(["normal", "plan-resume", "plan-clear", "tie"]),
});

export const TaskComparison = z.object({
  task_id: z.string(),
  normal: z.object({ scores: z.array(z.number()), avg: z.number(), std: z.number() }),
  "plan-resume": z.object({ scores: z.array(z.number()), avg: z.number(), std: z.number() }),
  "plan-clear": z.object({ scores: z.array(z.number()), avg: z.number(), std: z.number() }),
  winner: z.enum(["normal", "plan-resume", "plan-clear", "tie"]),
  p_value: z.number().optional(),
});

export const RunSummary = z.object({
  schema_version: z.literal(1),
  run_id: z.string(),
  timestamp: z.string(),
  model: z.string(),
  claude_code_version: z.string().optional(),
  runs_per_task: z.number(),
  total_tasks: z.number(),
  total_runs: z.number(),
  total_cost_usd: z.number(),
  total_duration_ms: z.number(),
  overall: z.object({
    normal: AggregatedModeStats,
    "plan-resume": AggregatedModeStats,
    "plan-clear": AggregatedModeStats,
  }),
  by_category: z.record(
    z.string(),
    z.object({
      normal: AggregatedModeStats,
      "plan-resume": AggregatedModeStats,
      "plan-clear": AggregatedModeStats,
    })
  ),
  by_difficulty: z.record(
    z.string(),
    z.object({
      normal: AggregatedModeStats,
      "plan-resume": AggregatedModeStats,
      "plan-clear": AggregatedModeStats,
    })
  ),
  per_task: z.array(TaskComparison),
});

export type RunSummaryType = z.infer<typeof RunSummary>;
