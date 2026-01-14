"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { GroupItem } from "@/lib/schema";

const COOLDOWN_MS = 30 * 1000;

export function useFocusRefetch(groups: GroupItem[]) {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      const now = Date.now();
      if (now - lastRefreshRef.current < COOLDOWN_MS) return;

      lastRefreshRef.current = now;

      queryClient.invalidateQueries({ queryKey: ["groups"] });

      for (const group of groups) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", group.id],
          refetchType: "all",
        });
      }
    };

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRefreshRef.current < COOLDOWN_MS) return;

      lastRefreshRef.current = now;

      queryClient.invalidateQueries({ queryKey: ["groups"] });

      for (const group of groups) {
        queryClient.invalidateQueries({
          queryKey: ["bookmarks", group.id],
          refetchType: "all",
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [queryClient, groups]);
}
