import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PublicProfileContent } from "./public-profile-content";

interface PageProps {
  params: Promise<{ username: string }>;
}

async function PublicProfileData({
  paramsPromise,
}: {
  paramsPromise: Promise<{ username: string }>;
}) {
  const { username } = await paramsPromise;

  const user = await db.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      id: true,
      name: true,
      image: true,
      username: true,
      bio: true,
      github: true,
      twitter: true,
      website: true,
      isProfilePublic: true,
    },
  });

  if (!user || !user.isProfilePublic) {
    redirect("/dashboard");
  }

  const groups = await db.group.findMany({
    where: { userId: user.id, isPublic: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, color: true },
  });

  const publicGroupIds = groups.map((g) => g.id);

  const bookmarks = await db.bookmark.findMany({
    where: {
      userId: user.id,
      OR: [
        ...(publicGroupIds.length > 0
          ? [{ groupId: { in: publicGroupIds }, isPublic: { not: false } }]
          : []),
        { isPublic: true },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      url: true,
      favicon: true,
      type: true,
      color: true,
      groupId: true,
      createdAt: true,
    },
  });

  return (
    <PublicProfileContent
      user={user}
      groups={groups}
      bookmarks={bookmarks}
    />
  );
}

export default function PublicProfilePage({ params }: PageProps) {
  return (
    <Suspense>
      <PublicProfileData paramsPromise={params} />
    </Suspense>
  );
}
