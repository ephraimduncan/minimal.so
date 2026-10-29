import { env } from "cloudflare:workers";
import { inArray, sql, type Column } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export * from "./schema";

export function createDb() {
  return drizzle(env.DB, { schema });
}

export type DB = ReturnType<typeof createDb>;

// D1 binds at most 100 values per query, so a long list goes in as one JSON
// array. A short list stays a plain IN list, which SQLite can look up by key.
// The cut at 90 leaves room for the other values in the query.
export function inList(column: Column, values: string[]) {
  if (values.length <= 90) return inArray(column, values);
  return sql`${column} in (select value from json_each(${JSON.stringify(values)}))`;
}
