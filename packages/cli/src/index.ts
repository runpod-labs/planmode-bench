#!/usr/bin/env node
import { Command } from "commander";
import { validateTask } from "./commands/validate.js";
import { runCommand } from "./commands/run.js";
import { scaffoldTask } from "./commands/scaffold.js";
import { reportCommand } from "./commands/report.js";
import { prepareCommand } from "./commands/prepare.js";

const program = new Command();

program
  .name("planmode-bench")
  .description(
    "Benchmark: Does Plan Mode + Context Clearing beat direct execution in Claude Code?"
  )
  .version("0.1.0");

program
  .command("validate <task-path>")
  .description("Validate a task definition")
  .action(async (taskPath: string) => {
    const ok = await validateTask(taskPath);
    process.exit(ok ? 0 : 1);
  });

program
  .command("run")
  .description("Run benchmarks")
  .option("-t, --tasks <tasks>", "Comma-separated task IDs, or 'all'", "all")
  .option(
    "-m, --modes <modes>",
    "Comma-separated modes: normal,plan-resume,plan-clear",
    "normal,plan-resume,plan-clear"
  )
  .option("-r, --runs <n>", "Runs per task per mode", "10")
  .option("--model <model>", "Model to use", "claude-sonnet-4-6")
  .option("--concurrency <n>", "Parallel task runs", "1")
  .option("--plan-budget-ratio <ratio>", "Budget ratio for plan phase", "0.3")
  .option("--resume <run-id>", "Resume a previous run (skip completed jobs)")
  .action(runCommand);

program
  .command("scaffold <task-id>")
  .description('Create a new task from template (e.g., "bug-fix/my-task")')
  .action(scaffoldTask);

program
  .command("report [run-id]")
  .description("Generate a report from results (defaults to latest)")
  .action(reportCommand);

program
  .command("prepare")
  .description("Pre-setup task bases (clone repos, install deps)")
  .option("-t, --tasks <tasks>", "Comma-separated task IDs, or 'all'", "all")
  .option("--concurrency <n>", "Parallel preparations", "5")
  .action(prepareCommand);

program.parse();
