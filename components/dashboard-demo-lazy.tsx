"use client";

import dynamic from "next/dynamic";

export const DashboardDemoLazy = dynamic(
  () => import("@/components/dashboard-demo").then((m) => m.DashboardDemo),
  {
    ssr: false,
    loading: () => (
      <div className="-mx-4 sm:mx-0 sm:w-[80vw] lg:w-[50vw] sm:relative sm:left-1/2 sm:-translate-x-1/2 h-[540px] sm:rounded-xl border-y border-border sm:border bg-background" />
    ),
  },
);
