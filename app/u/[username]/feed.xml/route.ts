import { NextResponse } from "next/server";
import { getPublicProfileData } from "@/server/queries/public-profile";
import { buildRssFeed } from "@/lib/feed";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const data = await getPublicProfileData(username);

  if (!data) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://minimal.so";
  const xml = buildRssFeed(data.user, data.bookmarks, baseUrl);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
