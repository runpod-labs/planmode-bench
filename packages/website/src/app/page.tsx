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
      {/* Verdict — the big claim */}
      <section className="pt-0 mx-auto max-w-5xl px-6">
        <Verdict overall={overall} totalTasks={meta.totalTasks} model={meta.claudeModel} />
      </section>

      {/* Key numbers with inline bars — full width */}
      <section className="mt-20 px-6 sm:px-10 lg:px-16">
        <KeyNumbers overall={overall} />
      </section>

      {/* Full Results */}
      <section className="mt-32 mx-auto max-w-6xl px-6">
        <TaskTable tasks={tasks} model={meta.claudeModel} />
      </section>

      {/* How each mode works */}
      <section className="mt-32 mx-auto max-w-5xl px-6">
        <ModeExplainer />
      </section>

    </div>
  );
}
