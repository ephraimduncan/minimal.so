// API integration tests. Usage: bun run scripts/test-api-integration.ts

import crypto from "crypto";


import { PrismaClient } from "../prisma/generated/client/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({ url: "file:./dev.db" });
const db = new PrismaClient({ adapter });

const BASE = "http://localhost:3000";


function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generateRawKey(): string {
  const token = crypto.randomBytes(20).toString("hex");
  return `mnk_${token}`;
}

async function apiGet(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { headers });
  const body = await res.json();
  return { status: res.status, body, headers: Object.fromEntries(res.headers) };
}

async function apiPost(
  path: string,
  data: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body, headers: Object.fromEntries(res.headers) };
}

async function apiPatch(
  path: string,
  data: Record<string, unknown>,
  token?: string,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data),
  });
  const body = await res.json();
  return { status: res.status, body, headers: Object.fromEntries(res.headers) };
}

async function apiDelete(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: "DELETE", headers });
  const body = await res.json();
  return { status: res.status, body, headers: Object.fromEntries(res.headers) };
}

let passed = 0;
let failed = 0;

function assert(
  condition: boolean,
  testName: string,
  detail?: string,
): void {
  if (condition) {
    console.log(`  PASS ${testName}`);
    passed++;
  } else {
    console.error(`  FAIL ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}


const TEST_EMAIL = "api-integration-test@test.local";

async function cleanup() {
  // Delete test user (cascades to bookmarks, groups, apiKey)
  try {
    await db.apiKey.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  } catch { /* ignore */ }
  try {
    await db.bookmark.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  } catch { /* ignore */ }
  try {
    await db.group.deleteMany({ where: { user: { email: TEST_EMAIL } } });
  } catch { /* ignore */ }
  try {
    await db.user.deleteMany({ where: { email: TEST_EMAIL } });
  } catch { /* ignore */ }
}


async function main() {
  console.log("\nCross-Area Integration Tests\n");
  console.log("=".repeat(60));

  console.log("\nSetup: creating test user and API key...\n");

  await cleanup();

  const user = await db.user.create({
    data: {
      name: "Integration Test User",
      email: TEST_EMAIL,
      emailVerified: true,
      username: "api-test-user",
    },
  });
  console.log(`  Created user: ${user.id}`);

  const rawKey1 = generateRawKey();
  const keyHash1 = hashKey(rawKey1);

  await db.apiKey.create({
    data: {
      keyHash: keyHash1,
      keyPrefix: rawKey1.slice(0, 8),
      userId: user.id,
    },
  });
  console.log(`  Created API key: ${rawKey1.slice(0, 12)}...`);

  console.log("\n── Test 1: API Key Format ──");

  assert(rawKey1.startsWith("mnk_"), "Key starts with mnk_ prefix");
  assert(rawKey1.length > 10, "Key has sufficient length");
  assert(keyHash1.length === 64, "Hash is 64 char SHA-256 hex");

  // Verify hash matches
  const dbKey = await db.apiKey.findUnique({ where: { userId: user.id } });
  assert(dbKey !== null, "API key exists in database");
  assert(dbKey!.keyHash === keyHash1, "Stored hash matches computed hash");
  assert(dbKey!.keyPrefix === rawKey1.slice(0, 8), "Stored prefix is correct");
  assert(dbKey!.lastUsedAt === null, "lastUsedAt is initially null");

  console.log("\n── Test 2: API Authentication ──");

  // Valid key → 200
  const authRes = await apiGet("/api/user/me", rawKey1);
  assert(authRes.status === 200, "GET /api/user/me with valid key → 200", `got ${authRes.status}`);
  assert(authRes.body.success === true, "Response has success: true");
  assert(authRes.body.user?.email === TEST_EMAIL, "Returned user matches key owner");

  // No key → 401
  const noKeyRes = await apiGet("/api/user/me");
  assert(noKeyRes.status === 401, "GET /api/user/me without key → 401", `got ${noKeyRes.status}`);

  // Invalid key → 401
  const badKeyRes = await apiGet("/api/user/me", "mnk_invalidkey12345678");
  assert(badKeyRes.status === 401, "GET /api/user/me with invalid key → 401", `got ${badKeyRes.status}`);

  console.log("\n── Test 3: Rate Limit Headers ──");

  assert(
    "x-ratelimit-limit" in authRes.headers,
    "X-RateLimit-Limit header present",
  );
  assert(
    "x-ratelimit-remaining" in authRes.headers,
    "X-RateLimit-Remaining header present",
  );
  assert(
    "x-ratelimit-reset" in authRes.headers,
    "X-RateLimit-Reset header present",
  );

  console.log("\n── Test 4: Group → Bookmark Chain ──");

  // Create group
  const grpRes = await apiPost(
    "/api/groups",
    { name: "Test Group", color: "#ff5733" },
    rawKey1,
  );
  assert(grpRes.status === 201, "POST /api/groups → 201", `got ${grpRes.status}`);
  assert(grpRes.body.success === true, "Group creation successful");
  const groupId = grpRes.body.groupId;
  assert(typeof groupId === "string", "Got groupId back");

  // Create bookmark in that group
  const bkmkRes = await apiPost(
    "/api/bookmarks",
    { url: "https://example.com/test-integration", title: "Test Bookmark", groupId },
    rawKey1,
  );
  assert(bkmkRes.status === 201, "POST /api/bookmarks → 201", `got ${bkmkRes.status}`);
  assert(bkmkRes.body.success === true, "Bookmark creation successful");
  const bookmarkId = bkmkRes.body.bookmarkId;
  assert(typeof bookmarkId === "string", "Got bookmarkId back");

  // List bookmarks filtered by groupId
  const listRes = await apiGet(`/api/bookmarks?groupId=${groupId}`, rawKey1);
  assert(listRes.status === 200, "GET /api/bookmarks?groupId=... → 200", `got ${listRes.status}`);
  assert(listRes.body.success === true, "List response is successful");
  assert(listRes.body.total >= 1, "At least 1 bookmark in group", `total=${listRes.body.total}`);
  const found = listRes.body.bookmarks.some(
    (b: { id: string }) => b.id === bookmarkId,
  );
  assert(found, "Created bookmark found in group listing");

  // Verify bookmark fields
  const bkmk = listRes.body.bookmarks.find(
    (b: { id: string }) => b.id === bookmarkId,
  );
  assert(bkmk?.groupId === groupId, "Bookmark groupId matches");

  console.log("\n── Test 5: Bookmark CRUD ──");

  // Update bookmark
  const updateRes = await apiPatch(
    `/api/bookmarks/${bookmarkId}`,
    { title: "Updated Title" },
    rawKey1,
  );
  assert(updateRes.status === 200, "PATCH /api/bookmarks/:id → 200", `got ${updateRes.status}`);
  assert(updateRes.body.success === true, "Bookmark update successful");

  // Verify update
  const afterUpdate = await apiGet("/api/bookmarks?search=Updated+Title", rawKey1);
  const updatedBkmk = afterUpdate.body.bookmarks?.find(
    (b: { id: string }) => b.id === bookmarkId,
  );
  assert(updatedBkmk?.title === "Updated Title", "Bookmark title was updated");

  // Delete bookmark
  const delBkmk = await apiDelete(`/api/bookmarks/${bookmarkId}`, rawKey1);
  assert(delBkmk.status === 200, "DELETE /api/bookmarks/:id → 200", `got ${delBkmk.status}`);
  assert(delBkmk.body.success === true, "Bookmark deletion successful");

  // Verify deleted
  const afterDel = await apiGet(`/api/bookmarks?groupId=${groupId}`, rawKey1);
  const stillThere = afterDel.body.bookmarks?.some(
    (b: { id: string }) => b.id === bookmarkId,
  );
  assert(!stillThere, "Deleted bookmark no longer in listing");

  console.log("\n── Test 6: Group CRUD ──");

  // List groups
  const listGrps = await apiGet("/api/groups", rawKey1);
  assert(listGrps.status === 200, "GET /api/groups → 200", `got ${listGrps.status}`);
  assert(listGrps.body.success === true, "Groups list successful");
  const testGroup = listGrps.body.groups?.find(
    (g: { id: string }) => g.id === groupId,
  );
  assert(testGroup !== undefined, "Created group appears in listing");

  // Update group
  const updateGrp = await apiPatch(
    `/api/groups/${groupId}`,
    { name: "Updated Group" },
    rawKey1,
  );
  assert(updateGrp.status === 200, "PATCH /api/groups/:id → 200", `got ${updateGrp.status}`);

  // Delete group
  const delGrp = await apiDelete(`/api/groups/${groupId}`, rawKey1);
  assert(delGrp.status === 200, "DELETE /api/groups/:id → 200", `got ${delGrp.status}`);

  console.log("\n── Test 7: Group Delete Cascades Bookmarks ──");

  // Create group
  const grp2Res = await apiPost(
    "/api/groups",
    { name: "Cascade Test Group", color: "#00ff00" },
    rawKey1,
  );
  const groupId2 = grp2Res.body.groupId;

  // Create bookmark in that group
  const bkmk2Res = await apiPost(
    "/api/bookmarks",
    { url: "https://example.com/cascade-test", groupId: groupId2 },
    rawKey1,
  );
  const bookmarkId2 = bkmk2Res.body.bookmarkId;

  // Delete the group
  await apiDelete(`/api/groups/${groupId2}`, rawKey1);

  // Verify bookmark is also deleted
  const cascadeCheck = await apiGet("/api/bookmarks", rawKey1);
  const cascadeFound = cascadeCheck.body.bookmarks?.some(
    (b: { id: string }) => b.id === bookmarkId2,
  );
  assert(!cascadeFound, "Bookmark deleted by group cascade");

  // Verify in DB too
  const dbBkmk = await db.bookmark.findUnique({ where: { id: bookmarkId2 } });
  assert(dbBkmk === null, "Bookmark not in database after cascade delete");

  console.log("\n── Test 8: Error Cases ──");

  // Create bookmark without url
  const noUrl = await apiPost("/api/bookmarks", {}, rawKey1);
  assert(noUrl.status === 400 || noUrl.status === 422, "POST /api/bookmarks without url → 400/422", `got ${noUrl.status}`);

  // Create group without name
  const noName = await apiPost("/api/groups", { color: "#fff" }, rawKey1);
  assert(noName.status === 400 || noName.status === 422, "POST /api/groups without name → 400/422", `got ${noName.status}`);

  // Update non-existent bookmark
  const updateGhost = await apiPatch(
    "/api/bookmarks/nonexistent-id",
    { title: "Ghost" },
    rawKey1,
  );
  assert(updateGhost.status === 404, "PATCH non-existent bookmark → 404", `got ${updateGhost.status}`);

  // Delete non-existent bookmark
  const delGhost = await apiDelete("/api/bookmarks/nonexistent-id", rawKey1);
  assert(delGhost.status === 404, "DELETE non-existent bookmark → 404", `got ${delGhost.status}`);

  // Delete non-existent group
  const delGhostGrp = await apiDelete("/api/groups/nonexistent-id", rawKey1);
  assert(delGhostGrp.status === 404, "DELETE non-existent group → 404", `got ${delGhostGrp.status}`);

  // Create bookmark with invalid groupId
  const badGroup = await apiPost(
    "/api/bookmarks",
    { url: "https://example.com/bad-group", groupId: "nonexistent-group" },
    rawKey1,
  );
  assert(badGroup.status === 400, "POST bookmark with invalid groupId → 400", `got ${badGroup.status}`);

  console.log("\n── Test 9: lastUsedAt Update ──");

  const keyBefore = await db.apiKey.findUnique({ where: { userId: user.id } });
  assert(keyBefore!.lastUsedAt !== null, "lastUsedAt updated after API calls");

  // Record the current value, make another call, verify it changes
  const lastUsedBefore = keyBefore!.lastUsedAt!.getTime();

  // Wait a moment so timestamp differs
  await new Promise((r) => setTimeout(r, 1100));

  await apiGet("/api/user/me", rawKey1);

  const keyAfter = await db.apiKey.findUnique({ where: { userId: user.id } });
  assert(
    keyAfter!.lastUsedAt!.getTime() > lastUsedBefore,
    "lastUsedAt increases after subsequent API call",
    `before=${lastUsedBefore}, after=${keyAfter!.lastUsedAt!.getTime()}`,
  );

  console.log("\n── Test 10: Key Revocation ──");

  // Revoke key via direct DB delete (simulating ORPC procedure)
  await db.apiKey.deleteMany({ where: { userId: user.id } });

  // Verify API returns 401 with revoked key
  const revokedRes = await apiGet("/api/user/me", rawKey1);
  assert(revokedRes.status === 401, "Revoked key returns 401", `got ${revokedRes.status}`);
  assert(
    (revokedRes.body.success === false) || (typeof revokedRes.body.message === "string") || (typeof revokedRes.body.error === "string"),
    "Error response contains error info",
    JSON.stringify(revokedRes.body),
  );

  console.log("\n── Test 11: Key Regeneration ──");

  // Generate new key
  const rawKey2 = generateRawKey();
  const keyHash2 = hashKey(rawKey2);

  await db.apiKey.create({
    data: {
      keyHash: keyHash2,
      keyPrefix: rawKey2.slice(0, 8),
      userId: user.id,
    },
  });

  // Old key should still fail
  const oldKeyRes = await apiGet("/api/user/me", rawKey1);
  assert(oldKeyRes.status === 401, "Old key still returns 401 after regen", `got ${oldKeyRes.status}`);

  // New key should work
  const newKeyRes = await apiGet("/api/user/me", rawKey2);
  assert(newKeyRes.status === 200, "New key returns 200", `got ${newKeyRes.status}`);
  assert(newKeyRes.body.user?.email === TEST_EMAIL, "New key authenticates correct user");

  // Simulate full regeneration: delete old, create new (verify atomicity)
  await db.apiKey.deleteMany({ where: { userId: user.id } });
  const rawKey3 = generateRawKey();
  const keyHash3 = hashKey(rawKey3);
  await db.apiKey.create({
    data: {
      keyHash: keyHash3,
      keyPrefix: rawKey3.slice(0, 8),
      userId: user.id,
    },
  });

  // key2 should fail now, key3 should work
  const key2After = await apiGet("/api/user/me", rawKey2);
  assert(key2After.status === 401, "Previous key (key2) returns 401", `got ${key2After.status}`);

  const key3Res = await apiGet("/api/user/me", rawKey3);
  assert(key3Res.status === 200, "Latest key (key3) returns 200", `got ${key3Res.status}`);

  // Verify only one key in DB
  const keyCount = await db.apiKey.count({ where: { userId: user.id } });
  assert(keyCount === 1, "Only one API key exists per user", `count=${keyCount}`);

  console.log("\n── Test 12: Duplicate Bookmark Detection ──");

  const dup1 = await apiPost(
    "/api/bookmarks",
    { url: "https://example.com/dup-test" },
    rawKey3,
  );
  assert(dup1.status === 201, "First bookmark creation → 201", `got ${dup1.status}`);

  const dup2 = await apiPost(
    "/api/bookmarks",
    { url: "https://example.com/dup-test" },
    rawKey3,
  );
  assert(dup2.status === 201, "Duplicate bookmark returns 201 with existing ID", `got ${dup2.status}`);
  assert(dup2.body.duplicate === true, "Response indicates duplicate");
  assert(dup2.body.bookmarkId === dup1.body.bookmarkId, "Same bookmarkId returned");

  console.log("\n── Test 13: OpenAPI Spec ──");

  const specRes = await fetch(`${BASE}/api/openapi.json`);
  assert(specRes.status === 200, "GET /api/openapi.json → 200", `got ${specRes.status}`);
  const spec = await specRes.json();
  assert(spec.openapi?.startsWith("3."), "OpenAPI 3.x spec");
  assert(spec.info?.title === "bmrks API", "Spec title is correct");
  assert("/bookmarks" in (spec.paths ?? {}), "Bookmarks endpoint in spec");
  assert("/groups" in (spec.paths ?? {}), "Groups endpoint in spec");
  assert("/user/me" in (spec.paths ?? {}), "User/me endpoint in spec");

  console.log("\n── Test 14: Health Endpoint ──");

  const healthRes = await apiGet("/api/health");
  assert(healthRes.status === 200, "GET /api/health → 200 (no auth)", `got ${healthRes.status}`);
  assert(healthRes.body.success === true, "Health response is successful");

  console.log("\n── Cleanup ──");
  await cleanup();
  console.log("  Test data cleaned up.");

  console.log("\n" + "=".repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Test script crashed:", err);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
