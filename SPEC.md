# Twitch Bonus Chest Auto-Clicker — Chrome Extension Specification

## 1. Overview

A lightweight Chrome extension that runs inside an actual, open Twitch
broadcast tab and automatically clicks the periodic "claim bonus" (chest)
button when it appears — saving the user from having to notice and click it
manually while they're already watching. It performs no automation of
*viewing* itself: if a tab isn't open and playing a stream, the extension
does nothing.

## 2. Background

Twitch's web player periodically surfaces a "Claim Bonus" prompt (shown as a
treasure-chest icon) to viewers who've been actively watching. Clicking it
grants a batch of channel points. That's a normal, manual part of the
existing viewing experience — this extension automates noticing and clicking
that one button during a real, already-open viewing session. It does not
open, maintain, or fake a session on its own.

## 3. Goals / Non-Goals

**Goals**
- Detect the claim-bonus button when it renders inside an open twitch.tv tab.
- Click it automatically, without requiring the user to notice or act.
- Operate only on tabs the user actually has open — no simulated sessions,
  no background network calls to fake watch-time.
- Keep working across Twitch's single-page-app navigation (switching
  channel without a full page reload).
- Provide an on/off toggle and a visible count of claims made.

**Non-Goals**
- Simulating a watch session with no tab open — that's a different kind of
  tool entirely and out of scope here.
- Claiming points on a channel the user hasn't actually navigated to.
- Automating chat, follows, predictions, or anything beyond this one button.
- Any network calls outside the normal Twitch page the user loaded — no
  external servers, no independent API calls.

## 4. Functional Requirements

### 4.1 Detection & Auto-Click
| ID | Requirement |
|----|-------------|
| FR-1 | Content script injected on `https://www.twitch.tv/*` watches the DOM for the bonus-claim control. |
| FR-2 | Use a `MutationObserver` scoped to the player container (not the whole document) to catch the button's appearance efficiently. |
| FR-3 | When found, and the extension is enabled, dispatch a click on it. |
| FR-4 | Handle Twitch's client-side route changes (switching channel without a full reload) by re-attaching the observer to the new player root. |

### 4.2 Selector Resilience
| ID | Requirement |
|----|-------------|
| FR-5 | Locate the button via stable attributes first — `aria-label` text or a `data-a-target`/`data-test-selector`-style attribute — before falling back to CSS class names, since auto-generated classes are far more likely to change between Twitch deployments. |
| FR-6 | If no known selector matches, fail silently (no click, a console warning) rather than guessing and clicking the wrong element. |
| FR-7 | Keep all selector strings in one small config module, so a Twitch markup change only requires updating one file. |

### 4.3 User Controls
| ID | Requirement |
|----|-------------|
| FR-8 | Toolbar popup with a single on/off toggle. |
| FR-9 | Popup displays a running count of chests claimed in the current session. |
| FR-10 *(stretch)* | Options page to enable/disable per specific channel, rather than only globally. |

### 4.4 Feedback
| ID | Requirement |
|----|-------------|
| FR-11 | Briefly update the toolbar badge (e.g. a incrementing number) when a claim fires, giving visual confirmation without the user needing to watch for it. |

## 5. Architecture

**Manifest V3 structure**
- **Content script** (`content.js`) — runs in the Twitch page context; owns the `MutationObserver` and click logic.
- **Background service worker** (`background.js`) — holds enabled/disabled state, updates the badge on claim events.
- **Popup** (`popup.html` / `popup.js`) — toggle + counter UI, backed by `chrome.storage`.
- **Options page** *(optional)* — per-channel allow/deny list.

```
Twitch tab (twitch.tv/*)
      │
      ▼
content.js ──observes DOM──▶ [bonus button appears] ──▶ click()
      │
      │ chrome.runtime.sendMessage({ type: "claimed" })
      ▼
background.js ──updates badge, persists count to chrome.storage
      │
      ▼
popup.js ──reads chrome.storage──▶ renders toggle + count
```

## 6. Permissions & Manifest

```json
{
  "manifest_version": 3,
  "name": "Twitch Bonus Chest Auto-Clicker",
  "version": "1.0.0",
  "description": "Automatically claims the Twitch bonus point chest while you're watching.",
  "permissions": ["storage"],
  "host_permissions": ["https://www.twitch.tv/*"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.twitch.tv/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html"
  },
  "icons": {
    "16": "icon16.png",
    "48": "icon48.png",
    "128": "icon128.png"
  }
}
```

Notes: no `<all_urls>`, no external network permissions, no `activeTab`
beyond what the content-script match pattern already grants — the extension
only ever needs to see and interact with the twitch.tv DOM.

## 7. Non-Functional Requirements

- **No outbound network calls** initiated by the extension itself — it only
  interacts with the DOM of a page the user already has open.
- **Local-only data** — claim counts live in `chrome.storage.local`; nothing
  leaves the browser.
- **Low overhead** — a single scoped `MutationObserver`, not a polling loop
  and not one observer per document-wide subtree.
- **Non-interference** — shouldn't break playback or conflict with other
  extensions (ad blockers, BTTV/7TV, etc.) or Twitch's own UI updates.

## 8. Testing Plan

- Manual test: open a live channel, wait for the bonus prompt, confirm it's
  clicked automatically shortly after appearing.
- SPA navigation test: switch channels via Twitch's in-app navigation
  (no full reload) and confirm the observer re-attaches to the new player.
- Toggle test: disable the extension mid-stream and confirm no further
  auto-clicks occur until re-enabled.
- Selector-break test: point the config at a nonexistent attribute and
  confirm the extension fails silently instead of clicking an unrelated
  element.

## 9. Milestones

1. **M1** — Detect and log when the bonus button appears (no click yet).
2. **M2** — Auto-click + on/off popup toggle.
3. **M3** — Claim counter + badge feedback.
4. **M4** *(stretch)* — SPA navigation hardening + per-channel options.

## 10. Open Risks

- **Selector drift** — Twitch UI changes are the main maintenance burden;
  keeping selectors isolated in one file (FR-7) keeps fixes small.
- **Store listing accuracy** — if this is ever published to the Chrome Web
  Store, the listing should describe plainly what it does (auto-clicks a
  reward button) so review and users aren't surprised.
- **Still an automated click** — this is a much lighter version of the ToS
  consideration from the bot spec: a real human is watching, but the click
  itself is programmatic rather than manual. Worth knowing that distinction
  doesn't necessarily make it explicitly sanctioned by Twitch, even though
  it's a far smaller deviation from normal use than the standalone bot.
