import { NextResponse } from "next/server";
import { getPublicProfileData } from "@/server/queries/public-profile";
import { buildAtomFeed } from "@/lib/feed";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const data = await getPublicProfileData(username);

  if (!data) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const groupName = searchParams.get("group");

  // Validate group exists if provided
  const validGroup = groupName && data.groups.some((g) => g.name === groupName)
    ? groupName
    : undefined;

  // Filter bookmarks by group if specified
  const bookmarks = validGroup
    ? data.bookmarks.filter((b) => b.groupName === validGroup)
    : data.bookmarks;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://minimal.so";
  const xml = buildAtomFeed(data.user, bookmarks, baseUrl, validGroup);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
