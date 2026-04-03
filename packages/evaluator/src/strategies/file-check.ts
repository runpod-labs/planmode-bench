import { readFile, access } from "node:fs/promises";
import path from "node:path";
import type { StrategyResultType } from "@planmode-bench/schema";

interface FileCheck {
  path: string;
  must_exist?: boolean;
  must_contain?: string[];
  must_not_contain?: string[];
}

export async function evaluateFileCheck(
  workDir: string,
  checks: FileCheck[],
  weight: number
): Promise<StrategyResultType> {
  let checksPassed = 0;
  let checksTotal = 0;
  const checkDetails: Record<string, unknown>[] = [];

  for (const check of checks) {
    const filePath = path.join(workDir, check.path);

    if (check.must_exist !== false) {
      checksTotal++;
      try {
        await access(filePath);
        checksPassed++;
        checkDetails.push({ path: check.path, check: "exists", passed: true });
      } catch {
        checkDetails.push({ path: check.path, check: "exists", passed: false });
        continue;
      }
    }

    let content: string;
    try {
      content = await readFile(filePath, "utf-8");
    } catch {
      continue;
    }

    if (check.must_contain) {
      for (const pattern of check.must_contain) {
        checksTotal++;
        if (content.includes(pattern)) {
          checksPassed++;
          checkDetails.push({ path: check.path, check: `contains "${pattern}"`, passed: true });
        } else {
          checkDetails.push({ path: check.path, check: `contains "${pattern}"`, passed: false });
        }
      }
    }

    if (check.must_not_contain) {
      for (const pattern of check.must_not_contain) {
        checksTotal++;
        if (!content.includes(pattern)) {
          checksPassed++;
          checkDetails.push({ path: check.path, check: `not contains "${pattern}"`, passed: true });
        } else {
          checkDetails.push({ path: check.path, check: `not contains "${pattern}"`, passed: false });
        }
      }
    }
  }

  const score = checksTotal > 0 ? checksPassed / checksTotal : 0;

  return {
    type: "file-check",
    score,
    weight,
    weighted_score: score * weight,
    passed: checksPassed === checksTotal,
    details: {
      checks_passed: checksPassed,
      checks_total: checksTotal,
      check_details: checkDetails,
    },
  };
}
