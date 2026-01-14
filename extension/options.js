const baseUrlInput = document.getElementById("baseUrl");
const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("save");

async function loadSettings() {
  const { baseUrl } = await chrome.storage.sync.get(["baseUrl"]);
  baseUrlInput.value = baseUrl || DEFAULT_BASE_URL;
}

async function saveSettings() {
  const baseUrl = baseUrlInput.value.trim() || DEFAULT_BASE_URL;
  const normalizedUrl = baseUrl.replace(/\/+$/, "");

  await chrome.storage.sync.set({ baseUrl: normalizedUrl });
  baseUrlInput.value = normalizedUrl;

  statusEl.classList.add("visible");
  setTimeout(() => statusEl.classList.remove("visible"), 2000);
}

document.addEventListener("DOMContentLoaded", loadSettings);
saveBtn.addEventListener("click", saveSettings);
