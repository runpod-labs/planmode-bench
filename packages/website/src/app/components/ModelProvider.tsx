"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ModelContextValue {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

const ModelContext = createContext<ModelContextValue>({
  selectedModel: "combined",
  setSelectedModel: () => {},
});

export function useModel() {
  return useContext(ModelContext);
}

export function ModelProvider({
  defaultModel,
  children,
}: {
  defaultModel: string;
  children: ReactNode;
}) {
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel }}>
      {children}
    </ModelContext.Provider>
  );
}
