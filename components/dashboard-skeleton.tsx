import { HeaderSkeleton } from "@/components/header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <HeaderSkeleton />
      <main className="mx-auto w-full max-w-2xl px-5 py-20">
        <Skeleton className="h-8 w-full mb-8 rounded-lg" />
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[46px] w-full rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

export function BookmarkListSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-[46px] w-full rounded-xl" />
      ))}
    </div>
  );
}
