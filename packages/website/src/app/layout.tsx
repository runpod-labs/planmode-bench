import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "planmode-bench",
  description:
    "Benchmark: Does Plan Mode + Context Clearing beat direct execution in Claude Code?",
};

function Nav() {
  return (
    <nav className="border-b border-border px-6 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight">
          planmode-bench
        </a>
        <div className="flex gap-6 text-sm text-text-secondary">
          <a href="/" className="hover:text-text-primary transition-colors">
            Dashboard
          </a>
          <a
            href="/methodology"
            className="hover:text-text-primary transition-colors"
          >
            Methodology
          </a>
          <a
            href="https://github.com/runpod-labs/planmode-bench"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-primary transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
        <footer className="border-t border-border px-6 py-8 text-center text-sm text-text-muted">
          planmode-bench &mdash; built by{" "}
          <a
            href="https://github.com/runpod-labs"
            className="text-text-secondary hover:text-text-primary transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            RunPod Labs
          </a>
        </footer>
      </body>
    </html>
  );
}
