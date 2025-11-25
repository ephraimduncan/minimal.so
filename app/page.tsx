"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Header } from "@/components/header";
import { BookmarkInput } from "@/components/bookmark-input";
import { BookmarkList } from "@/components/bookmark-list";
import type { Bookmark, Group } from "@/lib/types";
import { parseColor, isUrl, normalizeUrl } from "@/lib/utils";

const initialGroups: Group[] = [
  { id: "1", name: "Bookmarks", color: "#74B06F" },
  { id: "2", name: "Work", color: "#4A90D9" },
  { id: "3", name: "Personal", color: "#E6A23C" },
];

const initialBookmarks: Bookmark[] = [
  {
    id: "1",
    title: "@ on X",
    url: "https://x.com",
    favicon: "https://abs.twimg.com/favicons/twitter.3.ico",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "link",
  },
  {
    id: "2",
    title: "Google Gemini",
    url: "https://gemini.google.com",
    favicon:
      "https://www.gstatic.com/lamda/images/gemini_favicon_f069958c85030456e93de685481c559f160ea06b.png",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "link",
  },
  {
    id: "3",
    title: "Claude",
    url: "https://claude.ai",
    favicon: "https://claude.ai/favicon.ico",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "link",
  },
  {
    id: "4",
    title: "Documenso - The Open Source DocuSign Al...",
    url: "https://documenso.com",
    favicon: "https://documenso.com/favicon.ico",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "link",
  },
  {
    id: "5",
    title: "Google",
    url: "https://google.com",
    favicon: "https://www.google.com/favicon.ico",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "link",
  },
  {
    id: "6",
    title: "sample",
    url: "",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "text",
  },
  {
    id: "7",
    title: "@shaurya50211 on X",
    url: "https://x.com",
    favicon: "https://abs.twimg.com/favicons/twitter.3.ico",
    createdAt: new Date("2024-06-11"),
    groupId: "1",
    type: "link",
  },
  {
    id: "8",
    title: "christabel, maybe. chances are 90%",
    url: "",
    createdAt: new Date("2024-02-22"),
    groupId: "1",
    type: "text",
  },
  {
    id: "9",
    title: "#FF5733",
    url: "",
    createdAt: new Date("2024-11-20"),
    groupId: "1",
    type: "color",
    color: "#FF5733",
  },
];

export default function Home() {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [selectedGroupId, setSelectedGroupId] = useState("1");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const selectedGroup =
    groups.find((g) => g.id === selectedGroupId) || groups[0];

  const handleStartRename = (id: string) => {
    setRenamingId(id);
  };

  const handleFinishRename = () => {
    setRenamingId(null);
  };

  const handleDeleteBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const filteredBookmarks = bookmarks.filter((b) => {
    if (b.groupId !== selectedGroupId) return false;
    if (!searchQuery) return true;
    return (
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.url?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const bookmarkCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bookmarks.forEach((b) => {
      counts[b.groupId] = (counts[b.groupId] || 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (renamingId) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, filteredBookmarks.length - 1)
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        return;
      }

      // Determine active bookmark (hover takes priority over arrow selection)
      const activeIndex = hoveredIndex >= 0 ? hoveredIndex : selectedIndex;
      if (activeIndex < 0 || activeIndex >= filteredBookmarks.length) return;
      const activeBookmark = filteredBookmarks[activeIndex];
      if (!activeBookmark) return;

      if (
        e.key === "Enter" &&
        activeBookmark.url &&
        document.activeElement !== inputRef.current
      ) {
        e.preventDefault();
        window.open(activeBookmark.url, "_blank");
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        const textToCopy =
          activeBookmark.url || activeBookmark.color || activeBookmark.title;
        navigator.clipboard.writeText(textToCopy);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleStartRename(activeBookmark.id);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault();
        handleDeleteBookmark(activeBookmark.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredBookmarks, selectedIndex, hoveredIndex, renamingId]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedIndex(-1);
  }, []);

  const handleSelectGroup = useCallback((id: string) => {
    setSelectedGroupId(id);
    setSelectedIndex(-1);
  }, []);

  const handleAddBookmark = useCallback(
    (value: string) => {
      const lines = value
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const newBookmarks: Bookmark[] = lines.map((line) => {
        const colorResult = parseColor(line);
        if (colorResult.isColor) {
          return {
            id: Date.now().toString() + Math.random(),
            title: colorResult.original || line,
            url: "",
            createdAt: new Date(),
            groupId: selectedGroupId,
            type: "color" as const,
            color: colorResult.hex,
          };
        }

        if (isUrl(line)) {
          const url = normalizeUrl(line);
          return {
            id: Date.now().toString() + Math.random(),
            title: new URL(url).hostname.replace("www.", ""),
            url,
            createdAt: new Date(),
            groupId: selectedGroupId,
            type: "link" as const,
          };
        }

        return {
          id: Date.now().toString() + Math.random(),
          title: line,
          url: "",
          createdAt: new Date(),
          groupId: selectedGroupId,
          type: "text" as const,
        };
      });

      setBookmarks((prev) => [...newBookmarks, ...prev]);
      setSearchQuery("");
      setSelectedIndex(-1);
    },
    [selectedGroupId]
  );

  const handleCreateGroup = useCallback((name: string) => {
    const colors = ["#74B06F", "#4A90D9", "#E6A23C", "#9B59B6", "#E74C3C"];
    const newGroup: Group = {
      id: Date.now().toString(),
      name,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
    setGroups((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.id);
    setSelectedIndex(-1);
  }, []);

  const handleDeleteGroup = useCallback(
    (id: string) => {
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setBookmarks((prev) =>
        prev.map((b) =>
          b.groupId === id
            ? {
                ...b,
                groupId:
                  groups[0].id === id
                    ? groups[1]?.id || groups[0].id
                    : groups[0].id,
              }
            : b
        )
      );
      // Select first group if current is deleted
      if (selectedGroupId === id) {
        const remainingGroups = groups.filter((g) => g.id !== id);
        setSelectedGroupId(remainingGroups[0]?.id || "1");
        setSelectedIndex(-1);
      }
    },
    [groups, selectedGroupId]
  );

  const handleRenameBookmark = useCallback((id: string, newTitle: string) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, title: newTitle } : b))
    );
  }, []);

  const handleMoveBookmark = useCallback((id: string, groupId: string) => {
    setBookmarks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, groupId } : b))
    );
  }, []);

  const handleRefetchBookmark = useCallback((id: string) => {
    console.log("Refetching bookmark:", id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onDeleteGroup={handleDeleteGroup}
        bookmarkCounts={bookmarkCounts}
        userName="duncan"
      />
      <main className="mx-auto max-w-3xl px-5 py-20">
        <BookmarkInput
          ref={inputRef}
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleAddBookmark}
        />
        <BookmarkList
          bookmarks={filteredBookmarks}
          groups={groups}
          onDelete={handleDeleteBookmark}
          onRename={handleRenameBookmark}
          onMove={handleMoveBookmark}
          onRefetch={handleRefetchBookmark}
          currentGroupId={selectedGroupId}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          renamingId={renamingId}
          onStartRename={handleStartRename}
          onFinishRename={handleFinishRename}
          onHoverChange={setHoveredIndex}
          hoveredIndex={hoveredIndex}
        />
      </main>
    </div>
  );
}
