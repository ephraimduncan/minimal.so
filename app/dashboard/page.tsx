import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { DashboardContent } from "@/components/dashboard-content";
import type { GroupItem, BookmarkItem } from "@/lib/schema";

async function DashboardData() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [groups, user] = await Promise.all([
    db.group.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        bio: true,
        github: true,
        twitter: true,
        website: true,
        isProfilePublic: true,
      },
    }),
  ]);

  const groupItems: GroupItem[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    color: g.color,
    isPublic: g.isPublic,
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
      isPublic: b.isPublic,
      groupId: b.groupId,
      createdAt: b.createdAt,
    }));
  }

  return (
    <DashboardContent
      session={session}
      initialGroups={groupItems}
      initialBookmarks={initialBookmarks}
      profile={{
        username: user?.username ?? null,
        bio: user?.bio ?? null,
        github: user?.github ?? null,
        twitter: user?.twitter ?? null,
        website: user?.website ?? null,
        isProfilePublic: user?.isProfilePublic ?? false,
      }}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardData />
    </Suspense>
  );
}
