import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "planmode-bench",
  description: "Does Plan Mode beat direct execution in Claude Code?",
};

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
        mono.variable
      )}
    >
      <body className="min-h-screen bg-background text-foreground">
        {/* Gradient accent line */}
        <div className="fixed top-0 left-0 right-0 h-px z-50 bg-gradient-to-r from-mode-n via-mode-g to-mode-pc opacity-50" />

        <nav className="relative px-6 pt-8">
          <div className="mx-auto flex max-w-5xl items-center justify-between">
            <a
              href="/"
              className="font-mono text-sm font-medium tracking-tight text-muted-foreground hover:text-foreground"
            >
              plan mode bench
            </a>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a
                href="https://github.com/runpod-labs/planmode-bench"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                github
              </a>
            </div>
          </div>
        </nav>

        <main className="pb-24">{children}</main>

        <footer className="px-6 pb-12 text-center">
          <a
            href="https://github.com/runpod-labs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-muted-foreground/80 hover:text-muted-foreground"
          >
            Runpod Labs
          </a>
        </footer>
      </body>
    </html>
  );
}
