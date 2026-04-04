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
      <h2 className="text-lg font-mono uppercase tracking-widest text-foreground/70 mb-2 text-center mt-8">
        benchmark tasks
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center">
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
                  <div className="flex items-baseline gap-2">
                    <a
                      href={task.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-foreground hover:underline underline-offset-2 truncate"
                    >
                      {task.repoOrg}/{task.project}
                    </a>
                    {task.repoRef && (
                      <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">@{task.repoRef}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 min-h-[2lh]">
                    {task.name}
                  </p>
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
                <div className="mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {task.category}
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
