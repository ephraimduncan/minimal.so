const DEFAULT_BASE_URL = "http://localhost:3000";

async function getBaseUrl() {
  const result = await chrome.storage.sync.get(["baseUrl"]);
  return result.baseUrl || DEFAULT_BASE_URL;
}

function showBadge(text, color, tabId) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color, tabId });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "", tabId });
  }, 2500);
}

function showNotification(title, message) {
  return new Promise((resolve) => {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title,
        message,
      },
      resolve
    );
  });
}

function showLoginNotification(baseUrl, tabId) {
  return new Promise((resolve) => {
    chrome.notifications.create(
      {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Login Required",
        message: "Please log in to save bookmarks. Opening login page...",
      },
      (notificationId) => {
        chrome.tabs.create({ url: `${baseUrl}/login` });
        setTimeout(() => {
          chrome.notifications.clear(notificationId, resolve);
        }, 3000);
      }
    );
  });
}

async function saveBookmark(url, title, tabId) {
  const baseUrl = await getBaseUrl();
  const endpoint = `${baseUrl}/api/extension/bookmark`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ url, title }),
    });

    const data = await response.json();

    if (response.status === 401) {
      showBadge("!", "#f59e0b", tabId);
      await showLoginNotification(baseUrl, tabId);
      return;
    }

    if (!response.ok) {
      console.error("Save failed:", data);
      showBadge("✗", "#ef4444", tabId);
      await showNotification(
        "Error",
        data.message || "Failed to save bookmark"
      );
      return;
    }

    showBadge("✓", "#22c55e", tabId);
    await showNotification("Bookmark Saved", data.bookmark?.title || title);
  } catch (error) {
    console.error("Network error:", error);
    showBadge("✗", "#ef4444", tabId);
    await showNotification("Error", "Network error. Please try again.");
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (
    !tab.url ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://")
  ) {
    showBadge("✗", "#ef4444", tab.id);
    return;
  }
  await saveBookmark(tab.url, tab.title, tab.id);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-page",
    title: "Save to Minimal",
    contexts: ["page"],
  });
  chrome.contextMenus.create({
    id: "save-link",
    title: "Save to Minimal",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-page") {
    if (tab.url && !tab.url.startsWith("chrome://")) {
      await saveBookmark(tab.url, tab.title, tab.id);
    }
  } else if (info.menuItemId === "save-link") {
    if (info.linkUrl) {
      await saveBookmark(info.linkUrl, info.linkUrl, tab.id);
    }
  }
});
