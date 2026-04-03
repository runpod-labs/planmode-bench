import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const TASK_TEMPLATE = `id: "{id}"
name: "{name}"
version: 1

category: "{category}"
difficulty: "medium"
estimated_time_minutes: 10
tags: []
author: "your-github-username"
created_at: "{date}"

prompt: |
  Describe the task here. Be specific about what needs to be done.

setup:
  install_command: "npm install"
  timeout_minutes: 10
  max_budget_usd: 2.00

evaluation:
  - type: "test-suite"
    command: "npm test"
    weight: 0.7

  - type: "build"
    command: "npm run build"
    weight: 0.3
`;

export async function scaffoldTask(taskId: string): Promise<void> {
  const parts = taskId.split("/");
  if (parts.length !== 2) {
    console.error('Task ID must be in format "category/task-name"');
    process.exit(1);
  }

  const [category, name] = parts;
  const tasksDir = path.join(process.cwd(), "tasks");
  const taskDir = path.join(tasksDir, category, name);
  const scaffoldDir = path.join(taskDir, "scaffold", "src");
  const testsDir = path.join(taskDir, "scaffold", "tests");

  await mkdir(scaffoldDir, { recursive: true });
  await mkdir(testsDir, { recursive: true });

  const humanName = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const yaml = TASK_TEMPLATE
    .replace("{id}", taskId)
    .replace("{name}", humanName)
    .replace("{category}", category)
    .replace("{date}", new Date().toISOString().split("T")[0]);

  await writeFile(path.join(taskDir, "task.yaml"), yaml);

  // Scaffold package.json
  await writeFile(
    path.join(taskDir, "scaffold", "package.json"),
    JSON.stringify(
      {
        name: `bench-task-${name}`,
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
          build: "tsc",
          test: "vitest run",
        },
        devDependencies: {
          typescript: "^5.7.0",
          vitest: "^3.1.0",
        },
      },
      null,
      2
    )
  );

  await writeFile(
    path.join(taskDir, "scaffold", "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "Node16",
          moduleResolution: "Node16",
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ["src"],
      },
      null,
      2
    )
  );

  console.log(`Scaffolded new task at ${taskDir}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Edit ${path.join(taskDir, "task.yaml")}`);
  console.log(`  2. Add source files to ${scaffoldDir}`);
  console.log(`  3. Add tests to ${testsDir}`);
  console.log(`  4. Run: pnpm cli validate tasks/${taskId}`);
}
