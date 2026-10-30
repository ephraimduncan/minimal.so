# Deploy runbook: minimal-so on Cloudflare

The app is one Cloudflare Worker named `minimal-so` on the "Ephraim Personal"
account. It uses these Cloudflare products:

- Workers (app, API, and static assets)
- D1 (database `minimal-so`, binding `DB`)
- R2 (bucket `minimal-so-avatars`, binding `AVATARS`)
- Email Sending (binding `EMAIL`, sender domain `mail.minimal.so`)
- Rate Limiting (bindings `API_RATELIMIT` and `WRITE_RATELIMIT`).

Polar (billing) and Google (sign-in) are external services. Run all commands
from the repository root.

## 0. Prerequisites

```sh
bun install
bunx wrangler login
bunx wrangler whoami
```

`wrangler.jsonc` sets `account_id`, so wrangler always uses the "Ephraim
Personal" account.

## 1. Create the resources (one time)

The bucket and the database exist. On a new account, first set `account_id`
in `wrangler.jsonc` and `accountId` in `drizzle.config.ts` to the new account
id (see `bunx wrangler whoami`). Then make the resources again:

```sh
bunx wrangler r2 bucket create minimal-so-avatars
bunx wrangler d1 create minimal-so
```

After `d1 create`, write the new database id into `wrangler.jsonc` and
`drizzle.config.ts`.

The rate-limit and `EMAIL` bindings need no command. Before the first email,
enable the sender domain once:

```sh
bunx wrangler email sending enable mail.minimal.so
```

## 2. Database schema

`lib/db/schema.ts` is the source of the schema. Drizzle Kit writes SQL
migrations to `drizzle/`, and wrangler applies them. D1 records each applied
migration in the `d1_migrations` table.

To change the schema:

1. Edit `lib/db/schema.ts`.
2. Run `bun run db:generate`.
3. Read the new SQL file in `drizzle/`.
4. Run `bun run db:migrate:local`, then do a test with `bun run dev`.
5. Run `bun run deploy`. This applies the migration to production before the
   new code goes live.

**Warning:** If a generated migration has `DROP TABLE` for `user` or `group`,
write the migration again by hand. D1 always enforces foreign keys, so the drop
deletes all child rows (bookmarks, groups, sessions, accounts, API keys).

Make each migration safe for the old code too, because the migration runs
before the deploy. Add columns and tables. Do not rename or remove them in the
same deploy.

If a migration damages data, use D1 Time Travel to restore the database to an
earlier time:

```sh
bunx wrangler d1 time-travel info minimal-so
bunx wrangler d1 time-travel restore minimal-so --timestamp <unix-time>
```

To open Drizzle Studio on the production database, put `CLOUDFLARE_D1_TOKEN`
in `.env` and run `bun run db:studio`. The token needs the D1 Edit permission.

## 3. Move the data from Turso (one time)

Workers Builds deploys `main` to production (section 7). Thus, the Worker
reads D1 as soon as the D1 change merges. Import the data before you merge.

Do this cutover once, when traffic is low. The Worker that is live reads Turso
until step 6. Writes to Turso after the dump in step 4 do not go to D1.

1. Do the steps in section 7, so that Workers Builds can apply migrations.
2. Record the id of the version that is live. You need it to roll back.

   ```sh
   bunx wrangler deployments status
   ```

3. Record a D1 restore point. Keep the bookmark that the command shows.

   ```sh
   bunx wrangler d1 time-travel info minimal-so
   ```

4. Get the Turso URL and a token from the Turso dashboard. Save the dump
   outside the repository, because it holds the data of all users.

   ```sh
   curl -sSf "https://${TURSO_DATABASE_URL#libsql://}/dump" \
     -H "Authorization: Bearer $TURSO_AUTH_TOKEN" -o /tmp/turso.sql
   ```

5. Import the dump. The script applies the migrations and stops if D1 already
   has users. Then it compares the rows and bytes of each table.

   ```sh
   bun scripts/turso-to-d1.ts /tmp/turso.sql --remote
   ```

6. If all tables agree, merge the D1 change to `main`. For a shorter window,
   run `bun run deploy` from the branch first, then merge.
7. Make sure that D1 is live. `bunx wrangler deployments status` must show a
   new version. Sign up a test user, then find the user in D1:

   ```sh
   bunx wrangler d1 execute minimal-so --remote \
     --command "select email from user order by createdAt desc limit 1"
   ```

8. Do the smoke test in section 9.
9. Delete `/tmp/turso.sql`.

D1 rejects a row larger than 2 MB. Thus, the script clears `normalizedUrl` on a
bookmark if the value is too long to store a second copy of the URL.

### Roll back

If step 7 or step 8 fails, do these steps immediately:

1. Run `bunx wrangler rollback <version-id>` with the id from step 2. That
   version reads Turso.
2. If you merged the D1 change, revert it on `main`. Then the next push does
   not deploy D1 again.
3. Restore D1 to the bookmark from step 3:
   `bunx wrangler d1 time-travel restore minimal-so --bookmark <bookmark>`.

To try again, start at step 2 with a new dump. Rows written to D1 after the
cutover do not go back to Turso.

**Warning:** After the smoke test passes, do not roll back to a version from
before the cutover. That version serves old Turso data and writes new rows to
Turso. To recover data after that point, use D1 Time Travel (section 2).

### Remove Turso and Vercel

The Vercel project still serves the old Next.js app at
`minimal-ephraim.vercel.app`, and that app reads and writes Turso. After the
cutover, do these steps:

1. When the `www` redirect works (section 8), delete the Vercel project.
2. Remove the Turso secrets, so that a version from before the cutover cannot
   use Turso:

   ```sh
   bunx wrangler secret delete TURSO_DATABASE_URL
   bunx wrangler secret delete TURSO_AUTH_TOKEN
   ```

3. Invalidate the Turso tokens (`turso db tokens invalidate <db>`). Then delete
   the Turso database.

## 4. Server secrets

The Worker reads these values through `process.env`. `.dev.vars.example` lists
all of them. Set each one with `bunx wrangler secret put <NAME>`.

| Secret | Necessary | Use |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | Yes | Signs sessions |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | No | Google sign-in |
| `POLAR_ACCESS_TOKEN`, `POLAR_WEBHOOK_SECRET` | No | Polar billing |
| `POLAR_SERVER` | No | `production` or `sandbox` |
| `POLAR_CREATE_CUSTOMER_ON_SIGN_UP` | No | `true` or `false` |
| `POLAR_PRO_MONTHLY_PRODUCT_ID`, `POLAR_PRO_YEARLY_PRODUCT_ID` | No | Pro plans |
| `ADMIN_EMAIL` | No | Opens `/admin` for this email |
| `CHROME_EXTENSION_ID` | No | Extension CORS |

To set many secrets at once, write them to a JSON file outside the repository.
Then run `bunx wrangler secret bulk /tmp/secrets.json` and delete the file.

If you add or remove a server value, change `.dev.vars.example` and run
`bun run cf-typegen`. This writes `worker-configuration.d.ts`.

## 5. Local development

```sh
cp .dev.vars.example .dev.vars   # server values
cp .env.example .env             # client values
bun run db:migrate:local
bun run dev
```

`vite dev` and `wrangler --local` keep the local D1 in `.wrangler/state/v3/d1`.
To start again with an empty database, delete that folder and run
`bun run db:migrate:local`.

To put production data in the local database, make a dump (section 3) and run
`bun scripts/turso-to-d1.ts /tmp/turso.sql --local`.

## 6. Client values

Vite puts `VITE_*` values into the browser bundle at build time. They are not
secrets, so do not put them in `.dev.vars` or `wrangler secret`.

- `.env.production` is in git and sets each client value for production.
  `vite build` reads it on your computer and in Workers Builds.
- `.env` is not in git. Copy it from `.env.example` for `vite dev`.
  `vite build` also reads `.env`, but `.env.production` overrides each value
  that it sets.

A production build always uses `https://minimal.so` as the app URL.

## 7. Deploy

Workers Builds connects this repository to the Worker. A push to `main`
deploys to production. A push to a different branch uploads a preview version
that uses the same D1 database.

Set these values in the dashboard: Workers & Pages, then `minimal-so`, then
Settings, then Build:

- Build command: `bun run build`
- Deploy command: `bun run db:migrate:remote && npx wrangler deploy`

If the deploy command does not apply migrations, run `bun run db:migrate:remote`
before you merge a schema change. The build token must have the D1 Edit
permission to apply migrations.

To deploy from your computer:

```sh
bun run deploy
```

This builds the app, applies new D1 migrations to production, and deploys the
Worker. To do a test of the production build on workerd before you deploy:

```sh
bun run build && bunx wrangler dev
```

## 8. Domains and webhooks

- `minimal.so` is a custom domain of the Worker.
- `www.minimal.so` must go to `https://minimal.so` with a 301 redirect. In the
  `minimal.so` zone, add a redirect rule for hostname `www.minimal.so` with
  the dynamic target `concat("https://minimal.so", http.request.uri.path)`.
  Keep the query string. Then set the `www` DNS record to a proxied `AAAA`
  record with the value `100::`. This removes Vercel from the request path.
- After the `www` redirect works, delete the Vercel project (section 3).
- The Polar webhook URL is `https://minimal.so/api/auth/polar/webhooks`. Make
  sure that its signing secret is the same as `POLAR_WEBHOOK_SECRET`.
- The Google OAuth redirect URI is
  `https://minimal.so/api/auth/callback/google`.

## 9. Smoke test (deployed Worker)

1. Auth: sign up, get the email, verify, sign in, and sign out.
2. Dashboard: the page loads. Then make, move, and delete bookmarks.
3. Bulk actions: select more than 100 bookmarks, then move and delete them.
4. Public profile `/u/<username>`, the OG image `/api/og?username=…`, and the
   RSS and Atom feeds.
5. Avatar: upload an image. It goes to R2 and shows at `/avatars/<key>`.
6. Public API: `/api/openapi.json`, a call with a Bearer key, and a `429` from
   the rate limit.
7. Billing: a Polar checkout and a test webhook.
