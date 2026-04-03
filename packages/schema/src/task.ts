import { z } from "zod";

export const CategoryEnum = z.enum([
  "bug-fix",
  "feature-addition",
  "refactoring",
  "algorithm",
  "multi-file",
  "test-writing",
  "performance",
  "api-integration",
]);

export type Category = z.infer<typeof CategoryEnum>;

export const DifficultyEnum = z.enum(["easy", "medium", "hard", "expert"]);

export type Difficulty = z.infer<typeof DifficultyEnum>;

export const EvaluationStrategy = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("test-suite"),
    command: z.string(),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("build"),
    command: z.string(),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("file-check"),
    checks: z.array(
      z.object({
        path: z.string(),
        must_exist: z.boolean().optional(),
        must_contain: z.array(z.string()).optional(),
        must_not_contain: z.array(z.string()).optional(),
      })
    ),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("regex"),
    file: z.string(),
    patterns: z.array(
      z.object({
        pattern: z.string(),
        should_match: z.boolean(),
      })
    ),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("lint"),
    command: z.string(),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("diff"),
    reference_dir: z.string().default("reference"),
    files: z.array(z.string()),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("custom"),
    command: z.string(),
    weight: z.number().min(0).max(1),
  }),
  z.object({
    type: z.literal("test-integrity"),
    weight: z.number().min(0).max(1),
  }),
]);

export type EvaluationStrategyType = z.infer<typeof EvaluationStrategy>;

export const SourceRepo = z.object({
  url: z.string(),
  ref: z.string(),
});

export const TaskSetup = z.object({
  node_version: z.string().optional(),
  source_repo: SourceRepo.optional(),
  install_command: z.string().optional(),
  pre_commands: z.array(z.string()).optional(),
  timeout_minutes: z.number().default(10),
  max_budget_usd: z.number().default(2.0),
});

export type TaskSetupType = z.infer<typeof TaskSetup>;

export const PlanQualityHints = z
  .object({
    should_mention: z.array(z.string()).optional(),
    description: z.string().optional(),
  })
  .optional();

export const TaskSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+\/[a-z0-9-]+$/),
  name: z.string().min(1).max(200),
  version: z.number().int().positive(),
  category: CategoryEnum,
  difficulty: DifficultyEnum,
  estimated_time_minutes: z.number().positive(),
  tags: z.array(z.string()),
  author: z.string(),
  created_at: z.string(),
  prompt: z.string().min(10),
  setup: TaskSetup,
  evaluation: z
    .array(EvaluationStrategy)
    .min(1)
    .refine(
      (evals) => {
        const totalWeight = evals.reduce((sum, e) => sum + e.weight, 0);
        return Math.abs(totalWeight - 1.0) < 0.01;
      },
      { message: "Evaluation weights must sum to 1.0" }
    ),
  plan_quality_hints: PlanQualityHints,
});

export type Task = z.infer<typeof TaskSchema>;
