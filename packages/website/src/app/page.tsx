import results from "@/data/sample-results.json";
import StatsCards from "./components/StatsCards";
import ScoreBarChart from "./components/ScoreBarChart";
import CostBreakdownChart from "./components/CostBreakdownChart";
import ResultsTable from "./components/ResultsTable";
import PlanOverheadTable from "./components/PlanOverheadTable";

export default function Dashboard() {
  const { tasks, meta, overall } = results;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="space-y-4 pt-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          planmode-bench
        </h1>
        <div className="max-w-3xl space-y-2">
          <p className="text-lg text-text-secondary">
            Does Plan Mode beat direct execution in Claude Code?
          </p>
          <div className="rounded-lg border border-normal/30 bg-normal/5 px-4 py-3">
            <p className="text-base font-semibold text-normal">
              Finding: Normal mode wins &mdash; higher quality at lower cost
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Across 13 tasks, normal mode scored{" "}
              <span className="font-semibold text-normal">90.7%</span> at{" "}
              <span className="font-semibold text-normal">$0.50/task</span>,
              while plan modes scored lower (88.0%, 87.2%) at 2-3x the cost.
              Planning adds overhead without improving outcomes.
            </p>
          </div>
        </div>
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
          <span className="rounded-full bg-surface-overlay px-3 py-1">
            Modes: normal, plan+resume, plan+clear
          </span>
        </div>
      </section>

      {/* Stats */}
      <section>
        <StatsCards overall={overall} />
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ScoreBarChart tasks={tasks} />
        <CostBreakdownChart tasks={tasks} />
      </section>

      {/* Plan Overhead */}
      <section>
        <PlanOverheadTable tasks={tasks} />
      </section>

      {/* Full Results Table */}
      <section>
        <ResultsTable tasks={tasks} />
      </section>
    </div>
  );
}
