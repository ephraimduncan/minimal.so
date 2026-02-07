"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Header } from "@/components/header";
import { BookmarkInput } from "@/components/bookmark-input";
import { BookmarkList } from "@/components/bookmark-list";
import { BookmarkListSkeleton } from "@/components/dashboard-skeleton";

const MultiSelectToolbar = dynamic(
  () => import("@/components/multi-select-toolbar").then((m) => m.MultiSelectToolbar),
  { ssr: false }
);
const BulkMoveDialog = dynamic(
  () => import("@/components/bulk-move-dialog").then((m) => m.BulkMoveDialog),
  { ssr: false }
);
const BulkDeleteDialog = dynamic(
  () => import("@/components/bulk-delete-dialog").then((m) => m.BulkDeleteDialog),
  { ssr: false }
);
import { parseColor, isUrl, normalizeUrl, slugify } from "@/lib/utils";
import { client, orpc } from "@/lib/orpc";
import { useDebounce } from "@/hooks/use-debounce";
import { useFocusRefetch } from "@/hooks/use-focus-refetch";
import { useLatestRef } from "@/lib/hooks/use-latest-ref";
import type { BookmarkType, GroupItem, BookmarkItem } from "@/lib/schema";
import type { Session } from "@/lib/auth";

export interface ProfileData {
  username: string | null;
  bio: string | null;
  github: string | null;
  twitter: string | null;
  website: string | null;
  isProfilePublic: boolean;
}

interface DashboardContentProps {
  session: NonNullable<Session>;
  initialGroups: GroupItem[];
  initialBookmarks: BookmarkItem[];
  profile: ProfileData;
}

const groupListKey = () =>
  orpc.group.list.queryKey() as readonly unknown[];
const bookmarkListKey = (groupId?: string | null) =>
  orpc.bookmark.list.queryKey({ input: { groupId: groupId ?? undefined } }) as readonly unknown[];

export function DashboardContent({
  session,
  initialGroups,
  initialBookmarks,
  profile,
}: DashboardContentProps) {
  const queryClient = useQueryClient();

  const [groupSlug, setGroupSlug] = useQueryState('group');
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
    ...orpc.group.list.queryOptions(),
    initialData: initialGroups,
    initialDataUpdatedAt: Date.now(),
  });

  const groups = useMemo(() => groupsQuery.data ?? [], [groupsQuery.data]);

  const hasUsername = profile.username !== null;
  const publicGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.isPublic).map((g) => g.id)),
    [groups],
  );

  useFocusRefetch(groups);

  const groupIdBySlug = useMemo(
    () => new Map(groups.map((g) => [slugify(g.name), g.id])),
    [groups],
  );
  const groupIdBySlugRef = useLatestRef(groupIdBySlug);

  const selectedGroupId = groupSlug ? (groupIdBySlug.get(groupSlug) ?? null) : null;

  const currentGroupId = selectedGroupId ?? groups[0]?.id ?? null;

  const bookmarksQuery = useQuery({
    ...orpc.bookmark.list.queryOptions({ input: { groupId: currentGroupId ?? undefined } }),
    initialData:
      currentGroupId === initialGroups[0]?.id ? initialBookmarks : undefined,
    initialDataUpdatedAt: Date.now(),
    enabled: !!currentGroupId,
  });

  const bookmarks = useMemo(
    () => bookmarksQuery.data ?? [],
    [bookmarksQuery.data]
  );

  useEffect(() => {
    setSelectedIndex(-1);
    setHoveredIndex(-1);
  }, [bookmarks, currentGroupId]);

  const createBookmarkMutation = useMutation({
    ...orpc.bookmark.create.mutationOptions(),
    onMutate: async (newBookmark) => {
      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: newBookmark.groupId } }),
      });
      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(newBookmark.groupId)
      );
      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());

      const optimisticBookmark: BookmarkItem = {
        id: `temp-${Date.now()}`,
        title: newBookmark.title,
        url: newBookmark.url || null,
        favicon: null,
        type: newBookmark.type ?? "link",
        color: newBookmark.color || null,
        groupId: newBookmark.groupId,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<BookmarkItem[]>(
        bookmarkListKey(newBookmark.groupId),
        (old) => [optimisticBookmark, ...(old || [])]
      );

      queryClient.setQueryData<GroupItem[]>(groupListKey(), (old) =>
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
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.groupId),
          context.previousBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      toast.error("Failed to create bookmark");
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.bookmark.list.key({ input: { groupId: variables.groupId } }),
      });
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
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
      const sourceGroupId = _sourceGroupId ?? currentGroupId;

      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });
      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: sourceGroupId ?? undefined } }),
      });
      if (isMove) {
        await queryClient.cancelQueries({
          queryKey: orpc.bookmark.list.queryKey({ input: { groupId: targetGroupId } }),
        });
      }

      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());

      if (isMove) {
        const previousSourceBookmarks = queryClient.getQueryData<BookmarkItem[]>(
          bookmarkListKey(_sourceGroupId)
        );
        const previousTargetBookmarks = queryClient.getQueryData<BookmarkItem[]>(
          bookmarkListKey(targetGroupId)
        );

        const movedBookmark = previousSourceBookmarks?.find((b) => b.id === id);

        if (movedBookmark) {
          queryClient.setQueryData<BookmarkItem[]>(
            bookmarkListKey(_sourceGroupId),
            (old) => old?.filter((b) => b.id !== id) ?? []
          );

          queryClient.setQueryData<BookmarkItem[]>(
            bookmarkListKey(targetGroupId),
            (old) => [
              { ...movedBookmark, groupId: targetGroupId },
              ...(old ?? []),
            ]
          );

          queryClient.setQueryData<GroupItem[]>(groupListKey(), (old) =>
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

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(sourceGroupId)
      );

      queryClient.setQueryData<BookmarkItem[]>(
        bookmarkListKey(sourceGroupId),
        (old) => old?.map((b) => (b.id === id ? { ...b, ...updates } : b)) ?? []
      );

      return { previousBookmarks, sourceGroupId, previousGroups };
    },
    onError: (_err, data, context) => {
      if (
        context?.previousSourceBookmarks !== undefined &&
        context?.sourceGroupId
      ) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.sourceGroupId),
          context.previousSourceBookmarks
        );
      }
      if (
        context?.previousTargetBookmarks !== undefined &&
        context?.targetGroupId
      ) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.targetGroupId),
          context.previousTargetBookmarks
        );
      }
      if (context?.previousBookmarks !== undefined && context?.sourceGroupId) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.sourceGroupId),
          context.previousBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      toast.error("Failed to update bookmark");
    },
    onSettled: (_data, _error, data, context) => {
      if (context?.sourceGroupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.sourceGroupId } }),
        });
      }
      if (context?.targetGroupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.targetGroupId } }),
        });
      }
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
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
      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });

      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());
      const previousGroupSlug = groupSlug;

      const optimisticGroup: GroupItem = {
        id: newGroup._optimisticId ?? `temp-${Date.now()}`,
        name: newGroup.name,
        color: newGroup.color,
        bookmarkCount: 0,
      };

      queryClient.setQueryData<GroupItem[]>(groupListKey(), (old) => [
        ...(old ?? []),
        optimisticGroup,
      ]);

      setGroupSlug(slugify(newGroup.name));
      setSelectedIndex(-1);

      return {
        previousGroups,
        previousGroupSlug,
        optimisticId: optimisticGroup.id,
      };
    },
    onError: (_err, _newGroup, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      if (context?.previousGroupSlug !== undefined) {
        setGroupSlug(context.previousGroupSlug);
      }
      toast.error("Failed to create group");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
    },
  });

  const deleteGroupMutation = useMutation({
    ...orpc.group.delete.mutationOptions(),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });

      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());
      const previousGroupSlug = groupSlug;

      queryClient.setQueryData<GroupItem[]>(
        groupListKey(),
        (old) => old?.filter((g) => g.id !== data.id) ?? []
      );

      if (currentGroupId === data.id) {
        const remainingGroups =
          previousGroups?.filter((g) => g.id !== data.id) ?? [];
        setGroupSlug(remainingGroups[0] ? slugify(remainingGroups[0].name) : null);
        setSelectedIndex(-1);
      }

      return { previousGroups, previousGroupSlug, deletedId: data.id };
    },
    onError: (_err, _data, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      if (context?.previousGroupSlug !== undefined) {
        setGroupSlug(context.previousGroupSlug);
      }
      toast.error("Failed to delete group");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
    },
  });

  const refetchBookmarkMutation = useMutation({
    mutationFn: (data: { id: string; groupId?: string }) =>
      client.bookmark.refetch({ id: data.id }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: orpc.bookmark.list.key({ input: { groupId: variables.groupId } }),
      });
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

      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: groupId ?? undefined } }),
      });
      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(groupId)
      );
      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());

      queryClient.setQueryData<BookmarkItem[]>(
        bookmarkListKey(groupId),
        (old) => old?.filter((b) => !data.ids.includes(b.id)) ?? []
      );

      queryClient.setQueryData<GroupItem[]>(groupListKey(), (old) =>
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
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.groupId),
          context.previousBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      toast.error("Failed to delete bookmarks");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.groupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.groupId } }),
        });
      }
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
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

      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: sourceGroupId ?? undefined } }),
      });
      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: targetGroupId } }),
      });
      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });

      const previousSourceBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(sourceGroupId)
      );
      const previousTargetBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(targetGroupId)
      );
      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());

      const movedBookmarks = previousSourceBookmarks?.filter((b) =>
        ids.includes(b.id)
      );

      if (movedBookmarks) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(sourceGroupId),
          (old) => old?.filter((b) => !ids.includes(b.id)) ?? []
        );

        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(targetGroupId),
          (old) => [
            ...movedBookmarks.map((b) => ({ ...b, groupId: targetGroupId })),
            ...(old ?? []),
          ]
        );

        queryClient.setQueryData<GroupItem[]>(groupListKey(), (old) =>
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
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.sourceGroupId),
          context.previousSourceBookmarks
        );
      }
      if (context?.previousTargetBookmarks && context?.targetGroupId) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.targetGroupId),
          context.previousTargetBookmarks
        );
      }
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      toast.error("Failed to move bookmarks");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.sourceGroupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.sourceGroupId } }),
        });
      }
      if (context?.targetGroupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.targetGroupId } }),
        });
      }
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
    },
  });

  const setVisibilityMutation = useMutation({
    ...orpc.bookmark.setVisibility.mutationOptions(),
    onMutate: async (data) => {
      const groupId = currentGroupId;
      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: groupId ?? undefined } }),
      });

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(groupId)
      );

      queryClient.setQueryData<BookmarkItem[]>(
        bookmarkListKey(groupId),
        (old) =>
          old?.map((b) =>
            b.id === data.id ? { ...b, isPublic: data.isPublic } : b,
          ) ?? [],
      );

      return { previousBookmarks, groupId };
    },
    onError: (_err, _data, context) => {
      if (context?.previousBookmarks && context?.groupId) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.groupId),
          context.previousBookmarks,
        );
      }
      toast.error("Failed to update visibility");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.groupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.groupId } }),
        });
      }
    },
  });

  const bulkSetVisibilityMutation = useMutation({
    ...orpc.bookmark.bulkSetVisibility.mutationOptions(),
    onMutate: async (data) => {
      const groupId = currentGroupId;
      await queryClient.cancelQueries({
        queryKey: orpc.bookmark.list.queryKey({ input: { groupId: groupId ?? undefined } }),
      });

      const previousBookmarks = queryClient.getQueryData<BookmarkItem[]>(
        bookmarkListKey(groupId)
      );

      queryClient.setQueryData<BookmarkItem[]>(
        bookmarkListKey(groupId),
        (old) =>
          old?.map((b) =>
            data.ids.includes(b.id) ? { ...b, isPublic: data.isPublic } : b,
          ) ?? [],
      );

      return { previousBookmarks, groupId };
    },
    onError: (_err, _data, context) => {
      if (context?.previousBookmarks && context?.groupId) {
        queryClient.setQueryData<BookmarkItem[]>(
          bookmarkListKey(context.groupId),
          context.previousBookmarks,
        );
      }
      toast.error("Failed to update visibility");
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.groupId) {
        queryClient.invalidateQueries({
          queryKey: orpc.bookmark.list.key({ input: { groupId: context.groupId } }),
        });
      }
    },
  });

  const setGroupVisibilityMutation = useMutation({
    ...orpc.group.setVisibility.mutationOptions(),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: orpc.group.list.queryKey() });

      const previousGroups = queryClient.getQueryData<GroupItem[]>(groupListKey());

      queryClient.setQueryData<GroupItem[]>(groupListKey(), (old) =>
        old?.map((g) =>
          g.id === data.id ? { ...g, isPublic: data.isPublic } : g,
        ),
      );

      return { previousGroups };
    },
    onSuccess: (_data, variables) => {
      toast.success(variables.isPublic ? "Group is now public" : "Group is now private");
    },
    onError: (_err, _data, context) => {
      if (context?.previousGroups) {
        queryClient.setQueryData<GroupItem[]>(groupListKey(), context.previousGroups);
      }
      toast.error("Failed to update group visibility");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orpc.group.key() });
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
  const groupsRef = useLatestRef(groups);
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
      const group = groupsRef.current.find((g) => g.id === id);
      setGroupSlug(group ? slugify(group.name) : null);
      setSelectedIndex(-1);
      handleExitSelectionMode();
    },
    [setGroupSlug, handleExitSelectionMode]
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

      createGroupMutation.mutate({ name, color });
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
      refetchBookmarkMutation.mutate({ id, groupId: currentGroupId ?? undefined });
    },
    [refetchBookmarkMutation, currentGroupId]
  );

  const handleToggleBookmarkVisibility = useCallback(
    (id: string, currentIsPublic: boolean | null | undefined) => {
      const isInPublicGroup = currentGroupId ? publicGroupIds.has(currentGroupId) : false;
      const isEffectivelyPublic =
        currentIsPublic === true || (isInPublicGroup && currentIsPublic !== false);

      if (isEffectivelyPublic) {
        setVisibilityMutation.mutate({
          id,
          isPublic: isInPublicGroup ? false : null,
        });
        toast.success("Bookmark hidden from public profile");
      } else {
        setVisibilityMutation.mutate({ id, isPublic: true });
        toast.success("Bookmark visible on public profile");
      }
    },
    [setVisibilityMutation, currentGroupId, publicGroupIds],
  );

  const handleBulkMakePublic = useCallback(() => {
    bulkSetVisibilityMutation.mutate({
      ids: Array.from(selectedIds),
      isPublic: true,
    });
    handleExitSelectionMode();
    toast.success(`${selectedIds.size} bookmarks made public`);
  }, [bulkSetVisibilityMutation, selectedIds, handleExitSelectionMode]);

  const handleBulkMakePrivate = useCallback(() => {
    const isInPublicGroup = currentGroupId ? publicGroupIds.has(currentGroupId) : false;
    bulkSetVisibilityMutation.mutate({
      ids: Array.from(selectedIds),
      isPublic: isInPublicGroup ? false : null,
    });
    handleExitSelectionMode();
    toast.success(`${selectedIds.size} bookmarks made private`);
  }, [bulkSetVisibilityMutation, selectedIds, currentGroupId, publicGroupIds, handleExitSelectionMode]);

  const handleToggleGroupVisibility = useCallback(
    (id: string, isPublic: boolean) => {
      setGroupVisibilityMutation.mutate({ id, isPublic });
    },
    [setGroupVisibilityMutation],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (renamingIdRef.current) return;

      if (document.activeElement === inputRef.current) {
        return;
      }

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
    <div className="min-h-dvh bg-background">
      <Header
        groups={groups}
        selectedGroup={selectedGroup}
        onSelectGroup={handleSelectGroup}
        onCreateGroup={handleCreateGroup}
        onDeleteGroup={handleDeleteGroup}
        onToggleGroupVisibility={hasUsername ? handleToggleGroupVisibility : undefined}
        isTogglingGroupVisibility={setGroupVisibilityMutation.isPending}
        userName={session.user.name}
        userEmail={session.user.email}
        username={profile.username}
        profile={profile}
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
            hasUsername={hasUsername}
            publicGroupIds={publicGroupIds}
            onToggleVisibility={handleToggleBookmarkVisibility}
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
            hasUsername={hasUsername}
            onMakePublic={currentGroupId && publicGroupIds.has(currentGroupId) ? undefined : handleBulkMakePublic}
            onMakePrivate={currentGroupId && publicGroupIds.has(currentGroupId) ? handleBulkMakePrivate : undefined}
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
