interface FeedUser {
  name: string;
  username: string | null;
  bio: string | null;
}

interface FeedBookmark {
  title: string;
  url: string | null;
  groupName: string | null;
  updatedAt: Date | string;
}

function formatRssDate(date: Date | string): string {
  return new Date(date).toUTCString();
}

function formatAtomDate(date: Date | string): string {
  return new Date(date).toISOString();
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildRssFeed(
  user: FeedUser,
  bookmarks: FeedBookmark[],
  baseUrl: string
): string {
  const profileUrl = `${baseUrl}/u/${user.username}`;
  const lastBuildDate = bookmarks.length > 0
    ? formatRssDate(bookmarks[0].updatedAt)
    : formatRssDate(new Date());

  const items = bookmarks
    .map((bookmark) => {
      const title = escapeXml(bookmark.title);
      const link = bookmark.url ? escapeXml(bookmark.url) : "";
      const guid = bookmark.url || `${profileUrl}#${bookmark.title}`;
      const pubDate = formatRssDate(bookmark.updatedAt);
      const category = bookmark.groupName ? `<category>${escapeXml(bookmark.groupName)}</category>` : "";

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="${!!bookmark.url}">${escapeXml(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${category}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(user.name)}'s Bookmarks — minimal</title>
    <link>${profileUrl}</link>
    <description>${escapeXml(user.bio || `Public bookmarks shared by ${user.name}`)}</description>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${profileUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export function buildAtomFeed(
  user: FeedUser,
  bookmarks: FeedBookmark[],
  baseUrl: string
): string {
  const profileUrl = `${baseUrl}/u/${user.username}`;
  const feedUrl = `${profileUrl}/feed.atom`;
  const updated = bookmarks.length > 0
    ? formatAtomDate(bookmarks[0].updatedAt)
    : formatAtomDate(new Date());

  const entries = bookmarks
    .map((bookmark) => {
      const title = escapeXml(bookmark.title);
      const id = bookmark.url || `${profileUrl}#${encodeURIComponent(bookmark.title)}`;
      const updated = formatAtomDate(bookmark.updatedAt);
      const category = bookmark.groupName ? `<category term="${escapeXml(bookmark.groupName)}" />` : "";
      const link = bookmark.url
        ? `<link href="${escapeXml(bookmark.url)}" />`
        : "";

      return `  <entry>
    <title>${title}</title>
    <id>${escapeXml(id)}</id>
    <updated>${updated}</updated>
    ${link}
    ${category}
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(user.name)}'s Bookmarks — minimal</title>
  <link href="${profileUrl}" />
  <link href="${feedUrl}" rel="self" />
  <updated>${updated}</updated>
  <author>
    <name>${escapeXml(user.name)}</name>
  </author>
  <id>${profileUrl}</id>
${entries}
</feed>`;
}
