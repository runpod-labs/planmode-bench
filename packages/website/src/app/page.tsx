"use client";

import { useState } from "react";
import data from "@/data/sample-results.json";
import KeyNumbers from "./components/KeyNumbers";
import ModeCharts from "./components/ModeCharts";
import ModeExplainer from "./components/ModeExplainer";
import ProjectShowcase from "./components/ProjectShowcase";
import TaskTable from "./components/TaskTable";

const DIFFICULTIES = ["all", "easy", "medium", "hard"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

export default function Dashboard() {
  const { tasks, meta, overall } = data;
  const [difficulty, setDifficulty] = useState<Difficulty>("all");

  const filteredTasks =
    difficulty === "all"
      ? tasks
      : tasks.filter((t) => t.difficulty === difficulty);

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 animate-fade-up">
        <h1 className="font-heading text-6xl leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
          plan mode bench
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Does planning before coding actually help? We test{" "}
          <span className="text-foreground">4 execution modes</span> across{" "}
          <span className="text-foreground">{meta.totalTasks} real-world tasks</span>{" "}
          in Claude Code to find out.
        </p>
        <p className="mt-3 font-mono text-xs text-muted-foreground/40">
          {meta.claudeModel}
        </p>
      </section>

      {/* Difficulty filter */}
      <section className="mt-12 mx-auto max-w-5xl px-6 animate-fade-up stagger-1">
        <div className="flex items-center gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                difficulty === d
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d === "all"
                ? `All tasks (${tasks.length})`
                : `${d.charAt(0).toUpperCase() + d.slice(1)} (${tasks.filter((t) => t.difficulty === d).length})`}
            </button>
          ))}
        </div>
      </section>

      {/* Key overhead numbers */}
      <section className="mt-10 mx-auto max-w-5xl px-6 animate-fade-up stagger-2">
        <KeyNumbers overall={overall} />
      </section>

      {/* Aggregate charts */}
      <section className="mt-20 mx-auto max-w-5xl px-6">
        <ModeCharts overall={overall} />
      </section>

      {/* Projects used */}
      <section className="mt-24 mx-auto max-w-5xl px-6">
        <ProjectShowcase tasks={filteredTasks} />
      </section>

      {/* Full Results — FULL WIDTH */}
      <section className="mt-24 px-6">
        <TaskTable tasks={filteredTasks} />
      </section>

      {/* How each mode works */}
      <section className="mt-24 mx-auto max-w-5xl px-6">
        <ModeExplainer />
      </section>

      {/* Footer meta */}
      <div className="mt-24 mx-auto max-w-5xl px-6 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-6 font-mono text-xs text-muted-foreground/40">
        <span>model {meta.claudeModel}</span>
        <span>
          {meta.totalTasks} task{meta.totalTasks !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
