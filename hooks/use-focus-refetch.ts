"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import type { GroupItem } from "@/lib/schema";

const COOLDOWN_MS = 30 * 1000;

export function useFocusRefetch(groups: GroupItem[]) {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef<number>(0);

  const refresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshRef.current < COOLDOWN_MS) return;

    lastRefreshRef.current = now;
    queryClient.invalidateQueries({ queryKey: orpc.group.key() });
    for (const group of groups) {
      queryClient.invalidateQueries({
        queryKey: orpc.bookmark.list.key({ input: { groupId: group.id } }),
        refetchType: "all",
      });
    }
  }, [queryClient, groups]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", refresh);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh]);
}
