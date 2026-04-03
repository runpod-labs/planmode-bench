import results from "@/data/sample-results.json";
import StatsCards from "./components/StatsCards";
import ScoreBarChart from "./components/ScoreBarChart";
import CategoryChart from "./components/CategoryChart";
import ResultsTable from "./components/ResultsTable";

export default function Dashboard() {
  const { tasks, meta } = results;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-3 pt-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          planmode-bench
        </h1>
        <p className="max-w-2xl text-lg text-text-secondary">
          Does Plan Mode + Context Clearing beat direct execution?
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-text-muted">
          <span className="rounded-full bg-surface-overlay px-3 py-1">
            Model: {meta.claudeModel}
          </span>
          <span className="rounded-full bg-surface-overlay px-3 py-1">
            Tasks: {meta.totalTasks}
          </span>
          <span className="rounded-full bg-surface-overlay px-3 py-1">
            Run: {meta.runId}
          </span>
        </div>
      </section>

      {/* Stats */}
      <section>
        <StatsCards tasks={tasks} />
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ScoreBarChart tasks={tasks} />
        <CategoryChart tasks={tasks} />
      </section>

      {/* Table */}
      <section>
        <ResultsTable tasks={tasks} />
      </section>
    </div>
  );
}
