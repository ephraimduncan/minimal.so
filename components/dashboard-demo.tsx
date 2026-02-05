"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { BookmarkInput } from "@/components/bookmark-input";
import { BookmarkList } from "@/components/bookmark-list";
import { isUrl, normalizeUrl } from "@/lib/utils";
import type { BookmarkItem, GroupItem } from "@/lib/schema";

const hoursAgo = (hours: number): string =>
  new Date(Date.now() - 1000 * 60 * 60 * hours).toISOString();

const demoGroups: GroupItem[] = [
  { id: "personal", name: "Personal", color: "#FFD700", bookmarkCount: 6 },
  { id: "x-accounts", name: "𝕏", color: "#0ea5e9", bookmarkCount: 21 },
];

const personalBookmarks: Omit<BookmarkItem, "favicon">[] = [
  {
    id: "p1",
    title: "Ephraim Duncan",
    url: "https://ephraimduncan.com",
    type: "link",
    color: null,
    groupId: "personal",
    createdAt: new Date().toISOString(),
  },
  {
    id: "p2",
    title: "Documenso",
    url: "https://documenso.com",
    type: "link",
    color: null,
    groupId: "personal",
    createdAt: hoursAgo(1),
  },
  {
    id: "p3",
    title: "Blocks",
    url: "https://blocks.so",
    type: "link",
    color: null,
    groupId: "personal",
    createdAt: hoursAgo(2),
  },
  {
    id: "p4",
    title: "Writer",
    url: "https://writer.so",
    type: "link",
    color: null,
    groupId: "personal",
    createdAt: hoursAgo(3),
  },
  {
    id: "p5",
    title: "Refine",
    url: "https://refine.so",
    type: "link",
    color: null,
    groupId: "personal",
    createdAt: hoursAgo(4),
  },
  {
    id: "p6",
    title: "Weekday",
    url: "https://weekday.so",
    type: "link",
    color: null,
    groupId: "personal",
    createdAt: hoursAgo(5),
  },
];

const xAccountBookmarks: Omit<BookmarkItem, "favicon">[] = [
  {
    id: "x1",
    title: "Aiden Bai",
    url: "https://x.com/aidenybai",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: new Date().toISOString(),
  },
  {
    id: "x2",
    title: "Ben Awad",
    url: "https://x.com/benawad",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(1),
  },
  {
    id: "x3",
    title: "Benji Taylor",
    url: "https://x.com/benjitaylor",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(2),
  },
  {
    id: "x4",
    title: "Dillon Mulroy",
    url: "https://x.com/dillon_mulroy",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(3),
  },
  {
    id: "x5",
    title: "Ethan Niser",
    url: "https://x.com/ethanniser",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(4),
  },
  {
    id: "x6",
    title: "Jakub Krehel",
    url: "https://x.com/jakubkrehel",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(5),
  },
  {
    id: "x7",
    title: "Jarred Sumner",
    url: "https://x.com/jarredsumner",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(6),
  },
  {
    id: "x8",
    title: "Andrej Karpathy",
    url: "https://x.com/karpathy",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(7),
  },
  {
    id: "x9",
    title: "Kit Langton",
    url: "https://x.com/kitlangton",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(8),
  },
  {
    id: "x10",
    title: "Lucas Smith",
    url: "https://x.com/lxunos",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(9),
  },
  {
    id: "x11",
    title: "Pontus Abrahamsson",
    url: "https://x.com/pontusab",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(10),
  },
  {
    id: "x12",
    title: "Raphael Schaad",
    url: "https://x.com/raphaelschaad",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(11),
  },
  {
    id: "x13",
    title: "Guillermo Rauch",
    url: "https://x.com/rauchg",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(12),
  },
  {
    id: "x14",
    title: "George Hotz",
    url: "https://x.com/realGeorgeHotz",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(13),
  },
  {
    id: "x15",
    title: "Rich Harris",
    url: "https://x.com/Rich_Harris",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(14),
  },
  {
    id: "x16",
    title: "Ryan Carniato",
    url: "https://x.com/RyanCarniato",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(15),
  },
  {
    id: "x17",
    title: "shadcn",
    url: "https://x.com/shadcn",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(16),
  },
  {
    id: "x18",
    title: "Shu Ding",
    url: "https://x.com/shuding",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(17),
  },
  {
    id: "x19",
    title: "Tanner Linsley",
    url: "https://x.com/tannerlinsley",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(18),
  },
  {
    id: "x20",
    title: "dax",
    url: "https://x.com/thdxr",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(19),
  },
  {
    id: "x21",
    title: "sunil pai",
    url: "https://x.com/threepointone",
    type: "link",
    color: null,
    groupId: "x-accounts",
    createdAt: hoursAgo(20),
  },
];

const initialBookmarks: Omit<BookmarkItem, "favicon">[] = [
  ...personalBookmarks,
  ...xAccountBookmarks,
];

const FAVICON_CACHE_KEY = "demo-favicons";

function getFaviconCache(): Record<string, string> {
  const cached = localStorage.getItem(FAVICON_CACHE_KEY);
  return cached ? JSON.parse(cached) : {};
}

function saveFaviconCache(cache: Record<string, string>): void {
  localStorage.setItem(FAVICON_CACHE_KEY, JSON.stringify(cache));
}

function getFaviconUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "x.com") {
      const username = urlObj.pathname.replace("/", "");
      return `https://unavatar.io/twitter/${username}`;
    }
    return `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=64`;
  } catch {
    return "";
  }
}

export function DashboardDemo() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() =>
    initialBookmarks.map((b) => ({ ...b, favicon: null })),
  );

  useEffect(() => {
    const faviconCache = getFaviconCache();

    const bookmarksWithFavicons = initialBookmarks.map((bookmark) => {
      if (bookmark.url && faviconCache[bookmark.url]) {
        return { ...bookmark, favicon: faviconCache[bookmark.url] };
      }
      if (bookmark.url) {
        const faviconUrl = getFaviconUrl(bookmark.url);
        faviconCache[bookmark.url] = faviconUrl;
        return { ...bookmark, favicon: faviconUrl };
      }
      return { ...bookmark, favicon: null };
    });

    saveFaviconCache(faviconCache);
    startTransition(() => {
      setBookmarks(bookmarksWithFavicons);
    });
  }, []);
  const [selectedGroupId, setSelectedGroupId] = useState(
    demoGroups[0]?.id ?? "",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const handleLinkClick = () => {
    router.push("/login");
  };

  const groupsWithCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bookmark of bookmarks) {
      counts.set(bookmark.groupId, (counts.get(bookmark.groupId) ?? 0) + 1);
    }

    return demoGroups.map((group) => ({
      ...group,
      bookmarkCount: counts.get(group.id) ?? 0,
    }));
  }, [bookmarks]);

  const selectedGroup =
    groupsWithCounts.find((group) => group.id === selectedGroupId) ??
    groupsWithCounts[0];

  const filteredBookmarks = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    return bookmarks.filter((bookmark) => {
      if (bookmark.groupId !== selectedGroup?.id) return false;
      if (!trimmedQuery) return true;
      return (
        bookmark.title.toLowerCase().includes(trimmedQuery) ||
        (bookmark.url ?? "").toLowerCase().includes(trimmedQuery)
      );
    });
  }, [bookmarks, searchQuery, selectedGroup?.id]);

  const handleAddBookmark = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || !selectedGroup) return;

    const url = isUrl(trimmed) ? normalizeUrl(trimmed) : null;
    const favicon = url ? getFaviconUrl(url) : null;

    if (url && favicon) {
      const faviconCache = getFaviconCache();
      faviconCache[url] = favicon;
      saveFaviconCache(faviconCache);
    }

    const nextBookmark: BookmarkItem = {
      id: `demo-${Date.now()}`,
      title: url ? new URL(url).hostname.replace("www.", "") : trimmed,
      url,
      favicon,
      type: url ? "link" : "text",
      color: null,
      groupId: selectedGroup.id,
      createdAt: new Date().toISOString(),
    };

    setBookmarks((prev) => [nextBookmark, ...prev]);
    setSelectedIndex(0);
  };

  const handleDeleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
    setSelectedIndex(-1);
  };

  const handleRenameBookmark = (id: string, newTitle: string) => {
    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, title: newTitle } : bookmark,
      ),
    );
  };

  const handleMoveBookmark = (id: string, groupId: string) => {
    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, groupId } : bookmark,
      ),
    );
    setSelectedIndex(-1);
  };

  const handleStartRename = (id: string) => {
    setRenamingId(id);
  };

  const handleFinishRename = () => {
    setRenamingId(null);
  };

  return (
    <section className="-mx-4 sm:mx-0 sm:w-[80vw] lg:w-[50vw] sm:relative sm:left-1/2 sm:-translate-x-1/2">
      <div className="rounded-xl border border-border bg-background">
        <div className="border-b border-border">
          <Header
            groups={groupsWithCounts}
            selectedGroup={selectedGroup}
            onSelectGroup={(id) => {
              setSelectedGroupId(id);
              setSelectedIndex(-1);
            }}
            onCreateGroup={() => {}}
            onDeleteGroup={() => {}}
            userName="Preview"
            userEmail="preview@minimal.so"
            readOnly
            showUserMenu={false}
            logoSize={20}
          />
        </div>
        <div className="mx-auto w-full max-w-lg px-6 pt-10 pb-10 min-h-[500px] max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <BookmarkInput
            ref={inputRef}
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleAddBookmark}
          />
          <BookmarkList
            bookmarks={filteredBookmarks}
            groups={groupsWithCounts}
            onDelete={handleDeleteBookmark}
            onRename={handleRenameBookmark}
            onMove={handleMoveBookmark}
            onRefetch={() => {}}
            currentGroupId={selectedGroup?.id ?? ""}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            renamingId={renamingId}
            onStartRename={handleStartRename}
            onFinishRename={handleFinishRename}
            onLinkClick={handleLinkClick}
            onHoverChange={setHoveredIndex}
            hoveredIndex={hoveredIndex}
            readOnly
          />
        </div>
      </div>
    </section>
  );
}
