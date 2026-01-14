import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { Landing } from "@/components/landing";
import { DashboardContent } from "@/components/dashboard-content";
import type { GroupItem, BookmarkItem } from "@/lib/schema";

async function HomeContent() {
  const session = await getSession();

  if (!session) {
    return <Landing />;
  }

  const groups = await db.group.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
  });

  const groupItems: GroupItem[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    bookmarkCount: g._count.bookmarks,
  }));

  const defaultGroupId = groups[0]?.id;
  let initialBookmarks: BookmarkItem[] = [];

  if (defaultGroupId) {
    const bookmarks = await db.bookmark.findMany({
      where: {
        userId: session.user.id,
        groupId: defaultGroupId,
      },
      orderBy: { createdAt: "desc" },
    });

    initialBookmarks = bookmarks.map((b) => ({
      id: b.id,
      title: b.title,
      url: b.url,
      favicon: b.favicon,
      type: b.type,
      color: b.color,
      groupId: b.groupId,
      createdAt: b.createdAt,
    }));
  }

  return (
    <DashboardContent
      session={session}
      initialGroups={groupItems}
      initialBookmarks={initialBookmarks}
    />
  );
}

export default function Page() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
