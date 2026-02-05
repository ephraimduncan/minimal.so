"use client";

import dynamic from "next/dynamic";

export const DashboardDemoLazy = dynamic(
  () => import("@/components/dashboard-demo").then((m) => m.DashboardDemo),
  {
    ssr: false,
    loading: () => (
      <div className="h-[540px] rounded-xl border border-border bg-background" />
    ),
  },
);
