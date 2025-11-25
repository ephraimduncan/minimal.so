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
import {
  Copy,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronsRight,
  Check,
} from "lucide-react";
import { cn, parseColor } from "@/lib/utils";
import type { Bookmark, Group } from "@/lib/types";

interface BookmarkListProps {
  bookmarks: Bookmark[];
  groups: Group[];
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

  const formatDate = (date: Date) => {
    const now = new Date();
    const isCurrentYear = date.getFullYear() === now.getFullYear();

    if (isCurrentYear) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleClick = (bookmark: Bookmark, index: number) => {
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

  const handleCopy = (bookmark: Bookmark) => {
    const textToCopy = bookmark.url || bookmark.color || bookmark.title;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(bookmark.id);
    setTimeout(() => setCopiedId(null), 1000);
  };

  const handleStartRename = (bookmark: Bookmark) => {
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

  return (
    <div>
      <div className="mb-2 flex items-center justify-between border-b border-border px-1 pb-2 text-sm text-muted-foreground">
        <span>Title</span>
        <span>Created at</span>
      </div>
      <div className="flex flex-col gap-0.5 -mx-3">
        {bookmarks.map((bookmark, index) => (
          <ContextMenu
            key={bookmark.id}
            onOpenChange={(open) =>
              setContextMenuOpenId(open ? bookmark.id : null)
            }
          >
            <ContextMenuTrigger asChild>
              <button
                type="button"
                onClick={() => handleClick(bookmark, index)}
                onMouseEnter={() => onHoverChange(index)}
                onMouseLeave={() => onHoverChange(-1)}
                className={cn(
                  "group flex items-center justify-between rounded-xl px-4 py-3 text-left",
                  selectedIndex === index || contextMenuOpenId === bookmark.id
                    ? "bg-muted"
                    : "hover:bg-muted/50",
                  renamingId &&
                    renamingId !== bookmark.id &&
                    "blur-[1.5px] opacity-50 pointer-events-none"
                )}
              >
                <div className="flex flex-1 items-center gap-2 min-w-0 mr-4">
                  <BookmarkIcon
                    bookmark={bookmark}
                    isCopied={copiedId === bookmark.id}
                  />
                  {renamingId === bookmark.id ? (
                    <input
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
                      className="flex-1 max-w-[60%] bg-transparent text-sm font-normal outline-none border-none selection:bg-primary/20 caret-foreground"
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => {
                        const val = e.target.value;
                        e.target.value = "";
                        e.target.value = val;
                      }}
                    />
                  ) : (
                    <span className="text-sm font-normal">
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
                  {!(
                    (selectedIndex === index || hoveredIndex === index) &&
                    bookmark.url &&
                    !renamingId
                  ) && (
                    <span className="text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(bookmark.createdAt)}
                    </span>
                  )}
                  {(selectedIndex === index || hoveredIndex === index) &&
                    bookmark.url &&
                    !renamingId && (
                      <div className="flex items-center justify-end gap-1">
                        <kbd className="rounded border border-border bg-background px-1.5 text-sm font-medium text-muted-foreground">
                          ⌘
                        </kbd>
                        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          Enter
                        </kbd>
                      </div>
                    )}
                </div>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => handleCopy(bookmark)}>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy</span>
                <span className="ml-auto flex gap-0.5 text-xs text-muted-foreground">
                  <kbd className="rounded border bg-muted px-1 text-sm">⌘</kbd>
                  <kbd className="rounded border bg-muted px-1">C</kbd>
                </span>
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleStartRename(bookmark)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>Rename</span>
                <span className="ml-auto flex gap-0.5 text-xs text-muted-foreground">
                  <kbd className="rounded border bg-muted px-1 text-sm">⌘</kbd>
                  <kbd className="rounded border bg-muted px-1">E</kbd>
                </span>
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => onDelete(bookmark.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
                <span className="ml-auto flex gap-0.5 text-xs text-muted-foreground">
                  <kbd className="rounded border bg-muted px-1 text-sm">⌘</kbd>
                  <kbd className="rounded border bg-muted px-1">⌫</kbd>
                </span>
              </ContextMenuItem>
              {bookmark.url && (
                <ContextMenuItem onClick={() => onRefetch(bookmark.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Refetch</span>
                </ContextMenuItem>
              )}
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <ChevronsRight className="mr-2 h-4 w-4" />
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
  bookmark: Bookmark;
  isCopied?: boolean;
}) {
  if (isCopied) {
    return (
      <div className="flex h-5 w-5 items-center justify-center">
        <Check className="h-4 w-4 text-foreground" />
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

  if (bookmark.favicon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bookmark.favicon || "/placeholder.svg"}
        alt=""
        className="h-5 w-5 rounded object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
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
