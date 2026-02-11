"use client";

import { memo, startTransition, useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  IconCopy,
  IconPencil,
  IconTrash,
  IconRefresh,
  IconChevronsRight,
  IconCheck,
  IconBookmark,
  IconSquaresSelected,
  IconWorld,
  IconWorldOff,
} from "@tabler/icons-react";
import { ContextMenuSeparator } from "@/components/ui/context-menu";
import {
  Empty,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { cn, parseColor } from "@/lib/utils";
import { type BookmarkItem, type GroupItem } from "@/lib/schema";
import { FaviconImage } from "@/components/favicon-image";

const EMPTY_STATE = (
  <Empty className="border-none py-16 gap-2">
    <EmptyMedia className="mb-0">
      <IconBookmark className="size-8 text-muted-foreground fill-muted-foreground" />
    </EmptyMedia>
    <EmptyTitle>No bookmarks here</EmptyTitle>
    <EmptyDescription>Add some cool links to get started</EmptyDescription>
  </Empty>
);

const EMPTY_SET = new Set<string>();

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
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelection?: (id: string) => void;
  onEnterSelectionMode?: (initialId?: string) => void;
  onBulkMove?: (targetGroupId: string) => void;
  onBulkDelete?: () => void;
  readOnly?: boolean;
  onLinkClick?: (bookmark: BookmarkItem) => void;
  hasUsername?: boolean;
  publicGroupIds?: Set<string>;
  onToggleVisibility?: (id: string, currentIsPublic: boolean | null | undefined) => void;
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
  selectionMode = false,
  selectedIds = EMPTY_SET,
  onToggleSelection,
  onEnterSelectionMode,
  onBulkMove,
  onBulkDelete,
  readOnly = false,
  onLinkClick,
  hasUsername = false,
  publicGroupIds,
  onToggleVisibility,
}: BookmarkListProps) {
  const [editValue, setEditValue] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [contextMenuOpenId, setContextMenuOpenId] = useState<string | null>(
    null,
  );
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    startTransition(() => {
      setCurrentYear(new Date().getFullYear());
    });
  }, []);

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;

    // During SSR, currentYear is null - always show year to avoid new Date()
    if (currentYear === null) {
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const isCurrentYear = d.getFullYear() === currentYear;

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

    if (selectionMode && onToggleSelection) {
      onToggleSelection(bookmark.id);
      return;
    }

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

  const handleRowClick = (bookmark: BookmarkItem, index: number) => {
    if (onLinkClick && bookmark.url) {
      onLinkClick(bookmark);
      return;
    }
    if (readOnly) {
      onSelect(index);
      return;
    }
    handleClick(bookmark);
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
    return EMPTY_STATE;
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
                  onClick={() => handleRowClick(bookmark, index)}
                  onMouseEnter={() => onHoverChange(index)}
                  onMouseLeave={() => onHoverChange(-1)}
                  style={{ contentVisibility: "auto", containIntrinsicSize: "auto 52px" }}
                  className={cn(
                    "group flex h-auto items-center justify-between rounded-xl px-4 py-3 text-left",
                    selectedIndex === index || contextMenuOpenId === bookmark.id
                      ? "bg-muted"
                      : "hover:bg-muted/50",
                    renamingId &&
                      renamingId !== bookmark.id &&
                      "opacity-30 pointer-events-none",
                  )}
                />
              }
            >
              <div className="flex flex-1 items-center gap-2 min-w-0 mr-4">
                {selectionMode ? (
                  <Checkbox
                    checked={selectedIds.has(bookmark.id)}
                    onCheckedChange={() => onToggleSelection?.(bookmark.id)}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <BookmarkIcon
                    bookmark={bookmark}
                    isCopied={copiedId === bookmark.id}
                  />
                )}
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
                    onFocus={(e) => e.target.select()}
                  />
                ) : (
                  <span className="text-sm font-normal truncate">
                    {copiedId === bookmark.id ? "Copied" : bookmark.title}
                  </span>
                )}
                {bookmark.url && !renamingId && copiedId !== bookmark.id ? (
                  <span className="text-[13px] text-muted-foreground">
                    {new URL(bookmark.url).hostname.replace("www.", "")}
                  </span>
                ) : null}
              </div>
              <div className="relative w-[100px] h-5 flex items-center justify-end gap-1.5">
                {(selectedIndex === index || hoveredIndex === index) &&
                !renamingId ? (
                  <KbdGroup>
                    <Kbd>⌘</Kbd>
                    <Kbd>Enter</Kbd>
                  </KbdGroup>
                ) : (
                  <>
                    {hasUsername && !renamingId && bookmark.isPublic === true && (
                      <IconWorld className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-[13px] text-muted-foreground whitespace-nowrap">
                      {formatDate(bookmark.createdAt)}
                    </span>
                  </>
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
                onClick={() => {
                  if (
                    selectionMode &&
                    selectedIds.has(bookmark.id) &&
                    onBulkDelete
                  ) {
                    onBulkDelete();
                  } else {
                    onDelete(bookmark.id);
                  }
                }}
                variant="destructive"
              >
                <IconTrash className="mr-2 h-4 w-4" />
                <span>Delete</span>
                <KbdGroup className="ml-auto">
                  <Kbd>⌘</Kbd>
                  <Kbd>⌫</Kbd>
                </KbdGroup>
              </ContextMenuItem>
              {bookmark.url ? (
                <ContextMenuItem onClick={() => onRefetch(bookmark.id)}>
                  <IconRefresh className="mr-2 h-4 w-4" />
                  <span>Refetch</span>
                </ContextMenuItem>
              ) : null}
              {hasUsername && onToggleVisibility && (
                <ContextMenuItem
                  onClick={() => onToggleVisibility(bookmark.id, bookmark.isPublic)}
                >
                  {isBookmarkPublic(bookmark, currentGroupId, publicGroupIds) ? (
                    <>
                      <IconWorldOff className="mr-2 h-4 w-4" />
                      <span>Make Private</span>
                    </>
                  ) : (
                    <>
                      <IconWorld className="mr-2 h-4 w-4" />
                      <span>Make Public</span>
                    </>
                  )}
                </ContextMenuItem>
              )}
              {groups.length > 1 ? (
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
                          onClick={() => {
                            if (
                              selectionMode &&
                              selectedIds.has(bookmark.id) &&
                              onBulkMove
                            ) {
                              onBulkMove(group.id);
                            } else {
                              onMove(bookmark.id, group.id);
                            }
                          }}
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
              ) : null}
              {!selectionMode && onEnterSelectionMode && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onEnterSelectionMode(bookmark.id)}
                  >
                    <IconSquaresSelected className="mr-2 h-4 w-4" />
                    <span>Select Multiple</span>
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
      </div>
    </div>
  );
}

function isBookmarkPublic(
  bookmark: BookmarkItem,
  currentGroupId: string,
  publicGroupIds?: Set<string>,
): boolean {
  const groupIsPublic = publicGroupIds?.has(currentGroupId) ?? false;
  return bookmark.isPublic === true || groupIsPublic;
}

const BookmarkIcon = memo(function BookmarkIcon({
  bookmark,
  isCopied,
}: {
  bookmark: BookmarkItem;
  isCopied?: boolean;
}) {
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

  return <FaviconImage url={bookmark.url} />;
});
