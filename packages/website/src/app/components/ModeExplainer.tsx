import { Zap, Compass, BookOpen, Scissors } from "lucide-react";

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

      <div className="grid gap-px bg-border sm:grid-cols-3 rounded-lg overflow-hidden border border-border">
        <ModeCard
          icon={<Zap className="h-3.5 w-3.5" />}
          bg="bg-mode-n/15"
          text="text-mode-n"
          name="one-shot"
          desc="just the task prompt. Claude reads, edits, and tests in a single session with no planning guidance."
          prompt="Here is the task: [task description]. Implement it."
          flow={["Prompt", "Execute", "Done"]}
        />
        <ModeCard
          icon={<BookOpen className="h-3.5 w-3.5" />}
          bg="bg-mode-pr/15"
          text="text-mode-pr"
          name="plan + resume"
          desc="two phases in the same session. Claude first plans using read-only tools (can only read files), then resumes with full permissions to execute. context is preserved."
          prompt="Phase 1 (plan mode): Create a detailed plan. Phase 2 (resume): Execute the plan."
          flow={["Prompt", "Plan (read-only)", "Resume", "Execute", "Done"]}
        />
        <ModeCard
          icon={<Scissors className="h-3.5 w-3.5" />}
          bg="bg-mode-pc/15"
          text="text-mode-pc"
          name="plan + clear"
          desc="plan is saved to PLAN.md, then a brand new session reads it and executes. context is completely cleared between planning and execution."
          prompt="Phase 1: Create a plan → saved to PLAN.md. Phase 2 (new session): Read PLAN.md and execute."
          flow={[
            "Prompt",
            "Plan (read-only)",
            "Save PLAN.md",
            "Clear context",
            "New session",
            "Execute",
            "Done",
          ]}
        />
      </div>
    </div>
  );
}

function ModeCard({
  icon,
  bg,
  text,
  name,
  desc,
  prompt,
  flow,
}: {
  icon: React.ReactNode;
  bg: string;
  text: string;
  name: string;
  desc: string;
  prompt: string;
  flow: string[];
}) {
  return (
    <div className="bg-background p-6 flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex items-center justify-center h-6 w-6 rounded-md ${bg} ${text} shrink-0`}>
          {icon}
        </span>
        <span className="text-base font-medium text-foreground">{name}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {desc}
      </p>
      <div className="rounded-md bg-card/50 border border-border/50 px-3 py-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70 mb-1">
          prompt strategy
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed italic">
          &ldquo;{prompt}&rdquo;
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono text-muted-foreground/80">
        {flow.map((step, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/80">&rarr;</span>}
            <span>{step}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
