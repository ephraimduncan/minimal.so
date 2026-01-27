"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { BookmarkInput } from "@/components/bookmark-input";
import { BookmarkList } from "@/components/bookmark-list";
import { BookmarkListSkeleton } from "@/components/dashboard-skeleton";
import { MultiSelectToolbar } from "@/components/multi-select-toolbar";
import { BulkMoveDialog } from "@/components/bulk-move-dialog";
import { BulkDeleteDialog } from "@/components/bulk-delete-dialog";
import { parseColor, isUrl, normalizeUrl } from "@/lib/utils";
import { client } from "@/lib/orpc";
import { useDebounce } from "@/hooks/use-debounce";
import { useFocusRefetch } from "@/hooks/use-focus-refetch";
import { useLatestRef } from "@/lib/hooks/use-latest-ref";
import type { BookmarkType, GroupItem, BookmarkItem } from "@/lib/schema";
import type { Session } from "@/lib/auth";

interface DashboardContentProps {
  session: NonNullable<Session>;
  initialGroups: GroupItem[];
  initialBookmarks: BookmarkItem[];
}

export function DashboardContent({
  session,
  initialGroups,
  initialBookmarks,
}: DashboardContentProps) {
  const queryClient = useQueryClient();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: () => client.group.list(),
    initialData: initialGroups,
    staleTime: 60 * 1000,
  });

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);

  useFocusRefetch(groups);

  const currentGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks", currentGroupId],
    queryFn: () =>
      client.bookmark.list({ groupId: currentGroupId ?? undefined }),
    initialData:
      currentGroupId === initialGroups[0]?.id ? initialBookmarks : undefined,
    enabled: !!currentGroupId,
    staleTime: 60 * 1000,
  });

  const bookmarks = useMemo(
    () => bookmarksQuery.data ?? [],
    [bookmarksQuery.data]
  );

  const createBookmarkMutation = useMutation({
    mutationFn: (data: {
      title: string;
      url?: string;
      type: BookmarkType;
      color?: string;
      groupId: string;
    }) => client.bookmark.create(data),
    onMutate: async (newBookmark) => {
      await queryClient.cancelQueries({
        queryKey: ["bookmarks", newBookmark.groupId],
      });
      await queryClient.cancelQueries({ queryKey: ["groups"] });

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>([
        "bookmarks",
        newBookmark.groupId,
      ]);
      const previousGroups = queryClient.getQueryData<GroupItem[]>(["groups"]);

      const optimisticBookmark: BookmarkItem = {
        id: `temp-${Date.now()}`,
        title: newBookmark.title,
        url: newBookmark.url || null,
        favicon: null,
        type: newBookmark.type,
        color: newBookmark.color || null,
        groupId: newBookmark.groupId,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<BookmarkItem[]>(
        ["bookmarks", newBookmark.groupId],
        (old) => [optimisticBookmark, ...(old || [])]
      );

      queryClient.setQueryData<GroupItem[]>(["groups"], (old) =>
        old?.map((g) =>
          g.id === newBookmark.groupId
            ? { ...g, bookmarkCount: (g.bookmarkCount ?? 0) + 1 }
            : g
        )
      );

      return {
        previousBookmarks,
        previousGroups,
        groupId: newBookmark.groupId,
      };
    },
    onError: (_err, _newBookmark, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(
          ["bookmarks", context.groupId],
          context.previousBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(["groups"], context.previousGroups);
      }
      toast.error("Failed to create bookmark");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["bookmarks", variables.groupId],
      });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const updateBookmarkMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title?: string;
      url?: string;
      type?: BookmarkType;
      color?: string;
      groupId?: string;
      _sourceGroupId?: string;
    }) => {
      if (data.id.startsWith("temp-")) {
        return { id: data.id, title: data.title ?? "" } as Pick<
          BookmarkItem,
          "id" | "title"
        >;
      }
      const { _sourceGroupId, ...updateData } = data;
      return client.bookmark.update(updateData);
    },
    onMutate: async (data) => {
      const { id, groupId: targetGroupId, _sourceGroupId, ...updates } = data;
      const isMove =
        targetGroupId && _sourceGroupId && targetGroupId !== _sourceGroupId;

      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      await queryClient.cancelQueries({ queryKey: ["groups"] });

      const previousGroups = queryClient.getQueryData<GroupItem[]>(["groups"]);

      if (isMove) {
        const previousSourceBookmarks = queryClient.getQueryData<
          BookmarkItem[]
        >(["bookmarks", _sourceGroupId]);
        const previousTargetBookmarks = queryClient.getQueryData<
          BookmarkItem[]
        >(["bookmarks", targetGroupId]);

        const movedBookmark = previousSourceBookmarks?.find((b) => b.id === id);

        if (movedBookmark) {
          queryClient.setQueryData<BookmarkItem[]>(
            ["bookmarks", _sourceGroupId],
            (old) => old?.filter((b) => b.id !== id) ?? []
          );

          queryClient.setQueryData<BookmarkItem[]>(
            ["bookmarks", targetGroupId],
            (old) => [
              { ...movedBookmark, groupId: targetGroupId },
              ...(old ?? []),
            ]
          );

          queryClient.setQueryData<GroupItem[]>(["groups"], (old) =>
            old?.map((g) => {
              if (g.id === _sourceGroupId) {
                return {
                  ...g,
                  bookmarkCount: Math.max(0, (g.bookmarkCount ?? 0) - 1),
                };
              }
              if (g.id === targetGroupId) {
                return { ...g, bookmarkCount: (g.bookmarkCount ?? 0) + 1 };
              }
              return g;
            })
          );
        }

        return {
          previousSourceBookmarks,
          previousTargetBookmarks,
          previousGroups,
          sourceGroupId: _sourceGroupId,
          targetGroupId,
        };
      }

      const sourceGroupId = _sourceGroupId ?? currentGroupId;
      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>([
        "bookmarks",
        sourceGroupId,
      ]);

      queryClient.setQueryData<BookmarkItem[]>(
        ["bookmarks", sourceGroupId],
        (old) => old?.map((b) => (b.id === id ? { ...b, ...updates } : b)) ?? []
      );

      return { previousBookmarks, sourceGroupId, previousGroups };
    },
    onError: (_err, data, context) => {
      if (
        context?.previousSourceBookmarks !== undefined &&
        context?.sourceGroupId
      ) {
        queryClient.setQueryData(
          ["bookmarks", context.sourceGroupId],
          context.previousSourceBookmarks
        );
      }
      if (
        context?.previousTargetBookmarks !== undefined &&
        context?.targetGroupId
      ) {
        queryClient.setQueryData(
          ["bookmarks", context.targetGroupId],
          context.previousTargetBookmarks
        );
      }
      if (context?.previousBookmarks !== undefined && context?.sourceGroupId) {
        queryClient.setQueryData(
          ["bookmarks", context.sourceGroupId],
          context.previousBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(["groups"], context.previousGroups);
      }
      toast.error("Failed to update bookmark");
    },
    onSettled: (_data, _error, data, context) => {
      if (context?.sourceGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", context.sourceGroupId],
        });
      }
      if (context?.targetGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", context.targetGroupId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: (data: {
      name: string;
      color: string;
      _optimisticId?: string;
    }) => {
      const { _optimisticId, ...createData } = data;
      return client.group.create(createData);
    },
    onMutate: async (newGroup) => {
      await queryClient.cancelQueries({ queryKey: ["groups"] });

      const previousGroups = queryClient.getQueryData<GroupItem[]>(["groups"]);
      const previousSelectedGroupId = selectedGroupId;

      const optimisticGroup: GroupItem = {
        id: newGroup._optimisticId ?? `temp-${Date.now()}`,
        name: newGroup.name,
        color: newGroup.color,
        bookmarkCount: 0,
      };

      queryClient.setQueryData<GroupItem[]>(["groups"], (old) => [
        ...(old ?? []),
        optimisticGroup,
      ]);

      setSelectedGroupId(optimisticGroup.id);
      setSelectedIndex(-1);

      return {
        previousGroups,
        previousSelectedGroupId,
        optimisticId: optimisticGroup.id,
      };
    },
    onError: (_err, _newGroup, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(["groups"], context.previousGroups);
      }
      if (context?.previousSelectedGroupId !== undefined) {
        setSelectedGroupId(context.previousSelectedGroupId);
      }
      toast.error("Failed to create group");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (data: { id: string }) => client.group.delete(data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["groups"] });

      const previousGroups = queryClient.getQueryData<GroupItem[]>(["groups"]);
      const previousSelectedGroupId = selectedGroupId;

      queryClient.setQueryData<GroupItem[]>(
        ["groups"],
        (old) => old?.filter((g) => g.id !== data.id) ?? []
      );

      if (currentGroupId === data.id) {
        const remainingGroups =
          previousGroups?.filter((g) => g.id !== data.id) ?? [];
        setSelectedGroupId(remainingGroups[0]?.id ?? null);
        setSelectedIndex(-1);
      }

      return { previousGroups, previousSelectedGroupId, deletedId: data.id };
    },
    onError: (_err, _data, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData(["groups"], context.previousGroups);
      }
      if (context?.previousSelectedGroupId !== undefined) {
        setSelectedGroupId(context.previousSelectedGroupId);
      }
      toast.error("Failed to delete group");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const refetchBookmarkMutation = useMutation({
    mutationFn: (data: { id: string }) => client.bookmark.refetch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Metadata refreshed");
    },
    onError: () => {
      toast.error("Failed to refresh metadata");
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (data: { ids: string[]; _groupId?: string }) => {
      const { _groupId, ...deleteData } = data;
      const realIds = deleteData.ids.filter((id) => !id.startsWith("temp-"));
      if (realIds.length === 0) {
        return { success: true };
      }
      return client.bookmark.bulkDelete({ ids: realIds });
    },
    onMutate: async (data) => {
      const groupId = data._groupId ?? currentGroupId;

      await queryClient.cancelQueries({ queryKey: ["bookmarks", groupId] });
      await queryClient.cancelQueries({ queryKey: ["groups"] });

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>([
        "bookmarks",
        groupId,
      ]);
      const previousGroups = queryClient.getQueryData<GroupItem[]>(["groups"]);

      queryClient.setQueryData<BookmarkItem[]>(
        ["bookmarks", groupId],
        (old) => old?.filter((b) => !data.ids.includes(b.id)) ?? []
      );

      queryClient.setQueryData<GroupItem[]>(["groups"], (old) =>
        old?.map((g) =>
          g.id === groupId
            ? {
                ...g,
                bookmarkCount: Math.max(0, (g.bookmarkCount ?? 0) - data.ids.length),
              }
            : g
        )
      );

      return { previousBookmarks, previousGroups, groupId };
    },
    onError: (_err, _data, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(
          ["bookmarks", context.groupId],
          context.previousBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(["groups"], context.previousGroups);
      }
      toast.error("Failed to delete bookmarks");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.groupId) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", context.groupId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const bulkMoveMutation = useMutation({
    mutationFn: (data: {
      ids: string[];
      targetGroupId: string;
      _sourceGroupId?: string;
    }) => {
      const { _sourceGroupId, ...moveData } = data;
      return client.bookmark.bulkMove(moveData);
    },
    onMutate: async (data) => {
      const { ids, targetGroupId, _sourceGroupId } = data;
      const sourceGroupId = _sourceGroupId ?? currentGroupId;

      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      await queryClient.cancelQueries({ queryKey: ["groups"] });

      const previousSourceBookmarks = queryClient.getQueryData<BookmarkItem[]>([
        "bookmarks",
        sourceGroupId,
      ]);
      const previousTargetBookmarks = queryClient.getQueryData<BookmarkItem[]>([
        "bookmarks",
        targetGroupId,
      ]);
      const previousGroups = queryClient.getQueryData<GroupItem[]>(["groups"]);

      const movedBookmarks = previousSourceBookmarks?.filter((b) =>
        ids.includes(b.id)
      );

      if (movedBookmarks) {
        queryClient.setQueryData<BookmarkItem[]>(
          ["bookmarks", sourceGroupId],
          (old) => old?.filter((b) => !ids.includes(b.id)) ?? []
        );

        queryClient.setQueryData<BookmarkItem[]>(
          ["bookmarks", targetGroupId],
          (old) => [
            ...movedBookmarks.map((b) => ({ ...b, groupId: targetGroupId })),
            ...(old ?? []),
          ]
        );

        queryClient.setQueryData<GroupItem[]>(["groups"], (old) =>
          old?.map((g) => {
            if (g.id === sourceGroupId) {
              return {
                ...g,
                bookmarkCount: Math.max(0, (g.bookmarkCount ?? 0) - ids.length),
              };
            }
            if (g.id === targetGroupId) {
              return { ...g, bookmarkCount: (g.bookmarkCount ?? 0) + ids.length };
            }
            return g;
          })
        );
      }

      return {
        previousSourceBookmarks,
        previousTargetBookmarks,
        previousGroups,
        sourceGroupId,
        targetGroupId,
      };
    },
    onError: (_err, _data, context) => {
      if (context?.previousSourceBookmarks && context?.sourceGroupId) {
        queryClient.setQueryData(
          ["bookmarks", context.sourceGroupId],
          context.previousSourceBookmarks
        );
      }
      if (context?.previousTargetBookmarks && context?.targetGroupId) {
        queryClient.setQueryData(
          ["bookmarks", context.targetGroupId],
          context.previousTargetBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData(["groups"], context.previousGroups);
      }
      toast.error("Failed to move bookmarks");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.sourceGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", context.sourceGroupId],
        });
      }
      if (context?.targetGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", context.targetGroupId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const selectedGroup =
    groups.find((g) => g.id === currentGroupId) || groups[0];

  const handleStartRename = (id: string) => {
    setRenamingId(id);
  };

  const handleFinishRename = () => {
    setRenamingId(null);
  };

  const handleDeleteBookmark = useCallback(
    (id: string) => {
      bulkDeleteMutation.mutate({
        ids: [id],
        _groupId: currentGroupId ?? undefined,
      });
    },
    [bulkDeleteMutation, currentGroupId]
  );

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      if (!debouncedSearchQuery) return true;
      return (
        b.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        b.url?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    });
  }, [bookmarks, debouncedSearchQuery]);

  const handleEnterSelectionMode = useCallback((initialId?: string) => {
    setSelectionMode(true);
    if (initialId) {
      setSelectedIds(new Set([initialId]));
    }
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleToggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredBookmarks.map((b) => b.id)));
  }, [filteredBookmarks]);

  const handleCopyUrls = useCallback(() => {
    const urls = bookmarks
      .filter((b) => selectedIds.has(b.id) && b.url)
      .map((b) => b.url)
      .join("\n");

    if (urls) {
      navigator.clipboard.writeText(urls);
      toast.success(`Copied ${selectedIds.size} URLs`);
    } else {
      toast.error("No URLs to copy");
    }
  }, [bookmarks, selectedIds]);

  const handleConfirmMove = useCallback(
    (targetGroupId: string) => {
      bulkMoveMutation.mutate({
        ids: Array.from(selectedIds),
        targetGroupId,
        _sourceGroupId: currentGroupId ?? undefined,
      });
      handleExitSelectionMode();
      toast.success(`Moved ${selectedIds.size} bookmarks`);
    },
    [bulkMoveMutation, selectedIds, currentGroupId, handleExitSelectionMode]
  );

  const handleConfirmDelete = useCallback(() => {
    bulkDeleteMutation.mutate({
      ids: Array.from(selectedIds),
      _groupId: currentGroupId ?? undefined,
    });
    handleExitSelectionMode();
    toast.success(`Deleted ${selectedIds.size} bookmarks`);
  }, [bulkDeleteMutation, selectedIds, currentGroupId, handleExitSelectionMode]);

  // Refs to store latest values for stable keyboard handler
  const filteredBookmarksRef = useLatestRef(filteredBookmarks);
  const selectedIndexRef = useLatestRef(selectedIndex);
  const hoveredIndexRef = useLatestRef(hoveredIndex);
  const renamingIdRef = useLatestRef(renamingId);
  const handleDeleteBookmarkRef = useLatestRef(handleDeleteBookmark);
  const handleStartRenameRef = useLatestRef(handleStartRename);
  const selectionModeRef = useLatestRef(selectionMode);
  const selectedIdsRef = useLatestRef(selectedIds);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setSelectedIndex(-1);
  }, []);

  const handleSelectGroup = useCallback(
    (id: string) => {
      setSelectedGroupId(id);
      setSelectedIndex(-1);
      handleExitSelectionMode();
    },
    [handleExitSelectionMode]
  );

  const handleAddBookmark = useCallback(
    (value: string) => {
      if (!currentGroupId) return;

      const trimmedValue = value.trim();
      if (!trimmedValue) return;

      const colorResult = parseColor(trimmedValue);

      if (colorResult.isColor) {
        createBookmarkMutation.mutate({
          title: colorResult.original || trimmedValue,
          url: "",
          type: "color",
          color: colorResult.hex,
          groupId: currentGroupId,
        });
      } else if (!trimmedValue.includes("\n") && isUrl(trimmedValue)) {
        const url = normalizeUrl(trimmedValue);
        createBookmarkMutation.mutate({
          title: new URL(url).hostname.replace("www.", ""),
          url,
          type: "link",
          groupId: currentGroupId,
        });
      } else {
        createBookmarkMutation.mutate({
          title: trimmedValue,
          url: "",
          type: "text",
          groupId: currentGroupId,
        });
      }

      setSearchQuery("");
      setSelectedIndex(-1);
    },
    [currentGroupId, createBookmarkMutation]
  );

  const handleCreateGroup = useCallback(
    (name: string) => {
      const palette = [
        "#3E63DD",
        "#208368",
        "#FFDC00",
        "#CE2C31",
        "#53195D",
        "#0086F0FA",
        "#838383",
        "#74B06F",
        "#4A90D9",
        "#E6A23C",
        "#9B59B6",
        "#E74C3C",
        "#202020",
      ];
      const usedColors = new Set(groups.map((g) => g.color));
      const availableColors = palette.filter((c) => !usedColors.has(c));
      const color =
        availableColors.length > 0
          ? availableColors[0]
          : palette[groups.length % palette.length];

      createGroupMutation.mutate(
        { name, color },
        {
          onSuccess: (newGroup) => {
            setSelectedGroupId(newGroup.id);
          },
        }
      );
    },
    [createGroupMutation, groups]
  );

  const handleDeleteGroup = useCallback(
    (id: string) => {
      deleteGroupMutation.mutate({ id });
    },
    [deleteGroupMutation]
  );

  const handleRenameBookmark = useCallback(
    (id: string, newTitle: string) => {
      updateBookmarkMutation.mutate({
        id,
        title: newTitle,
        _sourceGroupId: currentGroupId ?? undefined,
      });
    },
    [updateBookmarkMutation, currentGroupId]
  );

  const handleMoveBookmark = useCallback(
    (id: string, targetGroupId: string) => {
      updateBookmarkMutation.mutate({
        id,
        groupId: targetGroupId,
        _sourceGroupId: currentGroupId ?? undefined,
      });
    },
    [updateBookmarkMutation, currentGroupId]
  );

  const handleRefetchBookmark = useCallback(
    (id: string) => {
      refetchBookmarkMutation.mutate({ id });
    },
    [refetchBookmarkMutation]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (renamingIdRef.current) return;

      // Allow all keyboard events when focus is on the search input
      if (document.activeElement === inputRef.current) {
        return;
      }

      // Allow standard text editing shortcuts when focus is on any input/textarea
      const isInputFocused =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;
      if (isInputFocused && (e.metaKey || e.ctrlKey)) {
        return;
      }

      const bookmarks = filteredBookmarksRef.current;
      const inSelectionMode = selectionModeRef.current;

      if (e.key === "Escape" && inSelectionMode) {
        e.preventDefault();
        handleExitSelectionMode();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "a" && inSelectionMode) {
        e.preventDefault();
        handleSelectAll();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, bookmarks.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
        return;
      }

      const activeIndex =
        hoveredIndexRef.current >= 0
          ? hoveredIndexRef.current
          : selectedIndexRef.current;
      if (activeIndex < 0 || activeIndex >= bookmarks.length) return;
      const activeBookmark = bookmarks[activeIndex];
      if (!activeBookmark) return;

      if (e.key === " " && inSelectionMode) {
        e.preventDefault();
        handleToggleSelection(activeBookmark.id);
        return;
      }

      if (e.key === "Enter" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        if (activeBookmark.url) {
          window.open(activeBookmark.url, "_blank");
        } else {
          const textToCopy = activeBookmark.color || activeBookmark.title;
          navigator.clipboard.writeText(textToCopy ?? "");
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "c") {
        e.preventDefault();
        const textToCopy =
          activeBookmark.url || activeBookmark.color || activeBookmark.title;
        navigator.clipboard.writeText(textToCopy ?? "");
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        handleStartRenameRef.current(activeBookmark.id);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "Backspace") {
        e.preventDefault();
        handleDeleteBookmarkRef.current(activeBookmark.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleExitSelectionMode, handleSelectAll, handleToggleSelection]);

  if (!selectedGroup) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onDeleteGroup={handleDeleteGroup}
        userName={session.user.name}
        userEmail={session.user.email}
      />
      <main className="mx-auto w-full max-w-2xl px-5 py-20">
        <BookmarkInput
          ref={inputRef}
          value={searchQuery}
          onChange={handleSearchChange}
          onSubmit={handleAddBookmark}
        />
        {bookmarksQuery.isPending && !bookmarksQuery.data ? (
          <BookmarkListSkeleton />
        ) : (
          <BookmarkList
            bookmarks={filteredBookmarks}
            groups={groups}
            onDelete={handleDeleteBookmark}
            onRename={handleRenameBookmark}
            onMove={handleMoveBookmark}
            onRefetch={handleRefetchBookmark}
            currentGroupId={currentGroupId || ""}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            renamingId={renamingId}
            onStartRename={handleStartRename}
            onFinishRename={handleFinishRename}
            onHoverChange={setHoveredIndex}
            hoveredIndex={hoveredIndex}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelection={handleToggleSelection}
            onEnterSelectionMode={handleEnterSelectionMode}
            onBulkMove={handleConfirmMove}
            onBulkDelete={handleConfirmDelete}
          />
        )}
        {selectionMode && selectedIds.size > 0 && (
          <MultiSelectToolbar
            selectedCount={selectedIds.size}
            onSelectAll={handleSelectAll}
            onMove={() => setMoveDialogOpen(true)}
            onCopyUrls={handleCopyUrls}
            onDelete={() => setDeleteDialogOpen(true)}
            onClose={handleExitSelectionMode}
          />
        )}
        <BulkMoveDialog
          open={moveDialogOpen}
          onOpenChange={setMoveDialogOpen}
          groups={groups}
          currentGroupId={currentGroupId || ""}
          selectedCount={selectedIds.size}
          onConfirm={handleConfirmMove}
        />
        <BulkDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          count={selectedIds.size}
          onConfirm={handleConfirmDelete}
        />
      </main>
    </div>
  );
}
