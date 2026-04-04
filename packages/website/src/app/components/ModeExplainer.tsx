import { Zap, BookOpen, Scissors } from "lucide-react";

const MODES = [
  {
    Icon: Zap,
    bg: "bg-mode-n/15",
    text: "text-mode-n",
    name: "one-shot",
    desc: "just the task prompt. Claude reads, edits, and tests in a single session with no planning guidance.",
    flow: ["Prompt", "Execute", "Done"],
  },
  {
    Icon: BookOpen,
    bg: "bg-mode-pr/15",
    text: "text-mode-pr",
    name: "plan + resume",
    desc: "two phases in the same session. Claude first plans using read-only tools (can only read files), then resumes with full permissions to execute. context is preserved.",
    flow: ["Prompt", "Plan (read-only)", "Resume", "Execute", "Done"],
  },
  {
    Icon: Scissors,
    bg: "bg-mode-pc/15",
    text: "text-mode-pc",
    name: "plan + clear",
    desc: "plan is saved to PLAN.md, then a brand new session reads it and executes. context is completely cleared between planning and execution.",
    flow: [
      "Prompt",
      "Plan (read-only)",
      "Save PLAN.md",
      "Clear context",
      "New session",
      "Execute",
      "Done",
    ],
  },
];

export default function ModeExplainer() {
  return (
    <div>
      <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80 mb-2">
        how each mode works
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        each mode gets the same task. the difference is how we prompt Claude
        Code and whether it plans before executing.
      </p>

      <div className="grid sm:grid-cols-3 sm:[grid-template-rows:auto_1fr_auto] rounded-lg border border-border overflow-hidden">
        {MODES.map((m, idx) => {
          const Icon = m.Icon;
          return (
            <div
              key={m.name}
              className={`bg-background p-6 flex flex-col gap-4 sm:grid sm:grid-rows-subgrid sm:row-span-3 sm:gap-y-4 ${
                idx < MODES.length - 1
                  ? "border-b sm:border-b-0 sm:border-r border-border"
                  : ""
              }`}
            >
              {/* Row 1: Header */}
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex items-center justify-center h-6 w-6 rounded-md ${m.bg} ${m.text} shrink-0`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-base font-medium text-foreground">
                  {m.name}
                </span>
              </div>

              {/* Row 2: Description (1fr — aligns steps across cards) */}
              <p className="text-sm text-muted-foreground leading-relaxed">
                {m.desc}
              </p>

              {/* Row 3: Flow steps */}
              <div className="flex flex-col">
                {m.flow.map((step, i) => (
                  <div key={i} className="flex items-stretch gap-3">
                    {/* Connector column: dot + line */}
                    <div className="flex flex-col items-center w-5 shrink-0">
                      <div className="h-5 w-5 rounded-full bg-muted/30 border border-border/50 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-mono font-semibold text-muted-foreground">{i + 1}</span>
                      </div>
                      {i < m.flow.length - 1 && (
                        <div className="w-px flex-1 min-h-[16px] bg-border/60" />
                      )}
                    </div>
                    {/* Step label */}
                    <span className="text-xs font-mono text-foreground/80 pt-[3px] pb-4">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
