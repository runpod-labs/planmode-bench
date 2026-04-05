"use client";

import { useModel } from "./ModelProvider";

interface ModelOption {
  key: string;
  label: string;
}

export default function ModelSelector({ models }: { models: ModelOption[] }) {
  const { selectedModel, setSelectedModel } = useModel();

  return (
    <div className="flex items-center gap-1 rounded-md border border-border bg-card/40 p-0.5">
      {models.map((m) => {
        const active = selectedModel === m.key;
        return (
          <button
            key={m.key}
            onClick={() => setSelectedModel(m.key)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono lowercase transition-colors ${
              active
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
