"use client";

import Link from "next/link";
import { IconBrandX, IconBrandGithub, IconWorld, IconRss } from "@tabler/icons-react";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { FaviconImage } from "@/components/favicon-image";

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
  name: string;
  color: string;
}

interface PublicBookmark {
  title: string;
  url: string | null;
  favicon: string | null;
  type: string;
  color: string | null;
  groupName: string | null;
  updatedAt: Date | string;
}

interface PublicProfileContentProps {
  user: PublicUser;
  groups: PublicGroup[];
  bookmarks: PublicBookmark[];
  isLoggedIn: boolean;
}

export function PublicProfileContent({
  user,
  groups,
  bookmarks,
  isLoggedIn,
}: PublicProfileContentProps) {
  const [activeGroup, setActiveGroup] = useQueryState('group');
  const tabs: { value: string; label: string; color?: string }[] = [
    { value: "all", label: "All" },
    ...groups.map((g) => ({ value: g.name, label: g.name, color: g.color })),
  ];

  const activeTab =
    activeGroup && groups.some((g) => g.name === activeGroup)
      ? activeGroup
      : "all";

  const filteredBookmarks = (
    activeTab === "all"
      ? bookmarks
      : bookmarks.filter((bookmark) => bookmark.groupName === activeTab)
  ).map((bookmark) => ({
    ...bookmark,
    hostname: bookmark.url
      ? new URL(bookmark.url).hostname.replace("www.", "")
      : null,
  }));

  const currentYear = new Date().getFullYear();
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    const isCurrentYear = d.getFullYear() === currentYear;
    const formatOptions: Intl.DateTimeFormatOptions = isCurrentYear
      ? { month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" };
    return new Intl.DateTimeFormat("en-US", formatOptions).format(d);
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
    {
      href: `/u/${user.username}/feed.xml`,
      icon: IconRss,
      label: "RSS Feed",
    },
  ].flatMap((s) => (s ? [s] : []));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          <BmrksLogo />
          minimal
        </Link>
        {!isLoggedIn && (
          <div className="flex items-center">
            <Link
              href="/login"
              className="rounded-full px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
            >
              Sign Up
            </Link>
          </div>
        )}
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
                  rel="noopener"
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
                  onClick={() => setActiveGroup(tab.value === "all" ? null : tab.value)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    activeTab === tab.value
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.color && (
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
                <span>Updated</span>
              </div>
              <div className="flex flex-col gap-0.5 -mx-3">
                {filteredBookmarks.map((bookmark) => (
                  <a
                    key={bookmark.url ?? bookmark.title}
                    href={bookmark.url || undefined}
                    target="_blank"
                    rel="noopener"
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
                      {bookmark.hostname && (
                        <span className="text-[13px] text-muted-foreground shrink-0">
                          {bookmark.hostname}
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
                        {formatDate(bookmark.updatedAt)}
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
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BookmarkIcon({ bookmark }: { bookmark: PublicBookmark }) {
  if (bookmark.type === "color" && bookmark.color) {
    return (
      <div
        className="h-5 w-5 rounded border border-border shrink-0"
        style={{ backgroundColor: bookmark.color }}
      />
    );
  }

  return <FaviconImage url={bookmark.url} className="shrink-0" />;
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
