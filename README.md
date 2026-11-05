# DO Inspector HP

Private, privacy-first Chrome extension for HotelPlanner documentation review.

## Current status

Version 1.1.0 prototype. The supplied video attachment was not a valid playable MP4, so the exact site's notes editor has not been verified. This version includes manual field selection rather than pretending the integration is proven.

## Install

1. Download this repository as a ZIP and extract it.
2. Open Chrome and go to chrome://extensions.
3. Turn on Developer mode.
4. Click Load unpacked and select the extracted folder containing manifest.json.
5. Visit a HotelPlanner page and click the purple DI button.
6. For a Zendesk or other standard HTTPS page, click the extension toolbar icon and choose Open inspector on this tab.

## Workflow

1. Select field: click the actual notes input on the page.
2. Inspect: read prompts for unclear wording, unresolved follow-ups, status ambiguity and potential payment-card numbers.
3. Improve writing: conservative punctuation, capitalization and spacing cleanup, without adding facts or changing a booking status.
4. Review and edit the draft.
5. Apply to field: explicit confirmation required, and overwriting changed field text is blocked.
6. Use the site's normal Save action. The extension does not save or submit notes by itself.

## Automatic correction workflow

When an agent types or finishes editing a likely notes field, the extension waits briefly, reads the draft, and offers a conservative correction. Nothing is changed unless the agent clicks **Accept and apply** and confirms. **Reject suggestion** discards the draft. Existing saved notes and history are read-only. The feature is configurable in Settings. It has not yet been tested on the production note editor.

Timestamped activity pasted into the inspector is classified as system, automated activity, or agent note/review. A record attributed to an employee can still be an automated event (refund status, SMS, email, cancellation system logs). Classification is heuristic and is not evidence of who personally typed it or performed the action. Historical text cannot be rewritten or applied.

## Features

- Dark, minimal floating sidebar with Inspector, Abbreviations and Guide tabs.
- All 28 approved abbreviations from the shared reference chart.
- Additional terms and editable manual-verification checklist in Settings.
- Optional expansion of approved abbreviations (off by default).
- Copy the revised draft or apply to the selected field.
- Local-only rule-based processing. No AI or paid API is required.
- On HotelPlanner, launcher appears automatically; on other sites use user-invoked activation.
- No hardcoded admin FIT_ID or agent login.
- No booking APIs, tracking, analytics, note storage, or remote transmissions.
- Only settings are kept in Chrome Sync.

## Important safety rules

- Results are documentation suggestions, not a QA score.
- Do not assume requested refunds, cancellations, FOC approvals or callbacks occurred.
- No automatic Matrix violations, Documentation 0, or AUTO ZERO.
- Missing accessible documentation is not proof of a missing agent note.
- No full credit card or other sensitive payment details should be entered into notes.
- Site-specific verification is needed for editors inside iframes or frameworks that require custom event handling.

## Source files

- manifest.json: Chrome MV3 extension permissions and HotelPlanner page injection.
- inspector.js and inspector.css: sidebar and inspection engine.
- popup.html / popup.js: manual tab activation.
- options.html / options.js: team preferences, abbreviations, checklist.

## Next production milestones

Validate real note field behavior using a playable recording or a redacted screenshot. Add Matrix-based reference checks with versioned approved policies. Introduce admin controls and optional AI only after access, privacy and hosting requirements have been approved.

## HotelPlanner Add Note navigation

Clicking **Add Note** navigates to the same ReservationXML page with the `#comments` fragment. The inspector now recognizes this fragment on any reservation, without using or storing a specific FIT_ID. It monitors likely agent note inputs and offers an Accept/Reject suggestion after 1.8 seconds of inactivity or shortly after the field loses focus. It never changes historical system or employee-attributed activity entries and does not automatically save any note. Exact compatibility with the live editor still requires a browser test.

## Version 1.1.0 — Auto-open Notes Inspector

On ReservationXML.htm, clicking into the textarea beside the **Add Note** button automatically opens the on-page inspector, even before the URL gets the #comments fragment. It stays separate from Chrome's toolbar popup, which browsers cannot programmatically open. A draft suggestion appears after typing stops, and the user must explicitly accept any replacement. Reload the unpacked extension in chrome://extensions and refresh the reservation tab to activate the update.

## Version 1.2.0 — Live Original Agent Notes

When an agent types in the identified HotelPlanner Add Note editor, every keystroke is mirrored into **Original agent notes** in the inspector automatically. No need to retype, paste, inspect or click Select Field. The original HotelPlanner field remains the source of truth. If the agent edits the notes after a correction suggestion, the outdated suggestion is discarded. After typing pauses, a fresh correction can be offered. Acceptance is still mandatory before any field replacement. Historical/system activity is not rewritten.
