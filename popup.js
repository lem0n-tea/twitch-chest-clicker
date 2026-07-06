// popup.js
//
// Reads/writes chrome.storage.local directly. No messaging needed here —
// content.js reads the same "enabled" key before every click, so toggling
// it takes effect on the next check (within MIN_MS_BETWEEN_CHECKS).

const ENABLED_KEY = "chestClickerEnabled";
const COUNT_KEY = "chestClickerClaimCount";
const DELAY_KEY = "chestClickerRandomDelay";

const toggle = document.getElementById("enabledToggle");
const delayToggle = document.getElementById("delayToggle");
const statusLabel = document.getElementById("statusLabel");
const countNumber = document.getElementById("countNumber");
const resetButton = document.getElementById("resetButton");
const chestGlyph = document.getElementById("chestGlyph");

function render(enabled, count) {
  toggle.checked = enabled;
  statusLabel.textContent = enabled ? "Active" : "Paused";
  countNumber.textContent = count;
  chestGlyph.textContent = enabled ? "🧰" : "🔒";
}

chrome.storage.local.get(
  { [ENABLED_KEY]: true, [COUNT_KEY]: 0, [DELAY_KEY]: false },
  (data) => {
    render(Boolean(data[ENABLED_KEY]), data[COUNT_KEY]);
    delayToggle.checked = Boolean(data[DELAY_KEY]);
  }
);

toggle.addEventListener("change", () => {
  const enabled = toggle.checked;
  chrome.storage.local.set({ [ENABLED_KEY]: enabled });
  statusLabel.textContent = enabled ? "Active" : "Paused";
  chestGlyph.textContent = enabled ? "🧰" : "🔒";
});

delayToggle.addEventListener("change", () => {
  chrome.storage.local.set({ [DELAY_KEY]: delayToggle.checked });
});

resetButton.addEventListener("click", () => {
  chrome.storage.local.set({ [COUNT_KEY]: 0 });
  countNumber.textContent = "0";
  chrome.action.setBadgeText({ text: "" });
});

// Keep the popup in sync if the count changes while it's open (e.g. a
// claim happens right as the user has the popup open).
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes[COUNT_KEY]) {
    countNumber.textContent = changes[COUNT_KEY].newValue;
  }
  if (changes[ENABLED_KEY]) {
    const enabled = Boolean(changes[ENABLED_KEY].newValue);
    toggle.checked = enabled;
    statusLabel.textContent = enabled ? "Active" : "Paused";
    chestGlyph.textContent = enabled ? "🧰" : "🔒";
  }
});
