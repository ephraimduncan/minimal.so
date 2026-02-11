import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Changelog - Minimal",
  description: "Changelog for Minimal bookmark manager",
};

type ChangelogEntry = {
  text: string;
  pr?: number;
};

type ChangelogVersion = {
  version: string;
  date: string;
  added: ChangelogEntry[];
  changed: ChangelogEntry[];
  fixed: ChangelogEntry[];
};

const GITHUB_REPO = "https://github.com/ephraimduncan/minimal.so";

const changelog: ChangelogVersion[] = [
  {
    version: "0.1.0",
    date: "February 11, 2026",
    added: [
      { text: "RSS/Atom feeds for public profiles", pr: 49 },
      { text: "Avatar uploads", pr: 51 },
      { text: "Transactional emails via Autosend", pr: 50 },
      { text: "ArXiv metadata improvements", pr: 54 },
      { text: "Private visibility confirmation for bookmarks" },
      { text: "Slugified group URL params", pr: 52 },
    ],
    changed: [
      { text: "Simplified email call sites and settings dialog" },
    ],
    fixed: [
      { text: "Twitter profile pictures showing generic X favicon instead of actual avatars", pr: 50 },
      { text: "Consistent paragraph spacing in email templates", pr: 50 },
      { text: "Dashboard UI spacing, empty state, and dialog close buttons", pr: 50 },
      { text: "Sign-out dialog closing before async work completes", pr: 50 },
      { text: "Broken favicons, missing referrer, and public profile auto-enable" },
    ],
  },
  {
    version: "0.0.1",
    date: "January 27, 2026",
    added: [
      { text: "Multi-select functionality with keyboard and mouse support for bulk operations", pr: 41 },
      { text: "Bulk move and delete dialogs with server-side endpoints" },
      { text: "Multi-select toolbar with Select All, Move, Copy URLs, and Delete actions" },
      { text: "Context menu integration - actions on selected items apply to all selected bookmarks" },
      { text: "Keyboard shortcuts for multi-select (Cmd+A for select all, Space for toggle)" },
      { text: "Settings dialog with profile management and name editing", pr: 35 },
      { text: "Claude Code GitHub workflows for automated PR assistance and code review", pr: 40 },
      { text: "Split dashboard into separate route with cached landing page for better performance", pr: 36 },
      { text: "Changelog page to track product updates", pr: 34 },
    ],
    changed: [
      { text: "Migrated all dialogs to Base UI API for better compatibility and performance" },
      { text: "Increased bulk move dialog dropdown width to 16rem for better readability" },
      { text: "Replaced width animations with GPU-accelerated transform: scaleX() for smoother performance" },
      { text: "Improved mobile browser support with proper dynamic viewport height (min-h-dvh)" },
      { text: "Enhanced toolbar design to match context menu aesthetics" },
      { text: "Added prefers-reduced-motion support for accessibility" },
      { text: "Optimized animations by removing expensive blur filters" },
      { text: "Improved dropdown spacing and visual balance" },
    ],
    fixed: [
      { text: "Dropdown selection reset issue in bulk move dialog - selections now persist correctly" },
      { text: "Hydration errors from nested button elements in dialogs and dropdowns" },
      { text: "Invalid HTML structure where buttons were nested inside other buttons" },
      { text: "Tab visibility state issues where favicons would show as fallback icons after returning to tab" },
      { text: "Keyboard selection state misalignment when bookmarks data changed" },
      { text: "Favicon loading failures during tab-hidden periods" },
    ],
  },
  {
    version: "0.0.0",
    date: "January 20, 2026",
    added: [
      { text: "Initial release of Minimal bookmark manager" },
      { text: "User authentication with email and OAuth providers", pr: 1 },
      { text: "Bookmark creation, editing, and deletion" },
      { text: "Folder organization for bookmarks" },
      { text: "Browser extension for quick bookmark saving" },
    ],
    changed: [],
    fixed: [],
  },
];

type Category = "Added" | "Changed" | "Fixed";

function toISODate(dateStr: string): string {
  return new Date(dateStr).toISOString().split("T")[0];
}

function PrLink({ number }: { number: number }) {
  return (
    <a
      href={`${GITHUB_REPO}/pull/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground hover:underline cursor-pointer text-xs font-mono"
    >
      (#{number})
    </a>
  );
}

function ChangelogSection({
  category,
  entries,
}: {
  category: Category;
  entries: ChangelogEntry[];
}) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">
        {category}
      </h3>
      <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
        {entries.map((entry, index) => (
          <li key={index}>
            {entry.text}
            {entry.pr && (
              <>
                {" "}
                <PrLink number={entry.pr} />
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <div className="grid sm:grid-cols-[140px_1fr] sm:gap-6 md:grid-cols-[180px_1fr]">
        <div className="hidden sm:block" />
        <div className="mb-5">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconChevronLeft className="size-4" />
            Back to home
          </Link>
          <h1 className="text-3xl font-semibold text-foreground">Changelog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            All notable changes to Minimal will be documented here.
          </p>
        </div>

        {changelog.map((version) => (
          <Fragment key={version.version}>
            <div className="mb-1 sm:mb-0 sm:pt-0.5 sm:text-right">
              <time
                dateTime={toISODate(version.date)}
                className="text-sm text-muted-foreground"
              >
                {version.date}
              </time>
            </div>
            <section id={`v${version.version}`} className="mb-8 space-y-4">
              <h2 className="text-lg font-medium text-foreground">
                <a
                  href={`#v${version.version}`}
                  className="hover:underline"
                >
                  v{version.version}
                </a>
              </h2>
              <ChangelogSection category="Added" entries={version.added} />
              <ChangelogSection category="Changed" entries={version.changed} />
              <ChangelogSection category="Fixed" entries={version.fixed} />
            </section>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
