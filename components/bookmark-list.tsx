"use client";

import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import {
  IconCopy,
  IconPencil,
  IconTrash,
  IconRefresh,
  IconChevronsRight,
  IconCheck,
  IconBookmark,
} from "@tabler/icons-react";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn, parseColor } from "@/lib/utils";
import { type BookmarkItem, type GroupItem } from "@/lib/schema";

interface BookmarkListProps {
  bookmarks: BookmarkItem[];
  groups: GroupItem[];
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onMove: (id: string, groupId: string) => void;
  onRefetch: (id: string) => void;
  currentGroupId: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
  renamingId: string | null;
  onStartRename: (id: string) => void;
  onFinishRename: () => void;
  onHoverChange: (index: number) => void;
  hoveredIndex: number;
}

export function BookmarkList({
  bookmarks,
  groups,
  onDelete,
  onRename,
  onMove,
  onRefetch,
  currentGroupId,
  selectedIndex,
  onSelect,
  renamingId,
  onStartRename,
  onFinishRename,
  onHoverChange,
  hoveredIndex,
}: BookmarkListProps) {
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextMenuOpenId, setContextMenuOpenId] = useState<string | null>(
    null
  );

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const isCurrentYear = d.getFullYear() === now.getFullYear();

    if (isCurrentYear) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleClick = (bookmark: BookmarkItem) => {
    if (renamingId) return;
    onSelect(-1);

    if (bookmark.url) {
      window.open(bookmark.url, "_blank");
    } else {
      const textToCopy = bookmark.color || bookmark.title;
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(bookmark.id);
      setTimeout(() => setCopiedId(null), 1000);
    }
  };

  const handleCopy = (bookmark: BookmarkItem) => {
    const textToCopy = bookmark.url || bookmark.color || bookmark.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(bookmark.id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  const handleStartRename = (bookmark: BookmarkItem) => {
    onStartRename(bookmark.id);
    setEditValue(bookmark.title);
  };

  const handleFinishRename = (id: string) => {
    if (editValue.trim()) {
      onRename(id, editValue.trim());
    }
    onFinishRename();
    setEditValue("");
  };

  if (bookmarks.length === 0) {
    return (
      <Empty className="border-none py-16">
        <EmptyMedia>
          <IconBookmark className="size-5 text-muted-foreground fill-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No bookmarks here</EmptyTitle>
        <EmptyDescription>Add some cool links to get started</EmptyDescription>
      </Empty>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2 text-sm text-muted-foreground">
        <span>Title</span>
        <span>Created At</span>
      </div>
      <div className="flex flex-col gap-0.5 -mx-3">
        {bookmarks.map((bookmark, index) => (
          <ContextMenu
            key={bookmark.id}
            onOpenChange={(open) =>
              setContextMenuOpenId(open ? bookmark.id : null)
            }
          >
            <ContextMenuTrigger
              render={
                <Button
                  variant="ghost"
                  onClick={() => handleClick(bookmark)}
                  onMouseEnter={() => onHoverChange(index)}
                  onMouseLeave={() => onHoverChange(-1)}
                  className={cn(
                    "group flex h-auto items-center justify-between rounded-xl px-4 py-3 text-left",
                    selectedIndex === index || contextMenuOpenId === bookmark.id
                      ? "bg-muted"
                      : "hover:bg-muted/50",
                    renamingId &&
                      renamingId !== bookmark.id &&
                      "blur-[1.5px] opacity-50 pointer-events-none"
                  )}
                />
              }
            >
                <div className="flex flex-1 items-center gap-2 min-w-0 mr-4">
                  <BookmarkIcon
                    bookmark={bookmark}
                    isCopied={copiedId === bookmark.id}
                  />
                  {renamingId === bookmark.id ? (
                    <Input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleFinishRename(bookmark.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFinishRename(bookmark.id);
                        if (e.key === "Escape") {
                          onFinishRename();
                          setEditValue("");
                        }
                      }}
                      autoFocus
                      className="h-auto flex-1 max-w-[60%] border-none bg-transparent px-0 py-0 text-sm font-normal shadow-none selection:bg-primary/20 focus-visible:ring-0"
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => {
                        const val = e.target.value;
                        e.target.value = "";
                        e.target.value = val;
                      }}
                    />
                  ) : (
                    <span className="text-sm font-normal truncate">
                      {copiedId === bookmark.id ? "Copied" : bookmark.title}
                    </span>
                  )}
                  {bookmark.url && !renamingId && copiedId !== bookmark.id && (
                    <span className="text-[13px] text-muted-foreground">
                      {new URL(bookmark.url).hostname.replace("www.", "")}
                    </span>
                  )}
                </div>
                <div className="relative w-[90px] h-5 flex items-center justify-end">
                  {!((selectedIndex === index || hoveredIndex === index) && !renamingId) && (
                    <span className="text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(bookmark.createdAt)}
                    </span>
                  )}
                  {(selectedIndex === index || hoveredIndex === index) && !renamingId && (
                    <KbdGroup>
                      <Kbd>⌘</Kbd>
                      <Kbd>Enter</Kbd>
                    </KbdGroup>
                  )}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => handleCopy(bookmark)}>
                <IconCopy className="mr-2 h-4 w-4" />
                <span>Copy</span>
                <KbdGroup className="ml-auto">
                  <Kbd>⌘</Kbd>
                  <Kbd>C</Kbd>
                </KbdGroup>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleStartRename(bookmark)}>
                <IconPencil className="mr-2 h-4 w-4" />
                <span>Rename</span>
                <KbdGroup className="ml-auto">
                  <Kbd>⌘</Kbd>
                  <Kbd>E</Kbd>
                </KbdGroup>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDelete(bookmark.id)}
                variant="destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                <span>Delete</span>
                <KbdGroup className="ml-auto">
                  <Kbd>⌘</Kbd>
                  <Kbd>⌫</Kbd>
                </KbdGroup>
              </ContextMenuItem>
              {bookmark.url && (
                <ContextMenuItem onClick={() => onRefetch(bookmark.id)}>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  <span>Refetch</span>
                </ContextMenuItem>
              )}
              {groups.length > 1 && (
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <IconChevronsRight className="mr-2 h-4 w-4" />
                    <span>Move To...</span>
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-40">
                    {groups
                      .filter((g) => g.id !== currentGroupId)
                      .map((group) => (
                        <ContextMenuItem
                          key={group.id}
                          onClick={() => onMove(bookmark.id, group.id)}
                        >
                          <span
                            className="mr-2 h-2 w-2 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          {group.name}
                        </ContextMenuItem>
                      ))}
                  </ContextMenuSubContent>
                </ContextMenuSub>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}

function BookmarkIcon({
  bookmark,
  isCopied,
}: {
  bookmark: BookmarkItem;
  isCopied?: boolean;
}) {
  const [faviconError, setFaviconError] = useState(false);

  if (isCopied) {
    return (
      <div className="flex h-5 w-5 items-center justify-center">
        <IconCheck className="h-4 w-4 text-foreground" />
      </div>
    );
  }

  if (bookmark.type === "color" && bookmark.color) {
    return (
      <div
        className="h-5 w-5 rounded border border-border"
        style={{ backgroundColor: bookmark.color }}
      />
    );
  }

  if (bookmark.type === "text") {
    const colorResult = parseColor(bookmark.title);
    if (colorResult.isColor && colorResult.hex) {
      return (
        <div
          className="h-5 w-5 rounded border border-border"
          style={{ backgroundColor: colorResult.hex }}
        />
      );
    }
  }

  if (bookmark.favicon && !faviconError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bookmark.favicon}
        alt=""
        className="h-5 w-5 rounded object-contain"
        onError={() => setFaviconError(true)}
      />
    );
  }

  return (
    <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-muted-foreground">
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
