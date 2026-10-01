# Verification record

Verified against a local static HTTP preview on October 1, 2026.

- **6/6 automated mock API tests passed** with `node tests/api.test.cjs`.
- **Static audit passed:** 13 HTML pages, 266 local references, all 11 JavaScript files parsed, and all sample illustrations exist.
- Browser console: **no application errors** during the tested flows.
- Desktop screenshot reviewed at 1440px; tablet at 768px; mobile at 390px.
- All 13 pages checked at 320px: no horizontal overflow.
- Registration: required-field errors, valid submission, and redirect to Login.
- Login: invalid fields, show/hide password, sample account, registered account, and dashboard redirect.
- Report access redirects unauthenticated visitors to Login.
- Lost-item search and category filters narrow to the expected calculator.
- Found-item search includes matching color/category records.
- Details: lost and found item information, local contact dialog, claim evidence validation, and successful demo claim.
- Reports: create lost and found reports, PNG upload preview, edit saved content, mark lost as Resolved, mark found as Returned, and confirm deletion of test reports.
- My Reports: resolved tab shows resolved records and empty states work after deletion.
- Matches: preset comparisons render and Not My Item removes the chosen match.
- Notifications: mark all read updates the header count and persists across reload.
- Profile: edits update both the page and header.
- Mobile sidebar opens, navigates, closes on page transition, and supports logout.
- Logout returns to the public landing page.

The browser automation environment blocks `file://` navigation, so direct double-click launch could not be browser-tested. The app deliberately uses ordinary deferred scripts, local assets, and no module imports or fetch calls so it can run that way when the browser allows storage. Use Live Server for the verified, reliable workflow.

The Node test runner's worker-spawning mode (`node --test ...`) was blocked by the environment. Running `node tests/api.test.cjs` executes the same six tests directly and passes without dependencies.

`tests/fixture.png` is a tiny generated image used only for upload testing. No real account credentials, personal images, or external services were used.
