import { z } from "zod";
import { ModeEnum } from "./result.js";

export const RunnerConfig = z.object({
  tasks: z.array(z.string()).default(["all"]),
  modes: z.array(ModeEnum).default(["normal", "plan-resume", "plan-clear"]),
  runs_per_task: z.number().int().min(1).default(3),
  model: z.string().default("claude-sonnet-4-6"),
  concurrency: z.number().int().min(1).default(1),
  output_dir: z.string().optional(),
  plan_budget_ratio: z.number().min(0.1).max(0.5).default(0.3),
});

export type RunnerConfigType = z.infer<typeof RunnerConfig>;
