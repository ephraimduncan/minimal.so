const loadingEl = document.getElementById("loading");
const contentEl = document.getElementById("content");
const currentTabSection = document.getElementById("current-tab-section");
const allTabsSection = document.getElementById("all-tabs-section");
const feedbackEl = document.getElementById("feedback");

let activeTab = null;
let unsavedTabs = [];

function showFeedback(message, type) {
  feedbackEl.textContent = message;
  feedbackEl.className = "feedback " + (type || "");
  if (type) {
    setTimeout(() => {
      feedbackEl.textContent = "";
      feedbackEl.className = "feedback";
    }, 3000);
  }
}

function renderCurrentTab(isSaved) {
  currentTabSection.innerHTML = "";

  if (isSaved) {
    const status = document.createElement("div");
    status.className = "status saved";
    status.innerHTML = '<span class="dot"></span>Already kept';
    currentTabSection.appendChild(status);
    return;
  }

  const btn = document.createElement("button");
  btn.className = "btn-primary";
  btn.textContent = "Keep current tab";
  btn.addEventListener("click", handleKeepCurrent);
  currentTabSection.appendChild(btn);
}

function renderAllTabs(count) {
  allTabsSection.innerHTML = "";

  if (count <= 0) return;

  const btn = document.createElement("button");
  btn.className = "btn-secondary";
  btn.textContent = "Keep all tabs (" + count + ")";
  btn.addEventListener("click", handleKeepAll);
  allTabsSection.appendChild(btn);
}

async function handleKeepCurrent() {
  if (!activeTab || isRestrictedUrl(activeTab.url)) return;

  const btn = currentTabSection.querySelector("button");
  if (btn) btn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: "saveLink",
      url: activeTab.url,
      title: activeTab.title,
      source: SOURCE.MANUAL_POPUP,
    });

    if (response && response.success) {
      renderCurrentTab(true);
      showFeedback("Saved!", "success");
    } else if (response && response.needsLogin) {
      showFeedback("Please log in first", "error");
    } else {
      showFeedback(
        (response && response.message) || "Failed to save",
        "error",
      );
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    console.error("Save error:", err);
    showFeedback("Something went wrong", "error");
    if (btn) btn.disabled = false;
  }
}

async function handleKeepAll() {
  if (unsavedTabs.length === 0) return;

  const btn = allTabsSection.querySelector("button");
  if (btn) btn.disabled = true;

  let savedCount = 0;
  let failCount = 0;

  for (const tab of unsavedTabs) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: "saveLink",
        url: tab.url,
        title: tab.title,
        source: SOURCE.MANUAL_POPUP,
      });

      if (response && response.success) {
        savedCount++;
      } else if (response && response.needsLogin) {
        showFeedback("Please log in first", "error");
        return;
      } else {
        failCount++;
      }
    } catch {
      failCount++;
    }
  }

  if (savedCount > 0 && failCount === 0) {
    showFeedback("Saved " + savedCount + " tabs!", "success");
    renderAllTabs(0);
    if (activeTab) renderCurrentTab(true);
  } else if (savedCount > 0) {
    showFeedback(
      "Saved " + savedCount + ", " + failCount + " failed",
      "error",
    );
    renderAllTabs(failCount);
  } else {
    showFeedback("Failed to save tabs", "error");
    if (btn) btn.disabled = false;
  }
}

async function initialize() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    activeTab = tab;

    const allTabs = await chrome.tabs.query({ currentWindow: true });
    const httpTabs = allTabs.filter(
      (t) => t.url && !isRestrictedUrl(t.url) && /^https?:\/\//i.test(t.url),
    );

    if (httpTabs.length === 0) {
      loadingEl.style.display = "none";
      contentEl.style.display = "block";
      renderCurrentTab(false);
      const btn = currentTabSection.querySelector("button");
      if (btn) btn.disabled = true;
      return;
    }

    const urls = httpTabs.map((t) => t.url);

    let savedMap = {};
    try {
      const response = await chrome.runtime.sendMessage({
        action: "checkUrls",
        urls,
      });
      if (response && response.saved) {
        savedMap = response.saved;
      }
    } catch {
    }

    const currentSaved = activeTab && activeTab.url ? !!savedMap[activeTab.url] : false;

    unsavedTabs = httpTabs.filter((t) => !savedMap[t.url]);

    loadingEl.style.display = "none";
    contentEl.style.display = "block";

    const isCurrentRestricted = !activeTab || !activeTab.url || isRestrictedUrl(activeTab.url);
    if (isCurrentRestricted) {
      renderCurrentTab(false);
      const btn = currentTabSection.querySelector("button");
      if (btn) btn.disabled = true;
    } else {
      renderCurrentTab(currentSaved);
    }

    const allUnsavedCount = unsavedTabs.length;
    renderAllTabs(allUnsavedCount > 1 || (allUnsavedCount === 1 && currentSaved) ? allUnsavedCount : 0);
  } catch (err) {
    console.error("Init error:", err);
    loadingEl.textContent = "Something went wrong";
  }
}

document.addEventListener("DOMContentLoaded", initialize);
