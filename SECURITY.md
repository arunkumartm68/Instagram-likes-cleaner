# Security and privacy

## Review scope

Source review covers the manifest, popup, cleanup script, and dragging script in this repository. It is not an independent security audit or a guarantee about Instagram account restrictions.

The publication contains extension source and documentation only. No browser profile, account screenshots, cookies, credentials, account identifiers, or bookmarklet files are included.

## Findings and safeguards

- Content scripts are limited to the Instagram Likes activity URL and run in the default isolated world.
- No remote dependencies, network clients, telemetry, credential collection, dynamic code evaluation, or private API requests are included.
- The interface uses fixed HTML; status messages are assigned with `textContent`.
- A batch must have an explicit matching completion message before its count is recorded.
- Automatic resume is disarmed before confirmation is submitted, preventing automatic repetition when the result is uncertain.
- Release 1.0.2 cancels a queued automatic restart when Stop or Close is clicked and handles a null stored state safely.
- Dragging clamps the panel within the viewport and saves only coordinates.

## Remaining limitations

- DOM labels, counts, and completion messages come from Instagram's page. They are not a trusted transaction receipt and can change or be manipulated by the page or another extension.
- Operational state is kept in Instagram site storage, accessible to site scripts. There is no account-specific resume binding or cross-tab lock. Stop before switching accounts and run in only one tab.
- Session restoration can restore an active run. Check the panel when reopening Chrome.
- Automation may cause platform restrictions; no account-safety guarantee is offered.
- A submitted action cannot be cancelled by Stop. There is no automatic undo or backup of removed likes.

## Reporting

Report ordinary bugs through repository Issues. For a vulnerability involving private data, use GitHub's private vulnerability reporting if enabled, or contact the repository owner privately. Never put credentials, cookies, private screenshots, or session tokens in a public issue.
