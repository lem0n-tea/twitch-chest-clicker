// content.js
//
// Runs inside an open twitch.tv tab. Watches for the "Claim Bonus" element
// and clicks it. Does nothing unless this tab is actually open — it never
// opens a broadcast, navigates, or runs when Twitch isn't loaded.

(function () {
  const { CLAIM_BUTTON_SELECTORS, PLAYER_ROOT_SELECTORS } = window.__chestClicker;
  const ENABLED_KEY = "chestClickerEnabled";
  const DELAY_KEY = "chestClickerRandomDelay";
  const MIN_MS_BETWEEN_CHECKS = 500;
  const WATCHDOG_INTERVAL_MS = 2000;
  const MAX_DELAY_MS = 30000;

  let observer = null;
  let observedRoot = null;
  let lastCheck = 0;
  let pendingClick = null;

  function randomDelayMs() {
    return Math.floor(Math.random() * (MAX_DELAY_MS + 1));
  }

  function scheduleDelayedClick(button, root) {
    if (pendingClick) {
      clearTimeout(pendingClick.id);
      pendingClick = null;
    }
    const delay = randomDelayMs();
    const id = setTimeout(() => {
      pendingClick = null;
      // Re-check the button is still in the DOM before clicking
      if (!document.contains(button)) return;
      clickButton(button);
    }, delay);
    pendingClick = { id, button };
    console.debug(`[Chest Clicker] Scheduling click in ${Math.round(delay / 1000)}s.`);
  }

  function cancelPendingClick() {
    if (pendingClick) {
      clearTimeout(pendingClick.id);
      pendingClick = null;
    }
  }

  function clickButton(button) {
    try {
      button.click();
      chrome.runtime.sendMessage({ type: "claimed", at: Date.now() });
      console.debug("[Chest Clicker] Claimed a bonus.");
    } catch (err) {
      console.warn("[Chest Clicker] Found a match but couldn't click it:", err);
    }
  }

  function settings(callback) {
    chrome.storage.local.get(
      { [ENABLED_KEY]: true, [DELAY_KEY]: false },
      callback
    );
  }

  function findFirst(selectors, root = document) {
    for (const selector of selectors) {
      const el = root.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function findClaimButton(root) {
    for (const selector of CLAIM_BUTTON_SELECTORS) {
      const match = root.querySelector(selector);
      if (match) {
        return match.closest("button") || match;
      }
    }
    return null;
  }

  function tryClaim(root) {
    const now = Date.now();
    if (now - lastCheck < MIN_MS_BETWEEN_CHECKS) return;
    lastCheck = now;

    settings((data) => {
      if (!data[ENABLED_KEY]) return;

      const button = findClaimButton(root);
      if (!button) {
        cancelPendingClick();
        return;
      }

      if (data[DELAY_KEY]) {
        // If we already have a pending click for this button, let it run
        if (pendingClick && pendingClick.button === button) return;
        scheduleDelayedClick(button, root);
      } else {
        cancelPendingClick();
        clickButton(button);
      }
    });
  }

  function attachObserver() {
    const summary = document.querySelector(".community-points-summary");
    const root = summary || document.body;

    if (root === observedRoot && observer) return; // already watching the right node

    if (observer) observer.disconnect();

    observedRoot = root;
    observer = new MutationObserver(() => tryClaim(root));
    observer.observe(root, { childList: true, subtree: true });

    // Covers the case where the button is already present before we attach.
    tryClaim(root);
  }

  function watchdog() {
    // Twitch's SPA navigation (switching channels without a full reload)
    // sometimes replaces the whole player subtree, which would silently
    // detach our observer from the live DOM. Re-attach if that happened.
    if (!observedRoot || !document.contains(observedRoot)) {
      attachObserver();
    }
  }

  attachObserver();
  setInterval(watchdog, WATCHDOG_INTERVAL_MS);
})();
