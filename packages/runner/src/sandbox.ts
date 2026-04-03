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
  /** Shell prefix to activate venv for Python tasks */
  shellPrefix: string;
  cleanup: () => Promise<void>;
}

function isPythonTask(task: Task): boolean {
  const cmd = task.setup.install_command ?? "";
  return cmd.includes("pip") || cmd.includes("python");
}

/** Wraps a command with venv activation if this is a Python task */
function wrapCmd(cmd: string, tmpDir: string, python: boolean): string {
  if (!python) return cmd;
  return `source ${tmpDir}/.venv/bin/activate && ${cmd}`;
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

  const python = isPythonTask(task);

  // Create venv for Python tasks
  if (python) {
    console.log(`    Creating Python venv...`);
    await execAsync("python3 -m venv .venv", { cwd: tmpDir, timeout: 60_000 });
  }

  // Run setup commands
  if (task.setup.install_command) {
    const cmd = wrapCmd(task.setup.install_command, tmpDir, python);
    console.log(`    Running: ${task.setup.install_command}`);
    await execAsync(cmd, {
      cwd: tmpDir,
      timeout: 300_000,
      shell: "/bin/bash",
    });
  }

  if (task.setup.pre_commands) {
    for (const cmd of task.setup.pre_commands) {
      const wrapped = wrapCmd(cmd, tmpDir, python);
      await execAsync(wrapped, {
        cwd: tmpDir,
        timeout: 120_000,
        shell: "/bin/bash",
      });
    }
  }

  const shellPrefix = python ? `source ${tmpDir}/.venv/bin/activate && ` : "";

  return {
    dir: tmpDir,
    task,
    shellPrefix,
    cleanup: async () => {
      await rm(tmpDir, { recursive: true, force: true });
    },
  };
}
