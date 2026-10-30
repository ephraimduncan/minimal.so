// Copies the rows of a Turso SQL dump into the `minimal-so` D1 database.
//
// Save the dump outside the repo first, because it holds every user's data:
//   curl -sSf "https://${TURSO_DATABASE_URL#libsql://}/dump" \
//     -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -o /tmp/turso.sql
//
// Then run: bun scripts/turso-to-d1.ts /tmp/turso.sql --local|--remote
//
// The D1 schema comes from the Drizzle migrations in ./drizzle, so the script
// applies them and then copies rows only. It names every column because the
// Turso tables order some columns differently.
import { Database } from "bun:sqlite";
import { $ } from "bun";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Parents come before children, so each insert satisfies its foreign keys.
const TABLES = [
  "user",
  "group",
  "bookmark",
  "session",
  "account",
  "verification",
  "apiKey",
];

// D1 rejects statements longer than 100 KB and rows larger than 2 MB.
const MAX_STATEMENT_BYTES = 90_000;
// A code point is at most 4 bytes, so a quoted chunk stays under 80 KB.
const CHUNK_CHARS = 20_000;

const [dumpPath, target] = process.argv.slice(2);
if (!dumpPath || (target !== "--local" && target !== "--remote")) {
  console.error(
    "usage: bun scripts/turso-to-d1.ts <turso.sql> --local|--remote",
  );
  process.exit(1);
}

const source = new Database(":memory:");
source.run(readFileSync(dumpPath, "utf8"));

const dumped = source
  .query<{ name: string }, []>(
    "select name from sqlite_master where type = 'table' and name not like 'sqlite_%'",
  )
  .all()
  .map((row) => row.name);
const unknown = dumped.filter((name) => !TABLES.includes(name));
if (unknown.length > 0) {
  throw new Error(`Dump has tables this script does not copy: ${unknown}`);
}

const orphans = source.query("pragma foreign_key_check").all();
if (orphans.length > 0) {
  throw new Error(`Dump has ${orphans.length} rows with missing parents`);
}

// `normalizedUrl` is a dedupe key derived from `url`. A bookmarklet URL can
// be megabytes long, and two copies of it do not fit in one D1 row.
const cleared = source.run(
  `update bookmark set normalizedUrl = null
   where length(cast(normalizedUrl as blob)) > ${MAX_STATEMENT_BYTES}`,
).changes;
if (cleared > 0) {
  console.log(`bookmark: cleared normalizedUrl on ${cleared} oversized rows`);
}

const statements: string[] = [];
const columnsByTable: Record<string, string[]> = {};
for (const table of TABLES) {
  const query = source.query(`select * from "${table}"`);
  columnsByTable[table] = query.columnNames;
  for (const row of query.values()) {
    statements.push(...insertRow(table, query.columnNames, row));
  }
}

await $`bunx wrangler d1 migrations apply minimal-so ${target}`;

const { users } = await queryD1(`select count(*) as users from "user"`);
if (users > 0) {
  throw new Error(`D1 already has ${users} users. Import into an empty database.`);
}

// rows.sql holds password hashes and session tokens, so delete it on Ctrl-C too.
const dir = mkdtempSync(join(tmpdir(), "turso-to-d1-"));
const file = join(dir, "rows.sql");
const cleanup = () => rmSync(dir, { recursive: true, force: true });
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    cleanup();
    process.exit(130);
  });
}
try {
  writeFileSync(file, statements.join("\n"));
  await $`bunx wrangler d1 execute minimal-so ${target} --file ${file} --yes`;
} finally {
  cleanup();
}

// Compare the row count and the total bytes of every table, so that a cut or
// changed value fails the import and not only a missing row.
const summary = `select ${TABLES.map((table) => {
  const bytes = columnsByTable[table]
    .map((c) => `ifnull(length(cast("${c}" as blob)), 0)`)
    .join(" + ");
  return `(select count(*) || ' rows, ' || ifnull(sum(${bytes}), 0) || ' bytes' from "${table}") as "${table}"`;
}).join(", ")}`;
const expected = source.query(summary).get() as Record<string, string>;
const actual = await queryD1(summary);
let mismatch = false;
for (const table of TABLES) {
  const ok = actual[table] === expected[table];
  mismatch ||= !ok;
  console.log(
    `${table}: ${expected[table]} in dump, ${actual[table]} in D1${ok ? "" : "  MISMATCH"}`,
  );
}
if (mismatch) process.exit(1);

function insertRow(table: string, columns: string[], row: unknown[]) {
  const names = columns.map((c) => `"${c}"`).join(", ");
  const statement = `INSERT INTO "${table}" (${names}) VALUES (${row.map(literal).join(", ")});`;
  if (Buffer.byteLength(statement) <= MAX_STATEMENT_BYTES) return [statement];

  // Insert long text as empty strings, then append it one chunk at a time.
  const id = literal(row[columns.indexOf("id")]);
  const appends: string[] = [];
  const short = row.map((value, i) => {
    if (typeof value !== "string" || value.length <= 1_000) return value;
    const chars = Array.from(value);
    const column = `"${columns[i]}"`;
    for (let start = 0; start < chars.length; start += CHUNK_CHARS) {
      const chunk = chars.slice(start, start + CHUNK_CHARS).join("");
      appends.push(
        `UPDATE "${table}" SET ${column} = ${column} || ${literal(chunk)} WHERE "id" = ${id};`,
      );
    }
    return "";
  });
  return [
    `INSERT INTO "${table}" (${names}) VALUES (${short.map(literal).join(", ")});`,
    ...appends,
  ];
}

function literal(value: unknown): string {
  if (value === null) return "NULL";
  if (typeof value === "number" || typeof value === "bigint") {
    return String(value);
  }
  if (typeof value === "string") return `'${value.replaceAll("'", "''")}'`;
  throw new Error(`Unexpected ${typeof value} value in dump`);
}

// Returns the first row. D1 caps the terms in a compound SELECT, so queries
// here use one subquery per table instead of UNION ALL.
async function queryD1(sql: string) {
  const output = await $`bunx wrangler d1 execute minimal-so ${target} --json --command ${sql}`.quiet();
  return JSON.parse(output.stdout.toString())[0].results[0];
}
