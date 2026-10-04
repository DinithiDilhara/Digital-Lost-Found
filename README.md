# DigitalLostFound

A complete frontend prototype for the **Real-Time Campus Lost & Found System**, an EC5205 Operating Systems & Network Programming project.

Built with HTML5, CSS3, and vanilla JavaScript. No frameworks, build step, external libraries, remote fonts, backend, database, or live network communication. All illustrations are original local SVG assets.

## Color theme

The interface uses forest green (`#203d32`), a green primary accent (`#2d6a4f`), warm ivory backgrounds, and sage surfaces. Shared color tokens live at the top of `css/style.css`. Orange lost badges and green found badges remain distinct; item illustrations retain the colors described in their reports.

## Run

1. Open this folder in VS Code.
2. Right-click `index.html` and select **Open with Live Server**.
3. Start at the landing page, then register or log in.

You can also double-click `index.html`. Classic deferred scripts work without a module server. Browser storage policies for `file://` can vary; Live Server is recommended for reliable persistence between pages.

Optional static preview if Python is installed:

```sh
python -m http.server 5500 --bind 127.0.0.1
```

Open `http://127.0.0.1:5500/index.html`. This only serves static files; it is not an application backend.

## Try the demo

- Log in with `student@eng.ruh.ac.lk` and **any nonempty password** for the sample Nipuni profile, three reports, preset matches, and sample notifications.
- Any properly formatted, unregistered email opens the same sample student workspace. A newly registered email opens its own local profile with an empty report history.
- Registration validates all fields, email format, an eight-character minimum password, and matching passwords, then returns to Login.
- Passwords are never saved. Login does not verify credentials. The change-password and forgot-password dialogs preview their flows without storing credentials or sending email.
- Remember Me stores the mock session in localStorage. Otherwise the session uses sessionStorage. Logout clears both and returns to Home.
- Report lost or found items, preview an image, edit or delete your reports, and mark them resolved/returned.
- Search by name, category, color, location, or lost/found status. Combine category, location, date, and status filters. The header search opens `search.html`.
- Try claiming a found item. Ownership evidence is required, repeat claims are blocked, and a local notification is added. Contact messages are saved locally; **nothing is sent to another student**.
- The landing statistics are illustrative. Dashboard totals are calculated from the 16 sample records and your added reports.

## Project structure

```text
index.html                 Landing page
login.html                 Demo login
register.html              Local registration
dashboard.html             Overview, counts and activity
lost-items.html             Searchable lost items
found-items.html            Searchable found items
search.html                 Global search across all reports
report-item.html            Create and edit reports
item-details.html           Public item details, claim/contact dialogs
possible-matches.html       Preset match comparisons
my-reports.html             Manage personal reports
notifications.html          Read/unread notification center
profile.html                Profile editing and password flow preview
css/
  style.css                 Shared tokens, controls, cards and dialogs
  landing.css               Public home page
  auth.css                  Login and registration
  dashboard.css             Shared application layout and page styles
  responsive.css            Mobile, tablet, desktop and reduced motion
js/
  data.js                   Seed items, sample user, notifications, matches
  api.js                    Async data access and mock persistence
  socket.js                 Inactive future WebSocket adapter
  ui.js                     Icons, cards, navigation, dialogs and validation
  auth.js                   Authentication screens and validation
  dashboard.js              Overview rendering
  items.js                  Search, item details, matching, claiming
  reports.js                Report forms and personal report management
  notifications.js          Notification rendering and read state
  profile.js                Profile editing
  app.js                    Page routing, auth guards and landing page
assets/images/              12 local item illustrations
assets/icons/favicon.svg    Brand icon
tests/api.test.cjs           Mock API behavior tests
tests/audit.cjs              Syntax, asset and link checks
```

## Local persistence

Storage keys use the `dlf-v1-` prefix. Records include reports and uploaded images, profiles, registered account metadata, mock sessions, account-specific notifications, dismissed matches, claims, and demo messages. This is a disposable browser prototype, not a permanent database. Images accept JPEG, PNG and WebP up to 2 MB; browser storage capacity can still limit how many can be saved. A save failure leaves the form available with an error message.

To reset the demo, remove only keys starting with `dlf-v1-` (and `dlf-flash`) from this site's localStorage and sessionStorage in browser developer tools, then reload. Do not clear storage for unrelated websites.

## Connecting the backend later

**Start in `js/api.js`.** Each data function is async and returns ordinary objects or arrays, so you can replace its internals with `fetch()` without rewriting the page components. `API_BASE_URL` is reserved but currently unused. Suggested endpoint mapping:

| Frontend function | Future endpoint |
| --- | --- |
| `loginUser`, `registerUser`, `logout` | `POST /auth/login`, `/auth/register`, `/auth/logout` |
| `getUser`, `updateProfile` | `GET /me`, `PATCH /me` |
| `getItems`, `getLostItems`, `getFoundItems`, `searchItems` | `GET /items` with query/filter parameters |
| `getItem` | `GET /items/:id` |
| `reportLostItem`, `reportFoundItem` | `POST /items` |
| `updateReport`, `deleteReport`, `resolveReport` | `PATCH /items/:id`, `DELETE /items/:id` |
| `getMyReports` | `GET /me/reports` |
| `claimItem`, `contactReporter` | `POST /items/:id/claims`, `POST /items/:id/messages` |
| `getNotifications`, `markNotificationsRead` | `GET /notifications`, `PATCH /notifications/read` |
| `getMatches`, `dismissMatch` | `GET /matches`, `POST /matches/:id/dismiss` |

Replace the synchronous mock-session guard with server session verification when implementing real authentication. Real authorization, credential handling, ownership validation, claim review, uploads, and privacy controls must be enforced on that server. Keep sensitive contact fields out of public item responses. UI validation and browser login guards are prototype conveniences, not security boundaries.

## Connecting WebSocket updates later

Use **`js/socket.js`**. It contains `connectWebSocket()`, `disconnectWebSocket()`, `handleNotification()`, and `handlePossibleMatch()` placeholders. No `WebSocket` object is constructed and no connection is attempted. When the backend is ready, authenticate the connection after login, add reconnect/cleanup behavior, and route incoming events through the existing custom `dlf:notification` and `dlf:match` events. Page listeners can then reload data through `api.js` and refresh unread badges. Disconnect on logout. Preset matches are demo data; there is no AI matching algorithm.

## Verification

With Node.js installed:

```sh
node tests/api.test.cjs
node tests/audit.cjs
```

The browser smoke-test flow is Home → Register → Login → Dashboard → Lost Items → Details → Found Items → Report Item → My Reports → Possible Matches → Notifications → Profile → Logout. Also test an invalid form, an empty search, an uploaded image, claim evidence, read-state persistence, editing/deleting/resolving a report, public claim/contact redirects, and the collapsible mobile navigation.
