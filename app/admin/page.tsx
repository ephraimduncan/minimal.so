import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SignupChart } from "./signup-chart";

async function AdminData() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (
    !adminEmail ||
    session.user.email.toLowerCase() !== adminEmail.toLowerCase()
  ) {
    notFound();
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalBookmarks,
    totalGroups,
    publicProfiles,
    publicGroups,
    publicBookmarks,
    newUsers7d,
    newBookmarks7d,
    bookmarksByType,
    topUsers,
    recentUsers,
  ] = await Promise.all([
    db.user.count(),
    db.bookmark.count(),
    db.group.count(),
    db.user.count({ where: { isProfilePublic: true } }),
    db.group.count({ where: { isPublic: true } }),
    db.bookmark.count({ where: { isPublic: true } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.bookmark.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.bookmark.groupBy({ by: ["type"], _count: true }),
    db.user.findMany({
      select: {
        name: true,
        email: true,
        createdAt: true,
        _count: { select: { bookmarks: true } },
      },
      orderBy: { bookmarks: { _count: "desc" } },
      take: 10,
    }),
    db.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const signupsByDate = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    signupsByDate.set(d.toISOString().slice(0, 10), 0);
  }
  for (const user of recentUsers) {
    const dateKey = user.createdAt.toISOString().slice(0, 10);
    signupsByDate.set(dateKey, (signupsByDate.get(dateKey) ?? 0) + 1);
  }
  const signupData = Array.from(signupsByDate, ([date, count]) => ({
    date,
    count,
  }));

  const avgBookmarks =
    totalUsers > 0 ? (totalBookmarks / totalUsers).toFixed(1) : "0";

  const stats = [
    { label: "Total Users", value: totalUsers },
    { label: "Total Bookmarks", value: totalBookmarks },
    { label: "Total Groups", value: totalGroups },
    { label: "Public Profiles", value: publicProfiles },
    { label: "Public Groups", value: publicGroups },
    { label: "Public Bookmarks", value: publicBookmarks },
    { label: "New Users (7d)", value: newUsers7d },
    { label: "New Bookmarks (7d)", value: newBookmarks7d },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card size="sm">
        <CardHeader>
          <CardDescription>Avg Bookmarks per User</CardDescription>
          <CardTitle className="text-2xl">{avgBookmarks}</CardTitle>
        </CardHeader>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Bookmark Types</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {bookmarksByType.map((entry) => (
              <li key={entry.type} className="flex justify-between">
                <span className="capitalize">{entry.type}</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {entry._count}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Signups (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <SignupChart data={signupData} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Top 10 Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Bookmarks</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((user) => (
                <TableRow key={user.email}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell className="text-right">
                    {user._count.bookmarks}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {user.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        Back to dashboard
      </Link>

      <h1 className="mb-2 text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
        Admin
      </h1>
      <p className="mb-8 text-sm text-zinc-500">Usage statistics</p>

      <Suspense>
        <AdminData />
      </Suspense>
    </div>
  );
}
