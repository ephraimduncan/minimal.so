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

function showNotification(title, message) {
  return new Promise((resolve) => {
    chrome.notifications.create(
      { type: "basic", iconUrl: "icons/icon128.png", title, message },
      resolve,
    );
  });
}

async function saveLink({ url, title, source, tabId }) {
  const baseUrl = await getBaseUrl();
  const capturedAt = new Date().toISOString();

  const destinationGroup =
    source === SOURCE.X_BOOKMARK
      ? IMPORT_GROUP.X
      : source === SOURCE.BROWSER_BOOKMARK
        ? IMPORT_GROUP.BROWSER
        : undefined;

  try {
    const response = await fetch(`${baseUrl}/api/extension/bookmark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ url, title, source, destinationGroup, capturedAt }),
    });

    const data = await response.json();

    if (response.status === 401) {
      if (tabId) showBadge("login", tabId);
      return { success: false, needsLogin: true };
    }

    if (!response.ok) {
      console.error("[saveLink]", source, data);
      if (tabId) showBadge("error", tabId);
      return { success: false, message: data.message };
    }

    if (tabId) showBadge("success", tabId);
    return { success: true, action: data.action, bookmark: data.bookmark };
  } catch (error) {
    console.error("[saveLink]", source, error);
    if (tabId) showBadge("error", tabId);
    return { success: false, message: "Network error" };
  }
}

async function checkUrls(urls) {
  const baseUrl = await getBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/extension/bookmark/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ urls }),
    });

    if (!response.ok) return { saved: {} };
    const data = await response.json();
    return { saved: data.saved || {} };
  } catch {
    return { saved: {} };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "keep-page",
    title: "Keep this link",
    contexts: ["page"],
  });
  chrome.contextMenus.create({
    id: "keep-link",
    title: "Keep this link",
    contexts: ["link"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "keep-page" && tab && !isRestrictedUrl(tab.url)) {
    await saveLink({
      url: tab.url,
      title: tab.title,
      source: SOURCE.MANUAL_CONTEXT_MENU,
      tabId: tab.id,
    });
  } else if (info.menuItemId === "keep-link" && info.linkUrl) {
    await saveLink({
      url: info.linkUrl,
      title: info.linkUrl,
      source: SOURCE.MANUAL_CONTEXT_MENU,
      tabId: tab ? tab.id : undefined,
    });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-current-tab") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || isRestrictedUrl(tab.url)) return;

    const result = await saveLink({
      url: tab.url,
      title: tab.title,
      source: SOURCE.MANUAL_SHORTCUT,
      tabId: tab.id,
    });

    if (result.success) {
      await showNotification("Kept", tab.title || tab.url);
    } else if (result.needsLogin) {
      const baseUrl = await getBaseUrl();
      chrome.tabs.create({ url: `${baseUrl}/login` });
    }
  }

  if (command === "save-all-tabs") {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = tabs.filter(
      (t) => t.url && !isRestrictedUrl(t.url) && /^https?:\/\//i.test(t.url),
    );

    if (httpTabs.length === 0) return;

    const urls = httpTabs.map((t) => t.url);
    const { saved } = await checkUrls(urls);
    const unsaved = httpTabs.filter((t) => !saved[t.url]);

    if (unsaved.length === 0) return;

    let savedCount = 0;
    for (const tab of unsaved) {
      const result = await saveLink({
        url: tab.url,
        title: tab.title,
        source: SOURCE.MANUAL_SHORTCUT,
      });
      if (result.success) savedCount++;
      if (result.needsLogin) {
        const baseUrl = await getBaseUrl();
        chrome.tabs.create({ url: `${baseUrl}/login` });
        return;
      }
    }

    if (savedCount > 0) {
      await showNotification("Kept " + savedCount + " tabs", "All unsaved tabs have been saved");
    }
  }
});

chrome.bookmarks.onCreated.addListener(async (_id, bookmark) => {
  if (!bookmark.url) return;
  if (isRestrictedUrl(bookmark.url)) return;

  try {
    await saveLink({
      url: bookmark.url,
      title: bookmark.title || bookmark.url,
      source: SOURCE.BROWSER_BOOKMARK,
    });
  } catch (error) {
    console.error("[browser-bookmark-sync]", error);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "saveLink") {
    saveLink({
      url: message.url,
      title: message.title,
      source: message.source,
    }).then(sendResponse);
    return true;
  }

  if (message.action === "checkUrls") {
    checkUrls(message.urls).then(sendResponse);
    return true;
  }

  if (message.action === "x-bookmark-captured") {
    saveLink({
      url: message.url,
      title: message.url,
      source: SOURCE.X_BOOKMARK,
    }).then((result) => {
      if (result.success) {
        showXToast(message.url);
      }
    });
    return false;
  }
});

let lastXToastTime = 0;
let xToastBurstCount = 0;
let xToastBurstTimer = null;

function showXToast(url) {
  const now = Date.now();

  if (now - lastXToastTime < X_TOAST_RATE_LIMIT_MS) {
    xToastBurstCount++;
    if (xToastBurstTimer) clearTimeout(xToastBurstTimer);
    xToastBurstTimer = setTimeout(() => {
      if (xToastBurstCount > 0) {
        showNotification(
          "Kept " + (xToastBurstCount + 1) + " tweets",
          "Bookmarked tweets saved to Imported - X",
        );
        xToastBurstCount = 0;
      }
    }, X_TOAST_BURST_WINDOW_MS);
    return;
  }

  lastXToastTime = now;
  xToastBurstCount = 0;
  showNotification("Kept tweet", url);
}
