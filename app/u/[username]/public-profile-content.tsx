"use client";

import { useMemo, useState, startTransition, useEffect } from "react";
import Link from "next/link";
import { IconBrandX, IconBrandGithub, IconWorld } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface PublicUser {
  name: string;
  image: string | null;
  username: string | null;
  bio: string | null;
  github: string | null;
  twitter: string | null;
  website: string | null;
}

interface PublicGroup {
  id: string;
  name: string;
  color: string;
}

interface PublicBookmark {
  id: string;
  title: string;
  url: string | null;
  favicon: string | null;
  type: string;
  color: string | null;
  groupId: string;
  createdAt: Date | string;
}

interface PublicProfileContentProps {
  user: PublicUser;
  groups: PublicGroup[];
  bookmarks: PublicBookmark[];
}

export function PublicProfileContent({
  user,
  groups,
  bookmarks,
}: PublicProfileContentProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    startTransition(() => {
      setCurrentYear(new Date().getFullYear());
    });
  }, []);

  const tabs = useMemo(
    () => [
      { value: "all", label: "All" },
      ...groups.map((g) => ({ value: g.id, label: g.name, color: g.color })),
    ],
    [groups],
  );

  const filteredBookmarks = useMemo(() => {
    if (activeTab === "all") return bookmarks;
    return bookmarks.filter((b) => b.groupId === activeTab);
  }, [activeTab, bookmarks]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (currentYear === null) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const isCurrentYear = d.getFullYear() === currentYear;
    if (isCurrentYear) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const socials = [
    user.twitter && {
      href: `https://x.com/${user.twitter}`,
      icon: IconBrandX,
      label: "X",
    },
    user.github && {
      href: `https://github.com/${user.github}`,
      icon: IconBrandGithub,
      label: "GitHub",
    },
    user.website && {
      href: user.website,
      icon: IconWorld,
      label: "Website",
    },
  ].filter(Boolean) as Array<{
    href: string;
    icon: typeof IconBrandX;
    label: string;
  }>;

  const pageTitle = `${user.name} (@${user.username}) — bmrks`;
  const pageDescription = user.bio || `Public bookmarks shared by ${user.name}`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:type" content="profile" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
      <nav className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          <BmrksLogo />
          minimal
        </Link>
      </nav>
      <div className="flex flex-col lg:flex-row lg:gap-10">
        <aside className="mb-8 lg:mb-0 lg:sticky lg:top-20 lg:self-start lg:w-64 shrink-0">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name}
              className="h-14 w-14 rounded-full object-cover ring-1 ring-border"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted ring-1 ring-border text-lg font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="mt-3 text-lg font-medium">{user.name}</h1>
          <p className="-mt-0.5 text-sm text-muted-foreground">
            @{user.username}
          </p>
          {user.bio && (
            <p className="mt-2 text-sm text-muted-foreground">{user.bio}</p>
          )}
          {socials.length > 0 && (
            <div className="mt-4 flex gap-3">
              {socials.map((social) => (
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
          )}
        </aside>

        <div className="min-w-0 flex-1">
          {tabs.length > 1 && (
            <div className="mb-8 flex items-center gap-1 flex-wrap">
              {tabs.map((tab) => (
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
                  {"color" in tab && tab.color && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: tab.color }}
                    />
                  )}
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {filteredBookmarks.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No public bookmarks yet.
            </p>
          ) : (
            <>
              <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2 text-sm text-muted-foreground">
                <span>Title</span>
                <span>Created At</span>
              </div>
              <div className="flex flex-col gap-0.5 -mx-3">
                {filteredBookmarks.map((bookmark) => {
                  const hostname = bookmark.url
                    ? new URL(bookmark.url).hostname.replace("www.", "")
                    : null;
                  return (
                    <a
                      key={bookmark.id}
                      href={bookmark.url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "group relative flex items-center justify-between rounded-xl px-4 py-3 text-left transition-transform duration-200",
                        bookmark.url
                          ? "hover:bg-muted/50 active:scale-[0.99]"
                          : "cursor-default",
                      )}
                    >
                      <div className="flex flex-1 items-center gap-2 min-w-0 mr-4">
                        <BookmarkIcon bookmark={bookmark} />
                        <span className="text-sm truncate">
                          {bookmark.title}
                        </span>
                        {hostname && (
                          <span className="text-[13px] text-muted-foreground shrink-0">
                            {hostname}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center shrink-0">
                        <span
                          className={cn(
                            "text-[13px] text-muted-foreground whitespace-nowrap",
                            bookmark.url &&
                              "transition-transform duration-200 group-hover:-translate-x-5",
                          )}
                        >
                          {formatDate(bookmark.createdAt)}
                        </span>
                        {bookmark.url && (
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
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookmarkIcon({ bookmark }: { bookmark: PublicBookmark }) {
  const [faviconError, setFaviconError] = useState(false);

  if (bookmark.type === "color" && bookmark.color) {
    return (
      <div
        className="h-5 w-5 rounded border border-border shrink-0"
        style={{ backgroundColor: bookmark.color }}
      />
    );
  }

  if (bookmark.favicon && !faviconError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bookmark.favicon}
        alt=""
        className="h-5 w-5 rounded object-contain shrink-0"
        onError={() => setFaviconError(true)}
      />
    );
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground shrink-0">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    </div>
  );
}

function BmrksLogo() {
  return (
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
  );
}
