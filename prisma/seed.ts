import { auth } from "../lib/auth";
import { db } from "../lib/db";

const SAMPLE_EMAIL = "example@minimal.so";

const sampleGroups = [
  { name: "Development", color: "#3B82F6" },
  { name: "Design", color: "#EC4899" },
  { name: "Reading", color: "#F59E0B" },
];

const sampleBookmarks: Record<string, Array<{ title: string; url: string }>> = {
  // Default "Bookmarks" group (created by auth hook)
  Bookmarks: [
    { title: "Google", url: "https://google.com" },
    { title: "GitHub", url: "https://github.com" },
    { title: "Twitter", url: "https://twitter.com" },
  ],
  Development: [
    { title: "MDN Web Docs", url: "https://developer.mozilla.org" },
    { title: "Stack Overflow", url: "https://stackoverflow.com" },
    { title: "Next.js Docs", url: "https://nextjs.org/docs" },
    { title: "Tailwind CSS", url: "https://tailwindcss.com" },
  ],
  Design: [
    { title: "Dribbble", url: "https://dribbble.com" },
    { title: "Figma", url: "https://figma.com" },
    { title: "Coolors", url: "https://coolors.co" },
  ],
  Reading: [
    { title: "Hacker News", url: "https://news.ycombinator.com" },
    { title: "Medium", url: "https://medium.com" },
  ],
};

async function seed() {
  console.log("🌱 Seeding database...\n");

  // 1. Create user via Better Auth
  let userId: string | null = null;

  try {
    const result = await auth.api.signUpEmail({
      body: {
        name: "Example User",
        email: SAMPLE_EMAIL,
        password: "password",
      },
    });
    userId = result.user.id;
    console.log(`✓ Created user: ${SAMPLE_EMAIL}`);
  } catch {
    // User may already exist, find them
    const existingUser = await db.user.findUnique({
      where: { email: SAMPLE_EMAIL },
    });
    if (existingUser) {
      userId = existingUser.id;
      console.log(`⚠ User already exists: ${SAMPLE_EMAIL}`);
    } else {
      console.error("✗ Failed to create or find user");
      process.exit(1);
    }
  }

  // 2. Create additional groups
  console.log("\n📁 Creating groups...");
  for (const group of sampleGroups) {
    const existing = await db.group.findFirst({
      where: { name: group.name, userId },
    });
    if (!existing) {
      await db.group.create({
        data: { ...group, userId },
      });
      console.log(`  ✓ Created group: ${group.name}`);
    } else {
      console.log(`  ⚠ Group exists: ${group.name}`);
    }
  }

  // 3. Create bookmarks under each group
  console.log("\n🔖 Creating bookmarks...");
  for (const [groupName, bookmarks] of Object.entries(sampleBookmarks)) {
    const group = await db.group.findFirst({
      where: { name: groupName, userId },
    });

    if (!group) {
      console.log(`  ⚠ Skipped ${groupName} (group not found)`);
      continue;
    }

    for (const bookmark of bookmarks) {
      const existing = await db.bookmark.findFirst({
        where: { url: bookmark.url, userId },
      });
      if (!existing) {
        await db.bookmark.create({
          data: {
            title: bookmark.title,
            url: bookmark.url,
            type: "link",
            groupId: group.id,
            userId,
          },
        });
        console.log(`  ✓ [${groupName}] ${bookmark.title}`);
      }
    }
  }

  console.log("\n✅ Seeding complete!");
  process.exit(0);
}

seed();
