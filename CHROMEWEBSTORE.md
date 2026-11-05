# Doc-Inspector-HP — Chrome Web Store Submission (v1.5.9)

## Store listing

**Name:** Doc-Inspector-HP

**Short description:**
Offline writing assistance for reservation agents. Review spelling, punctuation, and clearer notes before saving them.

**Category:** Productivity

**Language:** English

**Detailed description:**

Doc-Inspector-HP helps reservation support agents write clearer notes while working on HotelPlanner pages.

The extension mirrors text from the Notes field into a compact writing assistant and prepares optional improvements after the agent pauses. It provides spelling and punctuation corrections, conservative readability suggestions, and a searchable glossary of approved documentation abbreviations.

Agents remain in control. They can review a suggested draft, accept or reject it, or stop, minimize, or hide the assistant. Changes are never submitted automatically. The agent must use HotelPlanner's usual Add Note workflow to save documentation.

Features:
- Live preview of notes entered on supported HotelPlanner pages
- Offline proofreading using bundled local rules, Harper, and selected OpenGrammar rules
- Optional capitalization, spelling, punctuation, and readability improvements
- Recognition of approved abbreviations and H-prefixed itinerary identifiers
- Accept or reject proposed corrections
- Stop, Resume, Minimize, and Hide controls
- No paid AI subscription or external grammar service required

Designed as an optional writing helper, not a call-monitoring or agent-scoring application.

## Privacy tab — single purpose

To help reservation support agents improve spelling, punctuation, and readability of their documentation while they work, without automatically submitting or changing reservations.

## Permission justifications

**activeTab** — Allows the agent to manually activate the writing assistant on a website tab they choose.

**scripting** — Allows the user-initiated extension popup to inject the assistant's local JavaScript and CSS into the selected tab.

**storage** — Stores the agent's writing preferences and custom approved abbreviations. Reservation note contents are not saved to extension storage.

**Host site access** — Content scripts operate automatically on HotelPlanner pages to detect the Notes editor and show live writing suggestions. They do not access unrelated sites automatically.

**Remote code** — No. Grammar engines and rules are bundled in the extension. The extension does not download and execute code from an external location.

## User data review

Because the extension reads text entered into reservation notes (which may contain personal booking information), disclose that it processes personal communication / user-provided website content locally as appropriate to the dashboard's exact categories. Do not mark "no user data handled" merely because no server upload occurs. Verify the actual dashboard labels. The only synchronized data should be extension preferences.

**Privacy policy URL** — REQUIRED: Host the policy text in PRIVACY_POLICY.md on an accessible HTTPS site and paste its public URL here. The GitHub repository is PRIVATE, so a link to this repository file is not a valid public privacy URL.

## Reviewer test instructions

1. Install the extension and open a permitted HotelPlanner reservation details page.
2. Scroll to the Notes section. Use a test reservation, not live customer information.
3. Click inside the editable note textarea above Add Note. The writing assistant should appear.
4. Enter: "GST CALLED BECUZ HIS RSV WAS NOT SHOWING AT THE HTL. I TRYED TO CALL FD BUT NOBODY ANSWERD."
5. Stop typing. The assistant should show the original note and an optional improved draft.
6. Review the corrected draft; test Reject and Accept. Accept populates the note field, but does not submit it.
7. Verify Stop / Resume, Minimize and Hide controls.
8. No need to click Add Note in the review, and no real reservation should be changed.

**Access warning:** Some HotelPlanner reservation pages require valid credentials. Do not give reviewers personal admin credentials or live guest data. If Google asks for a test account, provide only an authorized least-privileged test account or a reviewer-accessible demo under company approval. Reviewers may otherwise be unable to verify functionality.

## Distribution recommendation

Start with **Private / trusted testers** while piloting. Private access is limited to named testers. For wider team access, Unlisted is possible, but anyone who has the store URL may be able to install; it does not enforce staff login. Decide based on company authorization and your intended access-control approach.

## Required materials

- Built extension ZIP: GitHub Actions v1.5.9, not the raw source ZIP
- 128x128 icon included in extension (also upload it in the listing)
- At least one 1280x800 screenshot showing the ACTUAL extension with fictional booking data, no real guest details
- Optional 440x280 promotional tile
- Public HTTPS privacy policy URL
- Developer contact information in the dashboard
- Verified Chrome Web Store developer account with two-step verification

## Final release gate

Test live note mirroring, spelling, Accept/Reject, no automatic submission, controls, default icon, and privacy behavior in Chrome using dummy data before submitting. Select deferred publishing if you want approval without immediate release.

## Chrome dashboard

https://chrome.google.com/webstore/devconsole

## Useful official guidance

https://developer.chrome.com/docs/webstore/cws-dashboard-listing
https://developer.chrome.com/docs/webstore/cws-dashboard-privacy
https://developer.chrome.com/docs/webstore/cws-dashboard-distribution
