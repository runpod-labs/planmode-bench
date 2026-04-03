export default function Methodology() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <section className="space-y-3 pt-4">
        <h1 className="text-4xl font-bold tracking-tight">Methodology</h1>
        <p className="max-w-2xl text-lg text-text-secondary">
          How we benchmark Claude Code&apos;s Plan Mode against direct
          execution.
        </p>
      </section>

      {/* Mode Diagram */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">The 3 Modes</h2>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Normal */}
          <div className="rounded-xl border border-normal/30 bg-normal/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-normal" />
              <h3 className="font-semibold text-normal">Normal</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Single session. Claude receives the task and executes everything in
              one go without any planning phase.
            </p>
            {/* Visual flow */}
            <div className="space-y-2">
              <FlowStep color="normal" label="Task prompt" />
              <FlowArrow />
              <FlowStep color="normal" label="Claude executes" />
              <FlowArrow />
              <FlowStep color="normal" label="Output" />
            </div>
          </div>

          {/* Plan + Resume */}
          <div className="rounded-xl border border-plan-resume/30 bg-plan-resume/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-plan-resume" />
              <h3 className="font-semibold text-plan-resume">Plan + Resume</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Two-phase in same session. Claude first creates a plan (read-only
              tools), then resumes the same session to execute.
            </p>
            <div className="space-y-2">
              <FlowStep color="plan-resume" label="Task prompt" />
              <FlowArrow />
              <FlowStep color="plan-resume" label="Plan (read-only)" />
              <FlowArrow />
              <FlowStep color="plan-resume" label="Resume + Execute" />
              <FlowArrow />
              <FlowStep color="plan-resume" label="Output" />
            </div>
          </div>

          {/* Plan + Clear */}
          <div className="rounded-xl border border-plan-clear/30 bg-plan-clear/5 p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-plan-clear" />
              <h3 className="font-semibold text-plan-clear">Plan + Clear</h3>
            </div>
            <p className="mb-6 text-sm text-text-secondary">
              Plan in one session, save plan to file, then start a fresh session
              (context cleared) that reads the plan and executes.
            </p>
            <div className="space-y-2">
              <FlowStep color="plan-clear" label="Task prompt" />
              <FlowArrow />
              <FlowStep color="plan-clear" label="Plan (read-only)" />
              <FlowArrow />
              <FlowStep color="plan-clear" label="Save plan to file" highlighted />
              <FlowArrow />
              <FlowStep color="plan-clear" label="New session" highlighted />
              <FlowArrow />
              <FlowStep color="plan-clear" label="Execute from plan" />
              <FlowArrow />
              <FlowStep color="plan-clear" label="Output" />
            </div>
          </div>
        </div>
      </section>

      {/* How Tasks Work */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How Tasks Are Defined</h2>
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-sm leading-relaxed text-text-secondary">
          <p>
            Each task is a YAML file in the <Code>tasks/</Code> directory that
            specifies:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-text-primary">Task ID and metadata</strong>{" "}
              &mdash; unique name, category, difficulty
            </li>
            <li>
              <strong className="text-text-primary">Prompt</strong> &mdash; the
              exact instruction given to Claude Code
            </li>
            <li>
              <strong className="text-text-primary">Expected outputs</strong>{" "}
              &mdash; files, structure, and behaviors to check
            </li>
            <li>
              <strong className="text-text-primary">Evaluation criteria</strong>{" "}
              &mdash; correctness, completeness, code quality, edge cases
            </li>
          </ul>
          <p className="mt-4">
            Tasks are designed to be realistic coding challenges that exercise
            different aspects of software engineering: API design, frontend
            building, CLI tooling, refactoring, etc.
          </p>
        </div>
      </section>

      {/* Evaluation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How Evaluation Works</h2>
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-sm leading-relaxed text-text-secondary">
          <p>Each task output is scored on four dimensions (each 0&ndash;100):</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ScoreDimension
              title="Correctness"
              desc="Does the code work? Do tests pass? Is the logic right?"
            />
            <ScoreDimension
              title="Completeness"
              desc="Are all requirements met? Nothing missing from the spec?"
            />
            <ScoreDimension
              title="Code Quality"
              desc="Clean code, proper types, good structure, no anti-patterns?"
            />
            <ScoreDimension
              title="Edge Cases"
              desc="Error handling, input validation, boundary conditions?"
            />
          </div>
          <p className="mt-4">
            The final score is the average of all four dimensions. Evaluation is
            automated using a separate evaluator that checks file structure, runs
            tests, and analyzes code quality.
          </p>
        </div>
      </section>

      {/* Contributing */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How to Contribute</h2>
        <div className="rounded-xl border border-border bg-surface-raised p-6 text-sm leading-relaxed text-text-secondary">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <strong className="text-text-primary">Add a new task</strong>{" "}
              &mdash; Create a YAML file in <Code>tasks/</Code> following the
              schema
            </li>
            <li>
              <strong className="text-text-primary">
                Run the benchmark locally
              </strong>{" "}
              &mdash; Use <Code>pnpm cli run</Code> to test against all 3 modes
            </li>
            <li>
              <strong className="text-text-primary">
                Submit results
              </strong>{" "}
              &mdash; Open a PR with your task and results JSON
            </li>
            <li>
              <strong className="text-text-primary">
                Improve evaluation
              </strong>{" "}
              &mdash; Help refine scoring criteria or add new dimensions
            </li>
          </ol>
          <p className="mt-4">
            See the{" "}
            <a
              href="https://github.com/runpod-labs/planmode-bench"
              className="text-plan-clear hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub repository
            </a>{" "}
            for full contributing guidelines.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ---- Helper components ---- */

function FlowStep({
  color,
  label,
  highlighted,
}: {
  color: string;
  label: string;
  highlighted?: boolean;
}) {
  const borderMap: Record<string, string> = {
    normal: "border-normal/40",
    "plan-resume": "border-plan-resume/40",
    "plan-clear": "border-plan-clear/40",
  };
  const bgMap: Record<string, string> = {
    normal: "bg-normal/10",
    "plan-resume": "bg-plan-resume/10",
    "plan-clear": "bg-plan-clear/10",
  };
  const highlightBg: Record<string, string> = {
    normal: "bg-normal/20",
    "plan-resume": "bg-plan-resume/20",
    "plan-clear": "bg-plan-clear/20",
  };

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center text-xs font-medium ${
        borderMap[color]
      } ${highlighted ? highlightBg[color] : bgMap[color]}`}
    >
      {label}
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex justify-center text-text-muted">
      <svg
        width="12"
        height="16"
        viewBox="0 0 12 16"
        fill="none"
        className="text-text-muted"
      >
        <path
          d="M6 0 L6 12 M2 8 L6 14 L10 8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-surface-overlay px-1.5 py-0.5 text-xs text-text-primary">
      {children}
    </code>
  );
}

function ScoreDimension({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-surface-overlay/50 p-3">
      <div className="font-medium text-text-primary">{title}</div>
      <div className="mt-1 text-xs text-text-muted">{desc}</div>
    </div>
  );
}
