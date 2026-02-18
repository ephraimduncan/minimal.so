# Minimal Chrome Extension

Save any page or link to your Minimal bookmarks with one click.

## Development Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. Copy the extension ID shown under the extension name

### 3. Configure the server

Add the extension ID to your `.env` file:

```bash
CHROME_EXTENSION_ID=your-extension-id-here
```

This is required for CORS validation - the server only accepts requests from your extension.

### 4. Run with web-ext (optional)

For automatic reloading during development:

```bash
bun run ext:dev
```

## Permissions

| Permission | Purpose |
|---|---|
| `activeTab` | Access active tab URL/title for saving |
| `bookmarks` | Listen for new browser bookmarks (auto-sync) |
| `contextMenus` | Right-click save menu items for pages and links |
| `storage` | Persist server URL setting |
| `tabs` | Query all tabs in current window (Keep all tabs) |
| `notifications` | Save confirmation feedback |

Host permissions for `x.com` and `twitter.com` are required for the X bookmark capture content script.

## Usage

### Popup

Click the extension icon to open the popup:

- **Keep current tab** saves the active tab URL. Shows "Already kept" if already saved.
- **Keep all tabs (N)** saves all unsaved tabs in the current window. Hidden when no unsaved tabs remain.

### Context Menu

Right-click anywhere on a page and select **Save to Minimal**, or right-click a link and select **Save link to Minimal**.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd+Shift+K` (Mac) / `Ctrl+Shift+K` | Keep current tab |
| `Cmd+Shift+L` (Mac) / `Ctrl+Shift+L` | Keep all unsaved tabs |

Bindings are hardcoded defaults. Rebinding is available through `chrome://extensions/shortcuts`.

### X Bookmark Capture

When browsing `x.com` or `twitter.com`, bookmarking a tweet automatically saves its canonical URL to the **Imported - X** group. A rate-limited toast confirms saves; burst events are collapsed into aggregate messages.

Only tweet URLs (`/user/status/{id}`) are captured. Non-tweet pages (profiles, lists, search, settings, spaces) are excluded.

### Browser Bookmark Sync

New browser bookmarks (created via Chrome's bookmark system) are automatically synced to the **Imported - Browser** group. This is silent — no toast or notification.

Only new bookmarks are synced. Existing browser bookmarks are not backfilled.

## Import Groups

Bookmarks from different sources are kept in separate groups:

- `Imported - X` — tweets bookmarked on X
- `Imported - Browser` — bookmarks created in Chrome

Groups are auto-created on first import. Manual saves (popup, context menu, shortcuts) go to the user's default group.

## Deduplication

All save paths use normalized URL as the dedupe key. If the same URL is captured from a different source, the existing record is moved to the latest source's group (last-write reclassification). Record identity, tags, notes, and other metadata are preserved.

## Reliability

This extension operates on a best-effort basis:

- No persistent retry queue for failed saves
- No failure toast or badge on background sync errors
- Service worker restarts may drop in-flight events
- Transient failures and offline states may cause missed saves

Errors are logged to the service worker console with source tags.

## Configuration

1. Right-click the extension icon and select "Options"
2. Change the Server URL if you're self-hosting or developing locally

## Building for Production

```bash
bun run ext:build
```

This creates a zip file in `extension-dist/` ready for Chrome Web Store submission.

## Security

The extension endpoint validates that requests come from the configured extension ID only. This prevents unauthorized third parties from making requests to the bookmark API on behalf of logged-in users.

When you publish to the Chrome Web Store, update `CHROME_EXTENSION_ID` in your production environment with the published extension ID.
