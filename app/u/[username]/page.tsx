import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProfileData } from "@/server/queries/public-profile";
import { getSession } from "@/lib/auth-server";
import { PublicProfileContent } from "./public-profile-content";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ group?: string | string[] }>;
}

function resolveGroupParam(group?: string | string[]) {
  return Array.isArray(group) ? group[0] : group;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const [{ username }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);
  const data = await getPublicProfileData(username);

  if (!data) return {};

  const group = resolveGroupParam(resolvedSearchParams?.group);

  const title = `${data.user.name} (@${data.user.username}) — bmrks`;
  const description =
    data.user.bio || `Public bookmarks shared by ${data.user.name}`;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://minimal.so";
  const ogParams = new URLSearchParams({ username });
  if (group) ogParams.set("group", group);
  const ogUrl = `${baseUrl}/api/og?${ogParams.toString()}`;

  const pageUrl = group
    ? `${baseUrl}/u/${username}?group=${encodeURIComponent(group)}`
    : `${baseUrl}/u/${username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: pageUrl,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

async function PublicProfileData({
  paramsPromise,
  searchParamsPromise,
}: {
  paramsPromise: Promise<{ username: string }>;
  searchParamsPromise?: Promise<{ group?: string | string[] }>;
}) {
  const [{ username }, session] = await Promise.all([
    paramsPromise,
    getSession(),
  ]);
  const data = await getPublicProfileData(username);

  if (!data) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = await searchParamsPromise;
  const activeGroupParam = resolveGroupParam(resolvedSearchParams?.group);

  return (
    <PublicProfileContent
      profileUsername={username}
      user={data.user}
      groups={data.groups}
      bookmarks={data.bookmarks}
      activeGroup={activeGroupParam}
      isLoggedIn={!!session}
    />
  );
}

export default function PublicProfilePage({ params, searchParams }: PageProps) {
  return (
    <Suspense>
      <PublicProfileData
        paramsPromise={params}
        searchParamsPromise={searchParams}
      />
    </Suspense>
  );
}
