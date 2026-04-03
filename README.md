# planmode-bench

**Does Plan Mode + Context Clearing beat direct execution in Claude Code?**

A benchmarking framework that compares three execution modes in Claude Code to find when planning helps, when it hurts, and whether clearing context makes a difference.

## The Three Modes

| Mode | How it works |
|------|-------------|
| **Normal** | Single session. Claude reads, edits, tests -- all in one go. |
| **Plan + Resume** | Phase 1: plan (read-only). Phase 2: resume same session to execute. Full context preserved. |
| **Plan + Clear** | Phase 1: plan (read-only), save plan to file. Phase 2: **fresh session** reads plan and executes. Context cleared. |

### Key Comparisons

- **Normal vs Plan+Resume** -- Does planning alone improve quality?
- **Plan+Resume vs Plan+Clear** -- Does clearing context improve quality?
- **Normal vs Plan+Clear** -- Does the full workflow (plan + clear) improve quality?

## Quick Start

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Validate a task
pnpm cli validate tasks/bug-fix/off-by-one-loop

# Run benchmarks (requires Claude Code SDK / API key)
pnpm cli run --tasks all --modes normal,plan-resume,plan-clear --runs 3

# View results
pnpm cli report

# Start website dev server
pnpm dev:website
```

## Project Structure

```
planmode-bench/
├── packages/
│   ├── schema/        # Zod schemas for tasks, results, config
│   ├── runner/        # Benchmark execution engine (3 modes)
│   ├── evaluator/     # Result scoring (test-suite, build, file-check, regex, custom)
│   ├── cli/           # Developer CLI (validate, run, scaffold, report)
│   └── website/       # Next.js dashboard with Recharts
├── tasks/             # Benchmark task definitions
│   ├── bug-fix/off-by-one-loop/          (easy)
│   ├── feature-addition/add-pagination/  (medium)
│   └── refactoring/extract-service-layer/ (hard)
├── results/           # Benchmark results (JSON)
└── config/            # Runner configuration
```

## Adding a Task

```bash
# Scaffold a new task
pnpm cli scaffold bug-fix/my-new-task

# Edit the generated files:
# - tasks/bug-fix/my-new-task/task.yaml (task definition)
# - tasks/bug-fix/my-new-task/scaffold/ (starting code)

# Validate
pnpm cli validate tasks/bug-fix/my-new-task
```

### Task Definition (task.yaml)

```yaml
id: "bug-fix/my-new-task"
name: "Fix My Bug"
version: 1
category: "bug-fix"          # bug-fix | feature-addition | refactoring | algorithm | multi-file | test-writing | performance | api-integration
difficulty: "medium"          # easy | medium | hard | expert
estimated_time_minutes: 10
tags: ["typescript"]
author: "your-github-username"
created_at: "2026-04-03"

prompt: |
  Describe what Claude should do.

setup:
  install_command: "npm install"
  timeout_minutes: 10
  max_budget_usd: 2.00

evaluation:
  - type: "test-suite"
    command: "npx vitest run"
    weight: 0.7
  - type: "build"
    command: "npx tsc --noEmit"
    weight: 0.3
```

## How It Works

1. **Runner** copies a task's `scaffold/` into a temp directory
2. Runs the task in the specified mode via the Claude Agent SDK
3. **Evaluator** scores the result using weighted strategies
4. Results are saved as JSON and aggregated into summaries
5. **Website** renders the comparison dashboard

## Contributing

1. Fork the repo
2. Create a new task: `pnpm cli scaffold <category>/<name>`
3. Fill in `task.yaml` and scaffold code
4. Validate: `pnpm cli validate tasks/<category>/<name>`
5. Submit a PR

## License

MIT
