import type { RunMetricsType } from "@planmode-bench/schema";
import type { SDKResultMessage } from "@anthropic-ai/claude-agent-sdk";

export function extractMetrics(resultMessage: SDKResultMessage): RunMetricsType {
  return {
    duration_ms: resultMessage.duration_ms,
    duration_api_ms: resultMessage.duration_api_ms,
    num_turns: resultMessage.num_turns,
    total_cost_usd: resultMessage.total_cost_usd,
    input_tokens: resultMessage.usage.input_tokens,
    output_tokens: resultMessage.usage.output_tokens,
    cache_read_tokens: resultMessage.usage.cache_read_input_tokens,
    cache_creation_tokens: resultMessage.usage.cache_creation_input_tokens,
    stop_reason: resultMessage.stop_reason,
    is_error: resultMessage.is_error,
  };
}

export function mergeMetrics(a: RunMetricsType, b: RunMetricsType): RunMetricsType {
  return {
    duration_ms: a.duration_ms + b.duration_ms,
    duration_api_ms: a.duration_api_ms + b.duration_api_ms,
    num_turns: a.num_turns + b.num_turns,
    total_cost_usd: a.total_cost_usd + b.total_cost_usd,
    input_tokens: a.input_tokens + b.input_tokens,
    output_tokens: a.output_tokens + b.output_tokens,
    cache_read_tokens: (a.cache_read_tokens ?? 0) + (b.cache_read_tokens ?? 0),
    cache_creation_tokens: (a.cache_creation_tokens ?? 0) + (b.cache_creation_tokens ?? 0),
    stop_reason: b.stop_reason,
    is_error: a.is_error || b.is_error,
  };
}
