"use client";

interface ModeResult {
  score: number;
  maxScore: number;
  pass: boolean;
  duration: number;
  cost: number;
}

interface TaskResult {
  id: string;
  name: string;
  category: string;
  results: {
    normal: ModeResult;
    "plan-resume": ModeResult;
    "plan-clear": ModeResult;
  };
}

const MODE_LABELS: Record<string, string> = {
  normal: "Normal",
  "plan-resume": "Plan + Resume",
  "plan-clear": "Plan + Clear",
};

const MODE_COLORS: Record<string, string> = {
  normal: "text-normal",
  "plan-resume": "text-plan-resume",
  "plan-clear": "text-plan-clear",
};

const MODE_BG: Record<string, string> = {
  normal: "bg-normal/10",
  "plan-resume": "bg-plan-resume/10",
  "plan-clear": "bg-plan-clear/10",
};

function getWinner(results: TaskResult["results"]): "normal" | "plan-resume" | "plan-clear" {
  const modes = ["normal", "plan-resume", "plan-clear"] as const;
  let best: typeof modes[number] = modes[0];
  for (const m of modes) {
    if (results[m].score > results[best].score) best = m;
  }
  return best;
}

export default function ResultsTable({ tasks }: { tasks: TaskResult[] }) {
  const modes = ["normal", "plan-resume", "plan-clear"] as const;

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-6">
      <h2 className="mb-4 text-lg font-semibold">Per-Task Results</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-text-secondary">
              <th className="pb-3 pr-4 font-medium">Task</th>
              <th className="pb-3 pr-4 font-medium">Category</th>
              {modes.map((m) => (
                <th key={m} className="pb-3 pr-4 font-medium text-center">
                  {MODE_LABELS[m]}
                </th>
              ))}
              <th className="pb-3 font-medium text-center">Winner</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const winner = getWinner(task.results);
              return (
                <tr
                  key={task.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="py-3 pr-4 font-medium">{task.name}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-surface-overlay px-2.5 py-0.5 text-xs text-text-secondary">
                      {task.category}
                    </span>
                  </td>
                  {modes.map((m) => {
                    const isWinner = m === winner;
                    return (
                      <td key={m} className="py-3 pr-4 text-center">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 font-mono text-sm font-semibold ${
                            isWinner
                              ? `${MODE_BG[m]} ${MODE_COLORS[m]}`
                              : "text-text-secondary"
                          }`}
                        >
                          {task.results[m].score}
                        </span>
                      </td>
                    );
                  })}
                  <td className="py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${MODE_BG[winner]} ${MODE_COLORS[winner]}`}
                    >
                      {MODE_LABELS[winner]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
