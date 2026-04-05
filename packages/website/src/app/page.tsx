"use client";

import data from "@/data/sample-results.json";
import { useModel } from "./components/ModelProvider";
import Verdict from "./components/Verdict";
import KeyNumbers from "./components/KeyNumbers";
import ModeExplainer from "./components/ModeExplainer";
import ProjectShowcase from "./components/ProjectShowcase";
import TaskTable from "./components/TaskTable";

const datasets = data.datasets as Record<string, {
  label: string;
  model: string;
  overall: Record<string, any>;
  tasks: any[];
}>;

export default function Dashboard() {
  const { selectedModel } = useModel();
  const dataset = datasets[selectedModel];

  return (
    <div className="pt-20">
      {/* Verdict — the big claim */}
      <section className="pt-0 mx-auto max-w-5xl px-6">
        <Verdict overall={dataset.overall} totalTasks={data.meta.totalTasks} model={dataset.model} />
      </section>

      {/* Key numbers with inline bars — full width */}
      <section className="mt-20 px-6 sm:px-10 lg:px-16">
        <KeyNumbers overall={dataset.overall} />
      </section>

      {/* Full Results */}
      <section className="mt-32 mx-auto max-w-6xl px-6">
        <TaskTable tasks={dataset.tasks} model={dataset.model} />
      </section>

      {/* How each mode works */}
      <section className="mt-32 mx-auto max-w-5xl px-6">
        <ModeExplainer />
      </section>
    </div>
  );
}
