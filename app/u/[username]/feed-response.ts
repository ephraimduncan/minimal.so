import { NextResponse } from "next/server";
import { getPublicProfileData } from "@/server/queries/public-profile";
import { buildRssFeed, buildAtomFeed } from "@/lib/feed";
import { slugify } from "@/lib/utils";

const FEED_FORMATS = {
  rss: {
    builder: buildRssFeed,
    contentType: "application/rss+xml; charset=utf-8",
  },
  atom: {
    builder: buildAtomFeed,
    contentType: "application/atom+xml; charset=utf-8",
  },
} as const;

export async function generateFeedResponse(
  request: Request,
  username: string,
  format: keyof typeof FEED_FORMATS,
) {
  const data = await getPublicProfileData(username);

  if (!data?.user.username) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupSlug = searchParams.get("group") ?? undefined;
  const matchedGroup = groupSlug
    ? data.groups.find((g) => slugify(g.name) === groupSlug)
    : undefined;

  const bookmarks = matchedGroup
    ? data.bookmarks.filter((b) => b.groupName === matchedGroup.name)
    : data.bookmarks;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://minimal.so";
  const user = {
    name: data.user.name,
    username: data.user.username,
    bio: data.user.bio,
  };
  const { builder, contentType } = FEED_FORMATS[format];
  const xml = builder(user, bookmarks, baseUrl, matchedGroup?.name, matchedGroup ? groupSlug : undefined);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
