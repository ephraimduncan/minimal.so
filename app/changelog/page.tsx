import type { Metadata } from "next";
import Link from "next/link";

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

function PrLink({ number }: { number: number }) {
  return (
    <a
      href={`${GITHUB_REPO}/pull/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
    >
      (#{number})
    </a>
  );
}

function ChangelogSection({
  title,
  entries,
}: {
  title: string;
  entries: ChangelogEntry[];
}) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="mb-2 text-lg font-medium text-zinc-800 dark:text-zinc-200">
        {title}
      </h3>
      <ul className="list-disc space-y-2 pl-6 text-zinc-600 dark:text-zinc-400">
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
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to home
      </Link>

      <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
        Changelog
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        All notable changes to Minimal will be documented here.
      </p>

      <div className="prose prose-zinc max-w-none dark:prose-invert">
        {changelog.map((version) => (
          <section key={version.version} className="mb-12">
            <div className="mb-4 flex items-baseline gap-3">
              <h2 className="text-xl font-medium text-zinc-900 dark:text-zinc-100">
                v{version.version}
              </h2>
              <span className="text-sm text-zinc-500">{version.date}</span>
            </div>

            <ChangelogSection title="Added" entries={version.added} />
            <ChangelogSection title="Changed" entries={version.changed} />
            <ChangelogSection title="Fixed" entries={version.fixed} />
          </section>
        ))}
      </div>
    </div>
  );
}

