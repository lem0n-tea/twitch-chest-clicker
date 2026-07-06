# Twitch Bonus Chest Auto-Clicker

Automatically clicks Twitch's "Claim Bonus" chest while you're watching a
stream, in a tab you already have open. It doesn't open broadcasts, run in
the background when Twitch isn't loaded, or make any network calls of its
own — see `SPEC.md` for the full design.

## Load it in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and select this folder.
4. Open a live Twitch channel — the toolbar icon badge will start counting
   claims as they happen.

## If it stops claiming

Twitch changes its site markup from time to time, which is the main way
this can break. To fix it:

1. Open a live channel, open DevTools (F12), and find the current "Claim
   Bonus" button in the Elements panel next time it appears.
2. Note a stable-looking attribute on it (`aria-label`, `data-a-target`, or
   `data-test-selector` are usually more durable than class names).
3. Add that selector near the top of `CLAIM_BUTTON_SELECTORS` in
   `selectors.js` — that's the only file this should ever require editing.
4. Reload the extension from `chrome://extensions`.

## Files

| File | Purpose |
|---|---|
| `manifest.json` | Extension manifest (Manifest V3). |
| `selectors.js` | The DOM selectors the extension looks for — edit this first if something breaks. |
| `content.js` | Watches the page and clicks the claim button. |
| `background.js` | Tracks the claim count and updates the toolbar badge. |
| `popup.html/css/js` | The on/off toggle and counter UI. |
| `icons/` | Toolbar icons. |
