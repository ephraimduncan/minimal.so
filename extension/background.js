importScripts("constants.js");

async function getBaseUrl() {
  const { baseUrl } = await chrome.storage.sync.get(["baseUrl"]);
  return baseUrl || DEFAULT_BASE_URL;
}

function showBadge(type, tabId) {
  const { text, color } = BADGE[type];
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  setTimeout(() => chrome.action.setBadgeText({ text: "", tabId }), 2500);
}

function showNotification(title, message, onClick) {
  return new Promise((resolve) => {
    chrome.notifications.create(
      { type: "basic", iconUrl: "icons/icon128.png", title, message },
      onClick
        ? (id) => {
            onClick();
            setTimeout(() => chrome.notifications.clear(id, resolve), 3000);
          }
        : resolve
    );
  });
}

async function saveBookmark(url, title, tabId) {
  const baseUrl = await getBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/extension/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url, title }),
    });

    const data = await response.json();

    if (response.status === 401) {
      showBadge("login", tabId);
      chrome.tabs.create({ url: `${baseUrl}/login` });
      await showNotification(
        "Login Required",
        "Please log in to save bookmarks."
      );
      return;
    }

    if (!response.ok) {
      console.error("Save failed:", data);
      showBadge("error", tabId);
      await showNotification(
        "Error",
        data.message || "Failed to save bookmark"
      );
      return;
    }

    showBadge("success", tabId);
    await showNotification("Bookmark Saved", data.bookmark?.title || title);
  } catch (error) {
    console.error("Network error:", error);
    showBadge("error", tabId);
    await showNotification("Error", "Network error. Please try again.");
  }
}

function isInvalidUrl(url) {
  return (
    !url || url.startsWith("chrome://") || url.startsWith("chrome-extension://")
  );
}

chrome.action.onClicked.addListener(async (tab) => {
  if (isInvalidUrl(tab.url)) {
    showBadge("error", tab.id);
    return;
  }
  await saveBookmark(tab.url, tab.title, tab.id);
});

chrome.runtime.onInstalled.addListener(() => {
  [
    { id: "save-page", contexts: ["page"] },
    { id: "save-link", contexts: ["link"] },
  ].forEach(({ id, contexts }) => {
    chrome.contextMenus.create({ id, title: "Save to Minimal", contexts });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-page" && !isInvalidUrl(tab.url)) {
    await saveBookmark(tab.url, tab.title, tab.id);
  } else if (info.menuItemId === "save-link" && info.linkUrl) {
    await saveBookmark(info.linkUrl, info.linkUrl, tab.id);
  }
});

const IMPORT_LIMIT = 2000;

function flattenBookmarks(nodes) {
  const result = [];
  for (const node of nodes) {
    if (node.url) {
      result.push(node);
    }
    if (node.children) {
      result.push(...flattenBookmarks(node.children));
    }
  }
  return result;
}

function isHttpUrl(url) {
  return url.startsWith("http://") || url.startsWith("https://");
}

chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message?.type !== "import-bookmarks") return;

    (async () => {
      try {
        const tree = await chrome.bookmarks.getTree();
        const leaves = flattenBookmarks(tree);
        const httpLeaves = leaves.filter((b) => isHttpUrl(b.url));

        const truncated = httpLeaves.length > IMPORT_LIMIT;
        const capped = httpLeaves.slice(0, IMPORT_LIMIT);
        const bookmarks = capped.map((b) => ({
          title: b.title || b.url,
          url: b.url,
        }));

        const baseUrl = sender.origin;
        const response = await fetch(`${baseUrl}/api/extension/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ bookmarks }),
        });

        const data = await response.json();

        if (!response.ok) {
          sendResponse({
            success: false,
            error: data.error || "Server error",
            message: data.message || "Import failed",
            status: response.status,
          });
          return;
        }

        sendResponse({
          ...data,
          truncated: truncated || data.truncated,
          limit: IMPORT_LIMIT,
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: "NetworkError",
          message: error.message || "Failed to import bookmarks",
        });
      }
    })();

    return true;
  }
);
