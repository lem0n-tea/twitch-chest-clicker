// background.js
//
// Holds the claim counter and reflects it on the toolbar badge. Makes no
// network requests of its own — it only reacts to messages from content.js.

const COUNT_KEY = "chestClickerClaimCount";
const BADGE_COLOR = "#9147FF"; // Twitch purple

chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === "claimed") {
    chrome.storage.local.get({ [COUNT_KEY]: 0 }, (data) => {
      const next = data[COUNT_KEY] + 1;
      chrome.storage.local.set({ [COUNT_KEY]: next });
      setBadge(next);
    });
  }
});

chrome.runtime.onInstalled.addListener(restoreBadge);
chrome.runtime.onStartup.addListener(restoreBadge);

function restoreBadge() {
  chrome.storage.local.get({ [COUNT_KEY]: 0 }, (data) => {
    if (data[COUNT_KEY] > 0) setBadge(data[COUNT_KEY]);
  });
}

function setBadge(count) {
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });
}
