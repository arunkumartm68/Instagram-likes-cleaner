# Instagram Likes Cleaner

A small Chrome extension that removes likes from Instagram posts and reels through the Likes activity page. Includes verified batches, loading recovery, and a draggable control panel.

Unofficial project. Not affiliated with, endorsed by, or supported by Instagram or Meta.

## Features

- Selects posts using page elements, rather than screen coordinates.
- Processes batches of up to 100 posts, including older likes.
- Counts a batch only when Instagram displays a matching success message.
- Scrolls to load more posts and continues automatically.
- Recovers from a 20-second loading stall by refreshing and resuming an active run in the same tab.
- Stops after three recovery refreshes without progress, on detected restrictions, or on an uncertain result.
- Start, Stop, and Close controls.
- Drag the panel by its title; its position is remembered locally.
- No build step, dependencies, analytics, or external service.

## Install

1. Download this repository using **Code → Download ZIP**, then extract it, or clone it with Git.
2. Keep the extracted folder in a permanent location on your computer.
3. In desktop Chrome, open `chrome://extensions/`.
4. Enable **Developer mode** and click **Load unpacked**.
5. Select the **extension** folder containing `manifest.json`, not the repository root.
6. Confirm **Instagram Likes Cleanup** appears and is enabled.

This is a locally loaded extension, not a Chrome Web Store listing. Review the source before installing. Moving or deleting the extension folder can prevent it from loading.

## Use

1. Sign in to the intended Instagram account yourself.
2. Open https://www.instagram.com/your_activity/interactions/likes/ directly. If you navigated there within Instagram and no panel appears, refresh the page.
3. Use Instagram in English, clear any date or account filters, and verify this is the account whose likes you want to remove.
4. Click **Start unliking all**. This authorizes the extension to select posts and confirm the Unlike dialogs for you.
5. Keep this one Likes tab open and your computer awake. Avoid manually selecting posts or running another cleanup tool at the same time.

Drag **Unlike all Instagram posts** at the top of the panel to move it. Dragging the description or buttons does not move the panel.

**Stop** prevents the next action; an already submitted batch may finish. **Close** requests a stop if running; click it again after the run stops to remove the panel. Refresh to show a closed panel again.

After restarting Chrome or your computer, open the Likes page and check the panel. Click Start if it is ready. An active run can resume when Chrome restores that tab's session data, so click Stop if you do not want it to continue.

## Recovery and limits

The extension selects up to 100 posts per batch; this is its configured batch size, not a guarantee of Instagram's current limits. When loading stalls for 20 seconds, it finishes any selected batch before refreshing. It does not automatically repeat an unconfirmed submission. Review the page before restarting after an error.

Instagram can restrict automated activity. This tool cannot guarantee account safety, completion, or removal of every like. It does not bypass restrictions. If Instagram reports a restriction, stop and wait. A filtered or incomplete activity view may hide remaining likes. Only an explicit empty-history message is treated as completion.

Chrome may slow background or minimized tabs. Sleep, a suspended/discarded tab, closing Chrome, or losing connectivity can interrupt progress. Desktop Chrome is the tested environment; Android Chrome and the Instagram mobile app are not supported. English labels and Instagram's page structure are required and can change.

## Privacy and permissions

The manifest injects scripts only on `https://www.instagram.com/your_activity/interactions/likes/*`. They run in Chrome's default isolated content-script world. The extension has no cookies, history, tabs, downloads, or broad website permission and includes no remote code.

The scripts read the Likes page's visible text and controls and click Instagram's normal interface. They do not read your password, request credentials, call private APIs, or send data to a developer server. Instagram still receives the normal requests caused by your actions.

The tool stores only operational state (active flag, confirmed count, batch count, recovery count) in the tab's Instagram `sessionStorage`, and panel coordinates in Instagram `localStorage`. These are **site storage, not private extension storage**: Instagram scripts can access or modify them. Do not treat the displayed counts as a security or audit record. No account names, post lists, or tokens are intentionally stored. Storage may be restored with a browser session and is not bound to a particular account; stop before switching accounts.

See [SECURITY.md](SECURITY.md) for the review scope and known limitations.

## Update or uninstall

Stop cleanup before updating. Replace the extension files, click its **Reload** button at `chrome://extensions/`, then refresh the Likes page. The version in this repository is 1.0.2.

To uninstall, click **Remove** on its Chrome extension card, then refresh any open Likes tabs to end existing scripts. Removing an extension does not necessarily clear Instagram site storage. Clearing Instagram site data also removes login/session data for the site.

## Development

The `extension/` directory is the complete installable extension. No bookmarklet is included.

Run the local checks with Node.js:

```sh
node --check extension/cleanup.js
node --check extension/drag.js
node --test tests/*.test.cjs
```

Live testing of the earlier version confirmed successful 100-post batches and title dragging. The release changes have local regression checks; Instagram behavior can change and is not covered by the local tests.
