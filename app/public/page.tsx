"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconBrandX, IconBrandGithub, IconWorld } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const PROFILE = {
  name: "Ephraim Duncan",
  username: "@ephraimduncan",
  avatar: "https://avatars.githubusercontent.com/u/55143799?v=4",
  bio: "Building stuff on the web.",
  socials: [
    { href: "https://x.com/ephraimduncan", icon: IconBrandX, label: "X" },
    { href: "https://github.com/ephraimduncan", icon: IconBrandGithub, label: "GitHub" },
    { href: "https://minimal.so", icon: IconWorld, label: "Website" },
  ],
} as const;

const CATEGORY_META = {
  article: {
    label: "Articles",
    dotClass: "bg-link-article",
  },
  video: {
    label: "Videos",
    dotClass: "bg-link-video",
  },
  tool: {
    label: "Tools",
    dotClass: "bg-link-tool",
  },
  podcast: {
    label: "Podcasts",
    dotClass: "bg-link-podcast",
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
    id: "great-work",
    href: "https://paulgraham.com/greatwork.html",
    title: "How to Do Great Work",
    category: "article",
    createdAt: "2026-02-01",
  },
  {
    id: "inventing-on-principle",
    href: "https://vimeo.com/36579366",
    title: "Bret Victor – Inventing on Principle",
    category: "video",
    createdAt: "2026-01-28",
  },
  {
    id: "thousand-true-fans",
    href: "https://kk.org/thetechnium/1000-true-fans/",
    title: "1,000 True Fans",
    category: "article",
    createdAt: "2026-01-25",
  },
  {
    id: "linear",
    href: "https://linear.app",
    title: "Linear – Plan and build products",
    category: "tool",
    createdAt: "2026-01-22",
  },
  {
    id: "speed-matters",
    href: "https://jsomers.net/blog/speed",
    title: "Speed matters: Why working quickly is more important than it seems",
    category: "article",
    createdAt: "2026-01-18",
  },
  {
    id: "acquired-nvidia",
    href: "https://www.acquired.fm/episodes/nvidia-the-dawn-of-the-ai-era",
    title: "Acquired: Nvidia – The Dawn of the AI Era",
    category: "podcast",
    createdAt: "2026-01-15",
  },
  {
    id: "excalidraw",
    href: "https://excalidraw.com",
    title: "Excalidraw – Virtual whiteboard for sketching",
    category: "tool",
    createdAt: "2026-01-12",
  },
  {
    id: "collison-advice",
    href: "https://patrickcollison.com/advice",
    title: "Advice – Patrick Collison",
    category: "article",
    createdAt: "2026-01-10",
  },
  {
    id: "stanford-commencement",
    href: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    title: "Steve Jobs' 2005 Stanford Commencement Address",
    category: "video",
    createdAt: "2026-01-06",
  },
  {
    id: "raycast",
    href: "https://raycast.com",
    title: "Raycast – Supercharged productivity",
    category: "tool",
    createdAt: "2026-01-03",
  },
  {
    id: "dont-scale",
    href: "https://paulgraham.com/ds.html",
    title: "Do Things That Don't Scale",
    category: "article",
    createdAt: "2025-12-28",
  },
  {
    id: "lex-carmack",
    href: "https://lexfridman.com/john-carmack/",
    title: "John Carmack: Doom, Quake, VR, AGI – Lex Fridman Podcast",
    category: "podcast",
    createdAt: "2025-12-22",
  },
  {
    id: "simple-made-easy",
    href: "https://www.infoq.com/presentations/Simple-Made-Easy/",
    title: "Simple Made Easy – Rich Hickey",
    category: "video",
    createdAt: "2025-12-18",
  },
  {
    id: "hell-yeah-or-no",
    href: "https://sive.rs/hellyeah",
    title: "Hell Yeah or No – Derek Sivers",
    category: "article",
    createdAt: "2025-12-15",
  },
];

const CURRENT_YEAR = new Date().getFullYear();

function formatDate(date: string) {
  const d = new Date(date + "T00:00:00");
  const isCurrentYear = d.getFullYear() === CURRENT_YEAR;
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
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M12.432 17.949c.863 1.544 2.589 1.976 4.13 1.112c1.54 -.865 1.972 -2.594 1.048 -4.138c-.185 -.309 -.309 -.556 -.494 -.74c.247 .06 .555 .06 .925 .06c1.726 0 2.959 -1.234 2.959 -2.963c0 -1.73 -1.233 -2.965 -3.02 -2.965c-.37 0 -.617 0 -.925 .062c.185 -.185 .308 -.432 .493 -.74c.863 -1.545 .431 -3.274 -1.048 -4.138c-1.541 -.865 -3.205 -.433 -4.13 1.111c-.185 .309 -.308 .556 -.432 .803c-.123 -.247 -.246 -.494 -.431 -.803c-.802 -1.605 -2.528 -2.038 -4.007 -1.173c-1.541 .865 -1.973 2.594 -1.048 4.137c.185 .31 .308 .556 .493 .741c-.246 -.061 -.555 -.061 -.924 -.061c-1.788 0 -3.021 1.235 -3.021 2.964c0 1.729 1.233 2.964 3.02 2.964" />
            <path d="M4.073 21c4.286 -2.756 5.9 -5.254 7.927 -9" />
          </svg>
          minimal
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Sign up
          </Link>
        </div>
      </nav>
      <div className="flex flex-col lg:flex-row lg:gap-10">
      <aside className="mb-8 lg:mb-0 lg:sticky lg:top-20 lg:self-start lg:w-64 shrink-0">
        <img
          src={PROFILE.avatar}
          alt={PROFILE.name}
          className="h-14 w-14 rounded-full object-cover ring-1 ring-border"
        />
        <h1 className="mt-3 text-lg font-medium">{PROFILE.name}</h1>
        <p className="-mt-0.5 text-sm text-muted-foreground">
          {PROFILE.username}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{PROFILE.bio}</p>
        <div className="mt-4 flex gap-3">
          {PROFILE.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <social.icon size={18} strokeWidth={1.5} />
            </a>
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}
