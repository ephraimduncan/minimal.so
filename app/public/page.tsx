"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const CATEGORY_META = {
  article: {
    label: "Articles",
    dotClass: "bg-link-article",
  },
  book: {
    label: "Books",
    dotClass: "bg-link-book",
  },
  other: {
    label: "Other",
    dotClass: "bg-link-other",
  },
  video: {
    label: "Videos",
    dotClass: "bg-link-video",
  },
} as const;

type CategoryKey = keyof typeof CATEGORY_META;

type PublicLink = {
  id: string;
  href: string;
  title: string;
  category: CategoryKey;
  createdAt: string;
};

const PUBLIC_LINKS: PublicLink[] = [
  {
    id: "displacement-of-purpose",
    href: "https://peterboeckel.com/writing/displacementofpurpose",
    title: "The Displacement of Purpose",
    category: "article",
    createdAt: "2026-02-02",
  },
  {
    id: "orange-bruno-munari",
    href: "https://kateshash.com/blog/brunomunari",
    title: "Orange as a Product Design Object - Bruno Munari",
    category: "article",
    createdAt: "2026-01-25",
  },
  {
    id: "motern-method",
    href: "https://www.amazon.de/-/en/gp/product/B09PHJS3JW",
    title: "The Motern Method by Matt Farley",
    category: "book",
    createdAt: "2026-01-10",
  },
  {
    id: "planes",
    href: "https://www.youtube.com/watch?v=vjDYfvPW4mA",
    title: "What Everyone Gets Wrong About Planes",
    category: "video",
    createdAt: "2026-01-10",
  },
  {
    id: "one-million-screenshots",
    href: "https://onemillionscreenshots.com/",
    title: "One Million Screenshots",
    category: "other",
    createdAt: "2026-01-04",
  },
  {
    id: "muji-nothing",
    href: "https://www.youtube.com/watch?v=kfeytgohT6A",
    title: "Muji - The Brand That Designed \"Nothing\"",
    category: "video",
    createdAt: "2026-01-03",
  },
  {
    id: "shaheer-tarar",
    href: "https://www.shaheer.info/",
    title: "Shaheer Tarar",
    category: "other",
    createdAt: "2026-01-01",
  },
  {
    id: "tiny-cottage",
    href: "https://www.youtube.com/watch?t=3609s&v=bq6tKhx2D9U",
    title: "Tiny cottage in the woods - full DIY build",
    category: "video",
    createdAt: "2025-12-28",
  },
  {
    id: "opened-a-bookshop",
    href: "https://www.ft.com/content/cc77c2c9-3415-4b96-af76-65f04d761a85",
    title: "I opened a bookshop. It was the best, worst thing I've ever done",
    category: "article",
    createdAt: "2025-12-26",
  },
  {
    id: "agentic",
    href: "https://usefulfictions.substack.com/p/how-to-be-more-agentic",
    title: "How to be more agentic",
    category: "article",
    createdAt: "2025-12-24",
  },
  {
    id: "idea-muscle",
    href: "https://sfalexandria.com/posts/rileys-ideas/",
    title: "Training the Idea Muscle",
    category: "article",
    createdAt: "2025-12-23",
  },
  {
    id: "tv-remote",
    href: "https://www.youtube.com/watch?v=Pe_ozZkrRAw",
    title: "My TV Remote Stopped Working... So I Made My Own.",
    category: "video",
    createdAt: "2025-12-23",
  },
  {
    id: "hydrant-directory",
    href: "https://www.dayroselane.com/hydrants",
    title: "The Hydrant Directory",
    category: "article",
    createdAt: "2025-12-20",
  },
  {
    id: "apple-watch-china",
    href: "https://www.youtube.com/watch?v=DsWTz8NrXOY",
    title: "How I Made My Own Apple Watch - in China",
    category: "video",
    createdAt: "2025-12-19",
  },
];

function formatDate(date: string) {
  const d = new Date(date + "T00:00:00");
  const isCurrentYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(!isCurrentYear && { year: "numeric" }),
  });
}

const TABS = [
  { value: "all", label: "All" },
  ...(
    Object.entries(CATEGORY_META).map(([key, meta]) => ({
      value: key,
      label: meta.label,
      dotClass: meta.dotClass,
    })) as Array<{ value: CategoryKey; label: string; dotClass: string }>
  ),
];

export default function PublicPage() {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredLinks = useMemo(() => {
    if (activeTab === "all") {
      return PUBLIC_LINKS;
    }
    return PUBLIC_LINKS.filter((link) => link.category === activeTab);
  }, [activeTab]);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-20">
      <div className="mb-8 flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.value
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {"dotClass" in tab && (
              <span className={`h-2 w-2 rounded-full shrink-0 ${tab.dotClass}`} />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2 text-sm text-muted-foreground">
        <span>Title</span>
        <span>Created At</span>
      </div>

      <div className="flex flex-col gap-0.5 -mx-3">
        {filteredLinks.map((link) => {
          const meta = CATEGORY_META[link.category];
          const hostname = new URL(link.href).hostname.replace("www.", "");
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-muted/50 active:scale-[0.99] transition-transform duration-200"
            >
              <div className="flex flex-1 items-center gap-2 min-w-0 mr-4">
                <span
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta.dotClass}`}
                />
                <span className="text-sm truncate">{link.title}</span>
                <span className="text-[13px] text-muted-foreground shrink-0">
                  {hostname}
                </span>
              </div>
              <div className="flex items-center shrink-0">
                <span className="text-[13px] text-muted-foreground whitespace-nowrap transition-transform duration-200 group-hover:-translate-x-5">
                  {formatDate(link.createdAt)}
                </span>
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
                  className="text-muted-foreground transition-opacity duration-200 opacity-0 group-hover:opacity-100 absolute right-4"
                >
                  <path d="M7 7h10v10" />
                  <path d="M7 17 17 7" />
                </svg>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
