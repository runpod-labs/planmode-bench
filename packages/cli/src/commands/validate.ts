import { readFile, access } from "node:fs/promises";
import path from "node:path";
import { parse as parseYAML } from "yaml";
import { TaskSchema } from "@planmode-bench/schema";

export async function validateTask(taskPath: string): Promise<boolean> {
  const yamlPath = path.resolve(taskPath, "task.yaml");
  const scaffoldPath = path.resolve(taskPath, "scaffold");

  console.log(`Validating ${taskPath}...\n`);

  // Check task.yaml exists
  try {
    await access(yamlPath);
  } catch {
    console.error("FAIL: task.yaml not found");
    return false;
  }

  // Parse and validate schema
  try {
    const content = await readFile(yamlPath, "utf-8");
    const raw = parseYAML(content);
    const task = TaskSchema.parse(raw);
    console.log(`  name: ${task.name}`);
    console.log(`  category: ${task.category}`);
    console.log(`  difficulty: ${task.difficulty}`);
    console.log(`  evaluations: ${task.evaluation.length}`);
    console.log(`  schema: PASS`);
  } catch (error) {
    console.error(`  schema: FAIL`);
    console.error(`  ${(error as Error).message}`);
    return false;
  }

  // Check scaffold exists
  try {
    await access(scaffoldPath);
    console.log(`  scaffold/: PASS`);
  } catch {
    console.error(`  scaffold/: FAIL (directory not found)`);
    return false;
  }

  console.log(`\nValidation passed.`);
  return true;
}
