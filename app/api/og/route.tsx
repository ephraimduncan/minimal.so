import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getPublicProfileData } from "@/server/queries/public-profile";
import { slugify } from "@/lib/utils";

const colors = {
  bg: "#ffffff",
  text: "#18181b",
  secondary: "#71717a",
};

function LogoSvg(size: number) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={colors.text}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12.432 17.949c.863 1.544 2.589 1.976 4.13 1.112c1.54 -.865 1.972 -2.594 1.048 -4.138c-.185 -.309 -.309 -.556 -.494 -.74c.247 .06 .555 .06 .925 .06c1.726 0 2.959 -1.234 2.959 -2.963c0 -1.73 -1.233 -2.965 -3.02 -2.965c-.37 0 -.617 0 -.925 .062c.185 -.185 .308 -.432 .493 -.74c.863 -1.545 .431 -3.274 -1.048 -4.138c-1.541 -.865 -3.205 -.433 -4.13 1.111c-.185 .309 -.308 .556 -.432 .803c-.123 -.247 -.246 -.494 -.431 -.803c-.802 -1.605 -2.528 -2.038 -4.007 -1.173c-1.541 .865 -1.973 2.594 -1.048 4.137c.185 .31 .308 .556 .493 .741c-.246 -.061 -.555 -.061 -.924 -.061c-1.788 0 -3.021 1.235 -3.021 2.964c0 1.729 1.233 2.964 3.02 2.964" />
      <path d="M4.073 21c4.286 -2.756 5.9 -5.254 7.927 -9" />
    </svg>
  );
}

async function getImageOptions() {
  const fontData = await readFile(
    join(process.cwd(), "assets/geist-sans-semibold.ttf"),
  );
  return {
    width: 1200,
    height: 630,
    fonts: [{ name: "Geist", data: fontData, style: "normal" as const, weight: 600 as const }],
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800" },
  };
}

function RootOgImage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: colors.bg,
        fontFamily: "Geist",
        gap: "24px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {LogoSvg(48)}
        <span style={{ fontSize: "56px", fontWeight: 600, color: colors.text }}>
          minimal.so
        </span>
      </div>
      <div style={{ fontSize: "32px", color: colors.secondary }}>
        simple bookmarking for everyone
      </div>
    </div>
  );
}

function ProfileOgImage({
  heroText,
  subtitle,
  groupColor,
}: {
  heroText: string;
  subtitle: string;
  groupColor: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: "64px 64px 96px 64px",
        backgroundColor: colors.bg,
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            maxWidth: "100%",
          }}
        >
          {groupColor && (
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: groupColor,
                flexShrink: 0,
              }}
            />
          )}
          <div
            style={{
              fontSize: "64px",
              fontWeight: 600,
              color: colors.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: groupColor ? "960px" : "1040px",
            }}
          >
            {heroText}
          </div>
        </div>

        <div style={{ fontSize: "36px", color: colors.secondary }}>
          {subtitle}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {LogoSvg(32)}
          <span style={{ fontSize: "36px", fontWeight: 600, color: colors.text }}>
            minimal.so
          </span>
        </div>
        <div style={{ fontSize: "28px", color: colors.secondary }}>
          simple bookmarking for everyone
        </div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get("username");

  if (!username) {
    return new ImageResponse(<RootOgImage />, await getImageOptions());
  }

  const data = await getPublicProfileData(username);
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const groupParam = searchParams.get("group");
  const groups = data.groups as Array<{ name: string; color: string }>;
  const group = groupParam
    ? groups.find(
      (entry) => slugify(entry.name) === groupParam || entry.name === groupParam,
    )
    : undefined;
  const heroText = group ? group.name : data.user.name;
  const subtitle = group
    ? `by @${data.user.username}`
    : `@${data.user.username}`;

  return new ImageResponse(
    <ProfileOgImage
      heroText={heroText}
      subtitle={subtitle}
      groupColor={group?.color ?? null}
    />,
    await getImageOptions(),
  );
}
