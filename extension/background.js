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
