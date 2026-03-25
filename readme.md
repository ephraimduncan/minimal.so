# minimal

> simple bookmarking for everyone

minimal is a fast, keyboard-first bookmark manager that makes saving and finding links feel effortless.

## demo

The landing page includes a dashboard demo (no login required).

## features

- Quick save anything in seconds
- Organize links into groups and collections
- Instant search across titles and URLs
- Private by default, no tracking
- Keyboard-first navigation and shortcuts
- Auto-fetch titles, descriptions, and favicons

## tech stack

- next.js
- typescript
- tailwind
- redis
- sqlite

## api

minimal has a REST API for programmatic access to your bookmarks and groups.

### authentication

Generate an API key in **Settings → API**. Pass it as a Bearer token:

```
Authorization: Bearer <your-api-key>
```

### endpoints

| method | path | description |
| --- | --- | --- |
| `GET` | `/api/health` | health check (no auth required) |
| `GET` | `/api/bookmarks` | list bookmarks (paginated) |
| `POST` | `/api/bookmarks` | create a bookmark |
| `PATCH` | `/api/bookmarks/:id` | update a bookmark |
| `DELETE` | `/api/bookmarks/:id` | delete a bookmark |
| `GET` | `/api/groups` | list groups |
| `POST` | `/api/groups` | create a group |
| `PATCH` | `/api/groups/:id` | update a group |
| `DELETE` | `/api/groups/:id` | delete a group |
| `GET` | `/api/user/me` | get your profile |

For full request/response schemas, see the OpenAPI spec at `GET /api/openapi.json`.

### rate limiting

- **60 requests/min** for all endpoints
- **30 requests/min** for write operations (POST, PATCH, DELETE)

Rate limit info is returned in `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

### examples

List your bookmarks:

```bash
curl -H "Authorization: Bearer <your-api-key>" \
  https://your-instance.com/api/bookmarks
```

Create a bookmark:

```bash
curl -X POST -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  https://your-instance.com/api/bookmarks
```
