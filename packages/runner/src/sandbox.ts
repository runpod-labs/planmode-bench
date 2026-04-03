import { mkdtemp, cp, rm, access } from "node:fs/promises";
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

  if (task.setup.source_repo) {
    // Clone real repo, then overlay scaffold files on top
    const { url, ref } = task.setup.source_repo;
    console.log(`    Cloning ${url}@${ref}...`);
    await execAsync(
      `git clone --depth 1 --branch ${ref} ${url} ${tmpDir}/repo`,
      { timeout: 300_000 }
    );
    // Move repo contents to tmpDir root
    await execAsync(
      `shopt -s dotglob && mv ${tmpDir}/repo/* ${tmpDir}/ && rm -rf ${tmpDir}/repo`,
      { timeout: 30_000, shell: "/bin/bash" }
    );
    // Overlay scaffold files on top (tests, configs we add)
    try {
      await access(scaffoldDir);
      await cp(scaffoldDir, tmpDir, { recursive: true });
    } catch {
      // No scaffold dir is fine for repo-based tasks
    }
    // Re-init git with our overlay included
    await execAsync(
      "rm -rf .git && git init && git add -A && git commit -m 'initial scaffold'",
      { cwd: tmpDir, timeout: 30_000 }
    );
  } else {
    // Standard scaffold-only task
    await cp(scaffoldDir, tmpDir, { recursive: true });
    await execAsync("git init && git add -A && git commit -m 'initial scaffold'", {
      cwd: tmpDir,
    });
  }

  // Run setup commands
  if (task.setup.install_command) {
    console.log(`    Running: ${task.setup.install_command}`);
    await execAsync(task.setup.install_command, { cwd: tmpDir, timeout: 300_000 });
  }

  if (task.setup.pre_commands) {
    for (const cmd of task.setup.pre_commands) {
      await execAsync(cmd, { cwd: tmpDir, timeout: 120_000 });
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
