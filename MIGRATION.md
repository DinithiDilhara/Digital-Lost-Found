# React migration

All 13 original pages are implemented in React with Vite and JSX. React Router retains the existing `.html` URLs and query parameters. The original files remain available for comparison.

## Files

- Added root `package.json` and `package-lock.json` for React, React DOM, React Router, Vite, and the Vite React plugin.
- Added `frontend/index.html`, `frontend/package.json`, and `frontend/vite.config.mjs`.
- Added `frontend/src/main.jsx` and `App.jsx` for mounting, routing, authentication guards, page titles, and scroll behavior.
- Added `frontend/src/pages/`: Home, Auth (login/register), Dashboard, Items (lost/found/search), ItemDetails, Matches, ReportItem, MyReports, Notifications, and Profile.
- Added `frontend/src/components/`: shared layouts, navigation, footer, icons, buttons, item cards, fields, dialogs, and contact form.
- Added `frontend/src/context/AppContext.jsx`, `hooks.js`, and `utils.js` for session state, toasts, loading, responsive behavior, validation, and formatting.
- Added `frontend/src/services/` containing the original data, mock API, and inactive socket adapter converted to ES modules. Their business logic is unchanged.
- Added `frontend/scripts/sync-assets.mjs`, which copies the original assets before development/build.
- Added `frontend/tests/parity.mjs` and `frontend/original-files.sha256.json` for regression checks.
- Modified `.gitignore`, `README.md`, and `TESTING.md` for generated files and migration documentation.
- Removed no original files. All original HTML, JavaScript, CSS, and SVG assets remain byte-for-byte unchanged.

## Appearance and behavior

React imports the five original CSS files in their original order. It uses the same assets, markup classes, validation messages, local storage keys, and mock API contracts. Forms and interactive elements use React state and event handlers; reusable dialogs use React portals and native dialog behavior.

The original HTML files have malformed doctypes and render in quirks mode. The React entry intentionally omits a doctype to preserve that rendering mode. Adding a standards-mode doctype changes inline spacing and would need a separate design review.

There is no Java backend in this checkout. The API remains a local browser-storage prototype with an unused `http://localhost:5000/api` constant. No requests or WebSocket connections were introduced. Existing data is available when the React app is served on the same origin; browser storage is separate across different ports.

## Commands

Run these from the project root with Node.js 20.19+ or 22.12+:

```sh
npm install
npm run dev
```

Open the Vite URL, normally `http://127.0.0.1:5173/`. Do not use Live Server for the React version.

```sh
npm test
npm run build
npm run preview
```

Production output is `frontend/dist/`. The production host must fall back to its `index.html` for React routes, including the existing `.html` paths.

## Verification and remaining limits

The original six API tests, original static audit, and five migration tests verify original-file preservation, exact service implementation parity, full-session outputs and storage, CSS import order, and route coverage.

An initial production build passed. Desktop DOM geometry, content, fonts, and colors were compared between both versions for Home, Dashboard, Lost Items, Found Items, Search, Report Item, Item Details, Possible Matches, My Reports, Notifications, and Profile. After preserving the rendering mode, measurements matched, apart from a 0.1px rounding difference on one button. React login and required-field validation were exercised.

Final browser verification is incomplete: the embedded browser crashed during the native date-picker test. Report creation through the UI, remaining interaction flows, registration comparison, mobile verification, and production-preview deep-link checks still need a browser pass. The final build rerun after formatting and the rendering-mode adjustment was blocked by the tool approval service's usage limit. The earlier build succeeded. These limits should not be treated as a completed end-to-end acceptance test.
