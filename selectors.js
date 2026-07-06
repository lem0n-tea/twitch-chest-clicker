// selectors.js
//
// Single source of truth for the DOM hooks this extension depends on.
// Twitch's markup changes over time without notice, so if auto-claim stops
// working, this is the one file to check and update — open the Twitch
// player in devtools, find the current "Claim Bonus" element, and add its
// selector near the top of CLAIM_BUTTON_SELECTORS.
//
// Ordered most-stable-first: readable attributes (aria-label, data-a-target,
// data-test-selector) tend to survive redesigns better than auto-generated
// CSS class names, so those are tried first and class-based selectors are
// kept only as a last-resort fallback.

window.__chestClicker = {
  CLAIM_BUTTON_SELECTORS: [
    'button[aria-label="Claim Bonus"]',
    '[aria-label*="Claim Bonus" i]',
    'button[data-a-target="chat-claim-bonus-button"]',
    '[data-test-selector="community-points-claim"]',
    '.community-points-summary button[aria-label*="Claim" i]',
    '.claimable-bonus__icon',
    '.channel-points-reward-button'
  ],

  // Scope the MutationObserver to the player area instead of the whole
  // document, so unrelated page churn (chat messages, recommendations
  // rail, etc.) doesn't trigger unnecessary checks.
  PLAYER_ROOT_SELECTORS: [
    '[data-a-target="video-player"]',
    '.video-player',
    'main'
  ]
};
