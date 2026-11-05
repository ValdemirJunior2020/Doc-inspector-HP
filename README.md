# Doc-Inspector-HP — v1.4.0

A lightweight writing assistant for HotelPlanner reservation agents. No QA evaluation, scoring, coaching checklist, or compliance dashboard is shown to agents.

## What agents see
- Live mirror of notes typed in HotelPlanner's Add Note text box.
- Optional writing corrections after a pause.
- Accept / Reject; no automatic save, booking action, or note submission.
- Approved abbreviation glossary and conservative punctuation improvements.
- Optional reminder if notes may contain a full payment-card number.
- Stop / Resume, Minimize, and Hide controls.

## Install locally
1. Download the repository ZIP and extract it.
2. Open chrome://extensions, enable Developer mode, and choose Load unpacked.
3. Select the folder containing manifest.json.
4. Refresh the HotelPlanner tab after reloading the extension.

## Safeguards
All note processing is local in the browser; only user settings are stored using Chrome Sync. No note content is stored or transmitted. Automated and historical activity isn't rewritten. Suggested text is applied to the selected editor only with explicit user confirmation, and still requires the website's normal save action. The extension is a writing helper, not an evaluation tool.

## Release changes
v1.4.0 removes the documentation checklist, QA-style findings and Matrix/scoring language from the agent UI and settings. It keeps the existing note mirroring, approved abbreviations, editing suggestions and controls. Before publishing to the Chrome Web Store, test the extension on HotelPlanner's real note editor with non-sensitive example data.

## Version 1.5.0 — ALL CAPS and offline Harper

- If a note is predominantly ALL CAPS, the proposed draft changes ordinary words to lowercase and capitalizes sentence starts.
- Preserves common official abbreviations (e.g. GST, SW, FD, FOC), H-prefixed 8-digit itinerary numbers and numeric amounts.
- Adds conservative punctuation and spacing fixes. It does not invent facts or infer unrecorded actions.
- **Review proper names:** all-capital names may need agent capitalization adjustments.
- Optional `harper.js` grammar suggestions run in an isolated offline Web Worker **in the built distribution**. They are informational; they are not silently applied or sent to any server.
- Agents retain Accept, Reject, Stop, Minimize and Hide.

### Build the actual Harper-enabled extension

The repository source ZIP is **not** the final Harper-enabled package; `harper-worker.js` is generated during the build and is not checked in.

On a computer with Node.js 22:

1. `npm install`
2. `npm test`
3. `npm run build`
4. Load the `dist` directory from `chrome://extensions`.

Alternatively, use the GitHub Actions **Build Chrome extension ZIP** workflow and download its successful `Doc-Inspector-HP-v1.5.0` artifact. Upload the **ZIP inside the artifact** to the Chrome Web Store, after testing and providing store icons/screenshots.

Harper is open source, Apache-2.0 licensed: https://github.com/Automattic/harper. The compiled Harper code runs locally in the extension. No remote runtime scripts or APIs are used.

### Safety and status

The Harper worker build is provided but has **not been executed or validated here**, so do not claim the packaged extension is ready until CI succeeds and a live browser test passes. If the worker is unavailable, the normal casing/punctuation draft still works. No note is overwritten or saved without the agent's approval.

## Version 1.5.1 — Short ALL-CAPS fix

Short notes are now corrected, including `I CANNOT` to `I cannot.` and `NO REFUND` to `No refund.` Approved abbreviations and H######## itineraries remain protected. Suggestions refresh automatically after an agent pauses typing, without taking keyboard focus away from the HotelPlanner editor. No changes are saved until an agent accepts them. CI runs capitalization regression tests before building the Chrome ZIP.

## Version 1.5.2 — Chrome icon

Custom logo uses brand blue `#03549C`, a clean white document and a checkmark. The master SVG lives at `assets/icon.svg`; the automated build generates Chrome icon PNGs in 16, 32, 48 and 128 pixels and places them in the extension ZIP. Chrome's toolbar and extensions page now display the logo rather than the default letter icon.

## Version 1.5.3 — Fix missing icons on Load unpacked

The raw GitHub source ZIP no longer refers to PNG icons which have not been generated yet, so Chrome can load it for development (using a generic Chrome icon). For the full branded icon and bundled Harper grammar engine, use the successfully built **Doc-Inspector-HP-v1.5.3** ZIP artifact from GitHub Actions, extract the inner ZIP and select its folder in Chrome via Load unpacked. The build now injects the PNG icons into the distribution manifest after generating them from assets/icon.svg.

## Version 1.5.4 — Consistent product name
The extension, popup, panel, settings and packaged artifact use the official display name **Doc-Inspector-HP**.

## Version 1.5.5 — Offline spelling fixes now appear in the improved draft

The Harper worker sends a corrected draft back to the inspector instead of sending informational error messages only. The worker offers conservative single-word spelling fixes, with fallback corrections for common errors such as `upsett`, `becuz`, `tryed`, `answerd`, `refunnd`, and `tommorow`. Approved abbreviations, monetary amounts and H-prefixed itinerary numbers are protected. The agent's original note is never changed without Accept and Apply; delayed suggestions cannot overwrite an agent-edited or rejected draft.

This is not a full AI rewrite; context-dependent grammar and punctuation may still require agent review.

## v1.5.6 — Reliable spelling in the improved draft
The improved draft now applies a conservative set of common spelling corrections directly in the page, before optional Harper checking. This means short agent notes and test phrases such as "GST WAS UPSETT BECUZ I TRYED TO CALL FD BUT NOBODY ANSWERD" can display corrected spelling even when Harper cannot initialize. Added regression tests; original notes still require explicit agent acceptance before replacement.

**Engine decision:** Keep the existing Harper offline engine optional rather than introducing OpenGrammar, a LanguageTool server, or a separate desktop program into a Chrome extension used during live calls. No network endpoint or personal guest text is sent to a third party. Domain abbreviations and itinerary IDs remain protected. Not every typo, tense, or punctuation issue is automatically fixable; agents review the draft.

## Version 1.5.7 — Local OpenGrammar rules + Harper

This release **bundles a curated subset of OpenGrammar's original grammar rules** (not its whole browser extension or server), in addition to Harper and local HotelPlanner-safe spelling and punctuation corrections. Original OpenGrammar source is vendored in `src/vendor/opengrammar/rules`. Only a narrowly approved set of unambiguous spelling/grammar corrections can be applied automatically to the proposed draft; the agent still chooses Accept or Reject. It runs entirely inside the extension without calling OpenGrammar's backend, any public endpoints, or an API key. Guest notes never leave the browser.

OpenGrammar upstream: https://github.com/swadhinbiswas/opengrammar (root repository Apache-2.0 LICENSE; backend package metadata declares MIT). Refer to upstream for current licensing and attribution. No wholesale OpenGrammar server or telemetry has been included. The source is integrated as a compatibility-tested local subset rather than promising all OpenGrammar features.

## v1.5.8 — More readable agent notes

Adds narrowly scoped sentence-boundary and comma improvements to long notes while keeping refunds, cancellations, approvals, and follow-up statuses unchanged. This is an optional draft only; agents must accept any replacement. Regression tests cover uncertainty preservation and the established writing workflow.
