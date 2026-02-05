import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProfileData } from "@/server/queries/public-profile";
import { PublicProfileContent } from "./public-profile-content";

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ group?: string | string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicProfileData(username);

  if (!data) return {};

  const title = `${data.user.name} (@${data.user.username}) — bmrks`;
  const description =
    data.user.bio || `Public bookmarks shared by ${data.user.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
    },
    twitter: {
      card: "summary",
      title,
      description,
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
  const { username } = await paramsPromise;
  const data = await getPublicProfileData(username);

  if (!data) {
    redirect("/dashboard");
  }

  const resolvedSearchParams = searchParamsPromise
    ? await searchParamsPromise
    : undefined;
  const activeGroupParam = Array.isArray(resolvedSearchParams?.group)
    ? resolvedSearchParams?.group[0]
    : resolvedSearchParams?.group;

  return (
    <PublicProfileContent
      profileUsername={username}
      user={data.user}
      groups={data.groups}
      bookmarks={data.bookmarks}
      activeGroupId={activeGroupParam}
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
