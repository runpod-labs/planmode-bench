import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";
import data from "@/data/sample-results.json";
import { ModelProvider } from "./components/ModelProvider";
import ModelSelector from "./components/ModelSelector";

const heading = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "planmode bench",
  description: "Does Plan Mode beat direct execution in Claude Code?",
};

const meta = data.meta as { models: string[]; defaultModel: string };
const datasets = data.datasets as Record<string, { label: string }>;
const modelOptions = meta.models.map((key) => ({
  key,
  label: datasets[key].label,
}));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn(
        "dark antialiased",
        sans.variable,
        heading.variable,
        mono.variable,
        display.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground">
        <ModelProvider defaultModel={meta.defaultModel}>
          <nav className="sticky top-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
              <a
                href="/"
                className="font-mono text-sm font-medium tracking-tight text-muted-foreground hover:text-foreground"
              >
                <span className="text-base font-extrabold text-foreground">planmode</span> bench
              </a>
              <ModelSelector models={modelOptions} />
            </div>
          </nav>

          <main className="pb-24">{children}</main>

          <footer className="px-6 pb-16 flex flex-col items-center gap-2">
            <a
              href="https://github.com/runpod-labs/planmode-bench"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              an experiment from
            </a>
            <a
              href="https://labs.runpod.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${process.env.NODE_ENV === "production" ? "/planmode-bench" : ""}/runpod-wordmark-text.webp`}
                alt="Runpod"
                width={90}
                height={20}
                className="opacity-70 group-hover:opacity-100 transition-opacity"
              />
              <span
                className="italic text-base text-[#a78bfa] opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Labs
              </span>
            </a>
          </footer>
        </ModelProvider>
      </body>
    </html>
  );
}
