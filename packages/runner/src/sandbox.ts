import { mkdtemp, cp, rm, access, mkdir, symlink, readdir } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import os from "node:os";
import type { Task } from "@planmode-bench/schema";

const execAsync = promisify(exec);

/**
 * Per-repo mutex to prevent concurrent git worktree operations on the same base.
 * Git locks .git/worktrees internally, so parallel `git worktree add` on the same
 * repo will fail (especially on large repos with many files).
 */
const repoLocks = new Map<string, Promise<void>>();

async function withRepoLock<T>(baseDir: string, fn: () => Promise<T>): Promise<T> {
  // Wait for any pending operation on this repo
  while (repoLocks.has(baseDir)) {
    await repoLocks.get(baseDir);
  }

  let resolve: () => void;
  const lock = new Promise<void>((r) => { resolve = r; });
  repoLocks.set(baseDir, lock);

  try {
    return await fn();
  } finally {
    repoLocks.delete(baseDir);
    resolve!();
  }
}

export interface Workspace {
  dir: string;
  task: Task;
  shellPrefix: string;
  cleanup: () => Promise<void>;
}

function isPythonTask(task: Task): boolean {
  const cmd = task.setup.install_command ?? "";
  return cmd.includes("pip") || cmd.includes("python");
}

/**
 * Base directory for a task -- set up once, never modified.
 * Contains the full repo + installed deps. Worktrees branch off this.
 */
const BASE_DIR = path.join(os.tmpdir(), "planmode-bench-bases");

async function getBaseDir(task: Task, tasksDir: string): Promise<string> {
  const baseDir = path.join(BASE_DIR, task.id.replace("/", "-"));

  // Check if base already exists and is ready
  try {
    await access(path.join(baseDir, ".git"));
    console.log(`    Base exists: ${baseDir}`);
    return baseDir;
  } catch {
    // Need to create base
  }

  await mkdir(baseDir, { recursive: true });

  const scaffoldDir = path.join(
    tasksDir,
    task.id.replace("/", path.sep),
    "scaffold"
  );

  if (task.setup.source_repo) {
    const { url, ref } = task.setup.source_repo;
    console.log(`    Cloning ${url}@${ref} into base...`);
    await execAsync(`git clone --depth 1 --branch ${ref} ${url} ${baseDir}/repo`, {
      timeout: 300_000,
    });
    await execAsync(
      `shopt -s dotglob && mv ${baseDir}/repo/* ${baseDir}/ && rm -rf ${baseDir}/repo`,
      { timeout: 30_000, shell: "/bin/bash" }
    );
    // Overlay scaffold files
    try {
      await access(scaffoldDir);
      await cp(scaffoldDir, baseDir, { recursive: true });
    } catch {
      // No scaffold is fine for repo tasks
    }
    await execAsync(
      "rm -rf .git && git init && git add -A && git commit --no-verify -m 'base'",
      { cwd: baseDir, timeout: 60_000 }
    );
  } else {
    await cp(scaffoldDir, baseDir, { recursive: true });
    await execAsync("git init && git add -A && git commit --no-verify -m 'base'", {
      cwd: baseDir,
      timeout: 30_000,
    });
  }

  const python = isPythonTask(task);

  // Create venv for Python tasks
  if (python) {
    console.log(`    Creating Python venv in base...`);
    await execAsync("python3 -m venv .venv", { cwd: baseDir, timeout: 60_000 });
  }

  // Install deps
  if (task.setup.install_command) {
    const cmd = python
      ? `source ${baseDir}/.venv/bin/activate && ${task.setup.install_command}`
      : task.setup.install_command;
    console.log(`    Installing deps in base...`);
    await execAsync(cmd, { cwd: baseDir, timeout: 300_000, shell: "/bin/bash" });
  }

  if (task.setup.pre_commands) {
    for (const pre of task.setup.pre_commands) {
      const cmd = python
        ? `source ${baseDir}/.venv/bin/activate && ${pre}`
        : pre;
      await execAsync(cmd, { cwd: baseDir, timeout: 120_000, shell: "/bin/bash" });
    }
  }

  // Add .gitignore for deps (we symlink them to worktrees instead of committing)
  const { writeFile: writeFileFS } = await import("node:fs/promises");
  const gitignorePath = path.join(baseDir, ".gitignore");
  try {
    const existing = await import("node:fs/promises").then(m => m.readFile(gitignorePath, "utf-8").catch(() => ""));
    const additions = ["node_modules/", ".venv/", "__pycache__/", "*.pyc", ".next/", "dist/"];
    const lines = existing.split("\n");
    for (const a of additions) {
      if (!lines.includes(a)) lines.push(a);
    }
    await writeFileFS(gitignorePath, lines.join("\n"));
  } catch {
    await writeFileFS(gitignorePath, "node_modules/\n.venv/\n__pycache__/\n*.pyc\n.next/\ndist/\n");
  }

  // Commit installed state so worktrees get a clean snapshot
  // Use --no-verify to skip any repo-specific hooks (husky, commitlint, etc.)
  await execAsync("git add -A && git commit --no-verify -m 'deps installed' --allow-empty", {
    cwd: baseDir,
    timeout: 120_000,
  });

  console.log(`    Base ready: ${baseDir}`);
  return baseDir;
}

/**
 * Create an isolated workspace using git worktree from the base.
 * Fast because it doesn't re-clone or re-install -- just branches off.
 */
export async function createWorkspace(
  task: Task,
  tasksDir: string
): Promise<Workspace> {
  const baseDir = await getBaseDir(task, tasksDir);
  const python = isPythonTask(task);

  // Create a worktree for this run
  const worktreeId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const branchName = `bench-${worktreeId}`;
  const worktreeDir = path.join(os.tmpdir(), `planmode-bench-wt-${worktreeId}`);

  await withRepoLock(baseDir, () =>
    execAsync(`git worktree add -b ${branchName} ${worktreeDir} HEAD`, {
      cwd: baseDir,
      timeout: 120_000,
    })
  );

  // For Node.js tasks, symlink node_modules from base (huge speed gain)
  try {
    await access(path.join(baseDir, "node_modules"));
    await symlink(
      path.join(baseDir, "node_modules"),
      path.join(worktreeDir, "node_modules"),
      "junction"
    );
  } catch {
    // No node_modules in base, that's fine
  }

  // For pnpm monorepos, also handle nested node_modules
  try {
    const dirs = await readdir(baseDir);
    for (const dir of dirs) {
      if (dir === "node_modules" || dir === ".git" || dir.startsWith(".")) continue;
      const nestedNM = path.join(baseDir, dir, "node_modules");
      try {
        await access(nestedNM);
        await mkdir(path.join(worktreeDir, dir), { recursive: true });
        await symlink(nestedNM, path.join(worktreeDir, dir, "node_modules"), "junction");
      } catch {
        // No nested node_modules
      }
    }
  } catch {
    // Can't read dirs, skip
  }

  // For Python tasks, symlink the venv from base
  if (python) {
    try {
      await access(path.join(baseDir, ".venv"));
      await symlink(
        path.join(baseDir, ".venv"),
        path.join(worktreeDir, ".venv"),
        "junction"
      );
    } catch {
      // No venv, create one
      await execAsync("python3 -m venv .venv", { cwd: worktreeDir, timeout: 60_000 });
    }
  }

  const shellPrefix = python ? `source ${worktreeDir}/.venv/bin/activate && ` : "";

  return {
    dir: worktreeDir,
    task,
    shellPrefix,
    cleanup: async () => {
      // Remove worktree and branch (locked to prevent concurrent git ops)
      await withRepoLock(baseDir, async () => {
        try {
          await execAsync(`git worktree remove ${worktreeDir} --force`, {
            cwd: baseDir,
            timeout: 15_000,
          });
        } catch {
          // Force cleanup if git worktree remove fails
          await rm(worktreeDir, { recursive: true, force: true });
          try {
            await execAsync(`git worktree prune`, { cwd: baseDir, timeout: 10_000 });
          } catch { /* ignore */ }
        }
        try {
          await execAsync(`git branch -D ${branchName}`, {
            cwd: baseDir,
            timeout: 5_000,
          });
        } catch { /* ignore */ }
      });
    },
  };
}

/**
 * Pre-setup all task bases. Call this before running benchmarks.
 */
const DEFAULT_PREP_CONCURRENCY = 5;

export async function prepareAllBases(
  tasks: Task[],
  tasksDir: string,
  concurrency: number = DEFAULT_PREP_CONCURRENCY
): Promise<void> {
  console.log(`Preparing ${tasks.length} task base(s) (concurrency: ${concurrency})...\n`);
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map(async (task) => {
        try {
          console.log(`  [${task.id}] starting...`);
          await getBaseDir(task, tasksDir);
          console.log(`  [${task.id}] ready`);
        } catch (error) {
          console.error(`  [${task.id}] FAILED: ${(error as Error).message}`);
        }
      })
    );
  }
  console.log();
}
