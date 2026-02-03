"use client";

import { useMemo, useRef, useState } from "react";
import { Header } from "@/components/header";
import { BookmarkInput } from "@/components/bookmark-input";
import { BookmarkList } from "@/components/bookmark-list";
import { isUrl, normalizeUrl } from "@/lib/utils";
import type { BookmarkItem, GroupItem } from "@/lib/schema";

const demoGroups: GroupItem[] = [
  { id: "inbox", name: "Inbox", color: "#111827", bookmarkCount: 2 },
  { id: "research", name: "Research", color: "#10b981", bookmarkCount: 2 },
  { id: "inspiration", name: "Inspiration", color: "#f59e0b", bookmarkCount: 2 },
];

const demoBookmarks: BookmarkItem[] = [
  {
    id: "b1",
    title: "Minimal keyboard flow",
    url: "https://minimal.so/keyboard",
    favicon: null,
    type: "link",
    color: null,
    groupId: "inbox",
    createdAt: new Date().toISOString(),
  },
  {
    id: "b2",
    title: "Reading queue",
    url: "https://minimal.so/queue",
    favicon: null,
    type: "link",
    color: null,
    groupId: "inbox",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "b3",
    title: "Metadata patterns",
    url: "https://minimal.so/metadata",
    favicon: null,
    type: "link",
    color: null,
    groupId: "research",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "b4",
    title: "Search across groups",
    url: "https://minimal.so/search",
    favicon: null,
    type: "link",
    color: null,
    groupId: "research",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "b5",
    title: "Launch inspiration",
    url: "https://minimal.so/launch",
    favicon: null,
    type: "link",
    color: null,
    groupId: "inspiration",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "b6",
    title: "Brand references",
    url: "https://minimal.so/brand",
    favicon: null,
    type: "link",
    color: null,
    groupId: "inspiration",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
];

export function DashboardDemo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(demoBookmarks);
  const [selectedGroupId, setSelectedGroupId] = useState(
    demoGroups[0]?.id ?? ""
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const groups = demoGroups;

  const groupsWithCounts = useMemo(() => {
    return groups.map((group) => ({
      ...group,
      bookmarkCount: bookmarks.filter((item) => item.groupId === group.id)
        .length,
    }));
  }, [bookmarks, groups]);

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
    const nextBookmark: BookmarkItem = {
      id: `demo-${Date.now()}`,
      title: url ? new URL(url).hostname.replace("www.", "") : trimmed,
      url,
      favicon: null,
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
        bookmark.id === id ? { ...bookmark, title: newTitle } : bookmark
      )
    );
  };

  const handleMoveBookmark = (id: string, groupId: string) => {
    setBookmarks((prev) =>
      prev.map((bookmark) =>
        bookmark.id === id ? { ...bookmark, groupId } : bookmark
      )
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
    <section className="my-12 -mx-4 sm:-mx-6 lg:-mx-32 xl:-mx-48">
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
        <div className="mx-auto w-full max-w-lg px-6 pt-10 pb-20 min-h-[500px]">
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
            onHoverChange={setHoveredIndex}
            hoveredIndex={hoveredIndex}
            readOnly
          />
        </div>
      </div>
    </section>
  );
}
