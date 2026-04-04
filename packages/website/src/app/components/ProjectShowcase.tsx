"use client";

interface TaskResult {
  id: string;
  name: string;
  category: string;
  project: string;
  difficulty: string;
  repoUrl?: string;
  repoOrg?: string;
  repoRef?: string;
  results: Record<string, { score: number; totalCost: number }>;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "easy",
  medium: "medium",
  hard: "hard",
  expert: "hard",
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-muted-foreground",
  medium: "text-muted-foreground",
  hard: "text-muted-foreground",
};

export default function ProjectShowcase({
  tasks,
}: {
  tasks: TaskResult[];
}) {
  // Separate into real-world and self-contained
  const realWorld = tasks.filter((t) => t.repoUrl);
  const selfContained = tasks.filter((t) => !t.repoUrl);

  return (
    <div>
      <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground/80 mb-2">
        benchmark tasks
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        {tasks.length} tasks across real-world codebases and self-contained
        challenges
      </p>

      {/* Real-world projects */}
      {realWorld.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xs font-medium text-muted-foreground mb-4">
            real-world codebases
          </h3>
          <div className="grid gap-px bg-border rounded-lg overflow-hidden border border-border sm:grid-cols-2 lg:grid-cols-3">
            {realWorld.map((task) => (
              <div
                key={task.id}
                className="bg-background p-4 flex items-start gap-3"
              >
                {/* GitHub avatar */}
                <img
                  src={`https://github.com/${task.repoOrg}.png?size=40`}
                  alt={task.repoOrg || ""}
                  className="h-8 w-8 rounded-md bg-card shrink-0 mt-0.5"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={task.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:underline underline-offset-2 truncate"
                    >
                      {task.repoOrg}/{task.project}
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {task.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span
                      className={`text-[10px] font-mono font-medium ${DIFFICULTY_COLOR[task.difficulty] || "text-muted-foreground"}`}
                    >
                      {DIFFICULTY_LABEL[task.difficulty] || task.difficulty}
                    </span>
                    {task.repoRef && (
                      <span className="text-[10px] font-mono text-muted-foreground/70">
                        @{task.repoRef}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Self-contained */}
      {selfContained.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-4">
            self-contained challenges
          </h3>
          <div className="grid gap-px bg-border rounded-lg overflow-hidden border border-border sm:grid-cols-2 lg:grid-cols-3">
            {selfContained.map((task) => (
              <div key={task.id} className="bg-background p-4">
                <div className="text-sm font-medium text-foreground truncate">
                  {task.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {task.category}
                  </span>
                  <span className="text-muted-foreground/80">&middot;</span>
                  <span
                    className={`text-[10px] font-mono font-medium ${DIFFICULTY_COLOR[task.difficulty] || "text-muted-foreground"}`}
                  >
                    {DIFFICULTY_LABEL[task.difficulty] || task.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
