import { mkdtemp, cp, rm } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import type { Task } from "@planmode-bench/schema";

const execAsync = promisify(exec);

export interface Workspace {
  dir: string;
  task: Task;
  cleanup: () => Promise<void>;
}

export async function createWorkspace(
  task: Task,
  tasksDir: string
): Promise<Workspace> {
  const tmpDir = await mkdtemp(
    path.join(os.tmpdir(), `planmode-bench-${task.id.replace("/", "-")}-`)
  );

  const scaffoldDir = path.join(
    tasksDir,
    task.id.replace("/", path.sep),
    "scaffold"
  );

  // Copy scaffold to temp directory
  await cp(scaffoldDir, tmpDir, { recursive: true });

  // Initialize git so Claude Code has repo context
  await execAsync("git init && git add -A && git commit -m 'initial scaffold'", {
    cwd: tmpDir,
  });

  // Run setup commands
  if (task.setup.install_command) {
    await execAsync(task.setup.install_command, { cwd: tmpDir, timeout: 120_000 });
  }

  if (task.setup.pre_commands) {
    for (const cmd of task.setup.pre_commands) {
      await execAsync(cmd, { cwd: tmpDir, timeout: 60_000 });
    }
  }

  return {
    dir: tmpDir,
    task,
    cleanup: async () => {
      await rm(tmpDir, { recursive: true, force: true });
    },
  };
}
