# DO Inspector HP — v1.4.0

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
