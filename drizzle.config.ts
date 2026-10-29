import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    accountId: "8e642ff58d22bbbe4eda926dda88649e",
    databaseId: "89f75118-1f88-4758-b257-39c21b7212e1",
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
});
