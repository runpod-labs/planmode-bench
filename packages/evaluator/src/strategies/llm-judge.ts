import { exec } from "node:child_process";
import { promisify } from "node:util";
import { query } from "@anthropic-ai/claude-agent-sdk";
import type { StrategyResultType } from "@planmode-bench/schema";

const execAsync = promisify(exec);

async function getGitDiff(workDir: string): Promise<string> {
  try {
    // First, stage everything so we capture all changes (committed + uncommitted)
    await execAsync("git add -A", { cwd: workDir, timeout: 10_000 });
    // Diff everything against the initial base commit
    const { stdout } = await execAsync(
      "git diff $(git rev-list --max-parents=0 HEAD) -- . ':!package-lock.json' ':!pnpm-lock.yaml' ':!*.lock' ':!.gitignore'",
      { cwd: workDir, timeout: 30_000, maxBuffer: 1024 * 1024 * 5 }
    );
    return stdout.slice(0, 50_000);
  } catch {
    return "(failed to get git diff)";
  }
}

async function getNewFiles(workDir: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      "git diff --name-only $(git rev-list --max-parents=0 HEAD) --diff-filter=A",
      { cwd: workDir, timeout: 10_000 }
    );
    return stdout.trim();
  } catch {
    return "";
  }
}

export async function evaluateLLMJudge(
  workDir: string,
  rubric: string,
  model: string,
  weight: number
): Promise<StrategyResultType> {
  try {
    const diff = await getGitDiff(workDir);
    const newFiles = await getNewFiles(workDir);

    const prompt = `You are a code review judge evaluating whether a coding agent successfully completed a task. You must ONLY respond with a JSON object, nothing else.

## Task Rubric
${rubric}

## New Files Created
${newFiles || "(none)"}

## Git Diff (changes made by the agent)
\`\`\`diff
${diff}
\`\`\`

## Instructions
Score the implementation from 0.0 to 1.0 based on the rubric. Be strict but fair:
- 1.0 = fully correct implementation, all requirements met
- 0.7-0.9 = mostly correct, minor issues or missing edge cases
- 0.4-0.6 = partially correct, some requirements met but significant gaps
- 0.1-0.3 = attempted but mostly wrong or incomplete
- 0.0 = not attempted or completely wrong

Respond with ONLY a JSON object in this exact format, no other text:
{"score": <number>, "reasoning": "<brief explanation>"}`;

    let resultText = "";
    for await (const message of query({
      prompt,
      options: {
        model,
        maxTurns: 1,
        permissionMode: "plan",
      },
    })) {
      if (message.type === "result" && message.subtype === "success") {
        resultText = message.result;
      }
    }

    // Extract JSON from response
    const jsonMatch = resultText.match(/\{[\s\S]*"score"[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        type: "llm-judge",
        score: 0,
        weight,
        weighted_score: 0,
        passed: false,
        details: { error: "Failed to parse judge response", raw_response: resultText.slice(0, 500) },
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const score = Math.max(0, Math.min(1, Number(parsed.score)));

    return {
      type: "llm-judge",
      score,
      weight,
      weighted_score: score * weight,
      passed: score >= 0.5,
      details: {
        model,
        reasoning: parsed.reasoning,
        diff_length: diff.length,
        new_files: newFiles,
      },
    };
  } catch (error) {
    return {
      type: "llm-judge",
      score: 0,
      weight,
      weighted_score: 0,
      passed: false,
      details: { error: (error as Error).message },
    };
  }
}
