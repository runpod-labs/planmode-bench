import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse as parseYAML } from "yaml";
import { TaskSchema, type Task } from "@planmode-bench/schema";
import { prepareAllBases } from "@planmode-bench/runner";

interface PrepareCommandOptions {
  tasks?: string;
  concurrency?: string;
}

async function discoverTasks(tasksDir: string, filter: string[]): Promise<Task[]> {
  const tasks: Task[] = [];
  const categories = await readdir(tasksDir);
  for (const category of categories) {
    const categoryPath = path.join(tasksDir, category);
    try {
      const taskDirs = await readdir(categoryPath);
      for (const taskName of taskDirs) {
        const taskPath = path.join(categoryPath, taskName);
        try {
          const content = await readFile(path.join(taskPath, "task.yaml"), "utf-8");
          const task = TaskSchema.parse(parseYAML(content));
          if (filter[0] === "all" || filter.includes(task.id)) {
            tasks.push(task);
          }
        } catch {
          // Skip invalid
        }
      }
    } catch {
      // Skip non-dirs
    }
  }
  return tasks;
}

export async function prepareCommand(options: PrepareCommandOptions): Promise<void> {
  const tasksDir = path.join(process.cwd(), "tasks");
  const filter = options.tasks
    ? options.tasks.split(",").map((t) => t.trim())
    : ["all"];
  const concurrency = options.concurrency ? parseInt(options.concurrency, 10) : 5;

  const tasks = await discoverTasks(tasksDir, filter);
  console.log(`Found ${tasks.length} task(s)\n`);

  if (tasks.length === 0) {
    console.error("No tasks found");
    process.exit(1);
  }

  await prepareAllBases(tasks, tasksDir, concurrency);
  console.log("All bases ready.");
}
