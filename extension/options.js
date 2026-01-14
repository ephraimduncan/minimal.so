const DEFAULT_BASE_URL = "http://localhost:3000";

async function loadSettings() {
  const result = await chrome.storage.sync.get(["baseUrl"]);
  document.getElementById("baseUrl").value = result.baseUrl || DEFAULT_BASE_URL;
}

async function saveSettings() {
  const baseUrl =
    document.getElementById("baseUrl").value.trim() || DEFAULT_BASE_URL;
  const normalizedUrl = baseUrl.replace(/\/+$/, "");

  await chrome.storage.sync.set({ baseUrl: normalizedUrl });
  document.getElementById("baseUrl").value = normalizedUrl;

  const status = document.getElementById("status");
  status.classList.add("visible");
  setTimeout(() => {
    status.classList.remove("visible");
  }, 2000);
}

document.addEventListener("DOMContentLoaded", loadSettings);
document.getElementById("save").addEventListener("click", saveSettings);
