import data from "@/data/sample-results.json";
import Verdict from "./components/Verdict";
import KeyNumbers from "./components/KeyNumbers";
import ModeExplainer from "./components/ModeExplainer";
import ProjectShowcase from "./components/ProjectShowcase";
import TaskTable from "./components/TaskTable";

export default function Dashboard() {
  const { tasks, meta, overall } = data;

  return (
    <div className="pt-20">
      {/* Verdict — the big claim, full width */}
      <section className="pt-0 px-6 sm:px-10 lg:px-16">
        <Verdict overall={overall} totalTasks={meta.totalTasks} model={meta.claudeModel} />
      </section>

      {/* Key numbers with inline bars */}
      <section className="mt-20 mx-auto max-w-5xl px-6">
        <KeyNumbers overall={overall} />
      </section>

      {/* Projects used */}
      <section className="mt-24 mx-auto max-w-5xl px-6">
        <ProjectShowcase tasks={tasks} />
      </section>

      {/* Full Results — FULL WIDTH */}
      <section className="mt-24 px-6">
        <TaskTable tasks={tasks} />
      </section>

      {/* How each mode works */}
      <section className="mt-24 mx-auto max-w-5xl px-6">
        <ModeExplainer />
      </section>

      {/* Footer meta */}
      <div className="mt-24 mx-auto max-w-5xl px-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-6 font-mono text-xs text-muted-foreground/70">
        <span>model {meta.claudeModel}</span>
        <span>
          {meta.totalTasks} task{meta.totalTasks !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
