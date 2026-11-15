# Integration results — 11 November 2026

## Outcome and boundary

The React + existing Java HttpServer + MySQL path is implemented and was exercised with real services. Accounts, reports, ownership, status changes, profile changes and sessions are database-backed. Browser reports are visible to another authenticated student.

**The normal MySQL80 instance on 127.0.0.1:3306 remains unconfigured for this project.** Its service was running, but no database credentials were supplied. A no-password connection returned MySQL error 1045. Its database existence, tables and data could not be inspected. No migration was applied to it. Fill in the ignored root `.env` and follow README Terminal 1–3 to connect the normal installation.

Testing used installed MySQL Server 8.0.46 with an independent data directory at `.local/mysql-test/data`, loopback port **13306**, and database `digital_lost_found`. This was actual MySQL, not a stub, H2 database, localStorage fallback or in-memory substitute. The normal MySQL80 service and its data were left intact. Test users/reports remain only in that isolated directory.

## Root causes found in the original checkout

1. `saveReport`, edit/delete/resolve, and `getMyReports` used `dlf-v1-items` in localStorage. `getItems` read Java's MySQL lists. A report was written into one store and searched for in another.
2. Login accepted any nonempty password and selected a browser/demo profile. Registration saved local browser accounts without authenticating against Java. Java exposed no login, registration or session HTTP routes.
3. Java accepted browser-supplied `userId` and permitted report updates/deletes without authenticating ownership. PUT could transfer the reported owner.
4. The UI expected `Open`/`Resolved`/`Returned`; existing database records used uppercase `LOST`/`FOUND`/`RETURNED`. Counters and owner actions therefore disagreed with database state.
5. Lost/found tables have independent IDs; details needed typed IDs and individual GET routes. Detail retrieval previously fell back to browser records.
6. The two existing uncommitted frontend changes added an outage banner and fallback to sample items on proxy/network failure. That concealed missing database integration. Their originals were copied to `.local/App.before-integration.jsx` and `.local/api.before-integration.js`; the banner now reports real errors, and sample fallback is removed.
7. Java was available inside PyCharm but absent from PATH. Maven was missing. MySQL existed and was running, but backend environment variables were absent.
8. The root `npm test` referenced missing `tests/api.test.cjs` and `tests/audit.cjs`; parity tests required deleted legacy HTML/JavaScript files and exact demo behavior. They now test the real API adapter and preserved design/routes instead.
9. The schema lacked sessions, registration numbers, report color/contact/image fields, creation timestamps and idempotency keys, so the form could not persist all its existing fields.

## Actual verification

| Check | Result and evidence |
| --- | --- |
| Node/npm | Node 20.20.0, npm 10.8.2; `npm install` completed |
| Java/Maven | Java 17.0.4.1; Maven 3.9.11 checksum verified, `mvn -version` succeeded |
| Frontend unit/regression tests | **9 passed, 0 failed**, including API writes/reads, auth failures, no demo fallback, IDs/statuses, original CSS/SVG hashes and all 13 routes |
| Frontend production build | **Passed**; Vite 8.3.4, 50 modules transformed, output in `frontend/dist` |
| Backend Maven build | **BUILD SUCCESS**, runnable dependency-inclusive JAR produced |
| Backend JUnit tests | **5 passed, 0 failures/errors**: password hashing/verification, malformed/legacy hashes, token format, unsafe-request rejection, safe database-failure response |
| Existing database smoke programs | **All 4 passed**: DatabaseConnectionTest, UserRepositoryTest, LostItemRepositoryTest, FoundItemRepositoryTest; actual INSERT/SELECT/UPDATE/DELETE and generated-key checks against isolated MySQL |
| Migration | Applied twice on an empty test database and again after creating reports/users. All succeeded. Populated rerun retained 6 test users, 3 lost reports and 2 found reports at that point |
| API integration | **13 groups passed** with actual MySQL and Java restart; recorded in `.local/integration-results.json` at `2026-11-11T08:04:51.539Z` |
| Vite proxy | `http://127.0.0.1:5173/api/health/db` returned `{database: "digital_lost_found", status: "ok"}` |
| Browser UI | Registered Student A/B, logged in, submitted lost and found reports, confirmed My Reports/Dashboard/public lists/details/search, logged out/in and refreshed |
| Ownership | Student B saw A's reports with no Edit Report link; real HTTP PUT/DELETE/PATCH attempts returned **403** for both types |
| Persistence | Reports and sessions survived a Java restart in the automated test, then a MySQL and Java restart in the browser test |
| Real database outage | After stopping the isolated MySQL server, `/api/health/db` returned **503** and the browser displayed the backend/MySQL connection error. No sample items appeared |
| Styling | Existing CSS and SVG files were untouched. Browser screenshot inspection confirmed the existing layout |

The first integration run found an anonymous detail-route null-unboxing defect introduced during implementation. It was fixed; the rerun passed. The first design hash run exposed the manifest's mixed LF/CRLF expectations on Windows; the comparison now accepts unchanged text across those line endings without changing any CSS/SVG.

Rebuilding a JAR while a server was running from that file caused a lazy class-loading failure during the extended restart check. Restarting from the completed JAR restored the app. `Start-Backend.ps1` now checks for an occupied port and runs a separate stable `.local/backend-running.jar` copy, preventing a later Maven build from replacing its open runtime artifact.

Maven emits shade warnings about dependency manifests and module metadata overlapping. The runnable artifact built and passed real execution checks; these were warnings, not build/test failures.

## Two-user workflow evidence

The API run registered distinct users, rejected duplicate email and incorrect passwords, saved lost calculator `lost-2` and found calculator `found-1`, queried MySQL directly to confirm their rows, and checked each owner's report list. It rejected spoofed browser ownership, preserved private contact fields, rejected another student's PUT/DELETE/PATCH requests, tested successful owner edits/status changes/deletion, and verified three simultaneous retries created one row. It also tested invalid dates, malformed JSON, missing fields, missing request headers, logout revocation and password changes.

The separate browser run created:

| UI report | MySQL table / ID | Owner ID | Persisted values |
| --- | --- | --- | --- |
| Browser Test Lost Calculator | lost_items / 3 | 7 | Electronics; Engineering Library; 2026-11-10; LOST |
| Browser Test Found Calculator | found_items / 5 | 7 | Electronics; Engineering Library; 2026-11-10; FOUND |

Student B's Dashboard showed both browser reports and **My Reports 0**. Searching Lost Items for `Browser Test` produced one result. Its detail link opened `item-details.html?id=lost-3`; Student B had no Edit Report link. The found detail link opened `item-details.html?id=found-5`. Browser refresh and subsequent service restarts preserved the found report and Student B's session. SQL queried the browser-created rows directly, confirming they were persisted by the form submission path.

## Database changes

`database/schema.sql` remains unchanged. `database/migrations/001_shared_reports_and_sessions.sql` adds only missing structures:

- `users.registration VARCHAR(40)`, nullable for old rows.
- Both item tables: nullable `color`, private `contact`, `image MEDIUMTEXT`, `client_request_id`, `request_hash`; and `created_at TIMESTAMP(6)` with a default timestamp.
- A unique `(user_id, client_request_id)` index on each item table. Existing rows with NULL request keys remain valid.
- `auth_sessions` with hashed token primary key, user foreign key, creation/expiry timestamps and an expiry index.

Existing item IDs, ownership relationships, dates, descriptions and statuses are preserved. Old rows receive a migration-time creation timestamp because no original creation time existed. No claims/notification table was present in the repository schema, and none was added, dropped or altered. The migration has only been verified against the repository schema in the isolated MySQL instance; an independently modified team schema should be reviewed before applying it.

## Team handoff

Branch remained **feature/found-claims**. No branch switch, commit, push, destructive Git operation, stylesheet change or asset replacement was performed.

**Server.java is a shared file that needs coordination.** Existing report route names and the HttpServer/JDBC architecture remain. Route implementation is now in ItemHandler, auth in AuthHandler, and HTTP/error handling in Http. Teammates can keep adding their own `createContext` registrations to Server. No notification or claim-verification endpoint existed in this checkout; their namespaces are free.

The public frontend API method names for notifications/claims/contact remain available through `preview.js`. Those functions retain clearly labeled local UI previews, separate from real report/auth persistence. They have no live notification/claim server counterpart. Matching does not fabricate results. Password-reset email is still a non-sending preview.

## Remaining steps

1. Enter the normal MySQL username/password in root `.env` without sharing it in chat.
2. Run `scripts/Initialize-Database.ps1` for the normal 3306 database.
3. Run `scripts/Start-Backend.ps1`, then verify both health endpoints.
4. Run `npm install` and `npm run dev` from the repository root, using the existing Vite server if it is already running.
5. Register real application accounts and repeat the two-student flow against that database. Old browser-only reports/accounts are deliberately not treated as real records.

Exact terminal commands and Workbench alternatives are in README.md. Main-database readiness is not claimed until these credential-dependent steps succeed.

## Files changed or created

The inventory below is generated from the working tree; paths are relative to the repository root. `.env`, downloaded tools, test database files, logs, original-file backups and build outputs are Git-ignored local artifacts. `package-lock.json` was touched by npm installation with no semantic dependency diff.
- `.env.example`
- `.gitignore`
- `backend/pom.xml`
- `backend/src/main/java/com/digitallostfound/config/DatabaseConnection.java`
- `backend/src/main/java/com/digitallostfound/model/FoundItem.java`
- `backend/src/main/java/com/digitallostfound/model/LostItem.java`
- `backend/src/main/java/com/digitallostfound/model/User.java`
- `backend/src/main/java/com/digitallostfound/repository/FoundItemRepository.java`
- `backend/src/main/java/com/digitallostfound/repository/LostItemRepository.java`
- `backend/src/main/java/com/digitallostfound/repository/SessionRepository.java`
- `backend/src/main/java/com/digitallostfound/repository/UserRepository.java`
- `backend/src/main/java/com/digitallostfound/server/AuthHandler.java`
- `backend/src/main/java/com/digitallostfound/server/Http.java`
- `backend/src/main/java/com/digitallostfound/server/ItemHandler.java`
- `backend/src/main/java/com/digitallostfound/server/Server.java`
- `backend/src/main/java/com/digitallostfound/service/Passwords.java`
- `backend/src/test/java/com/digitallostfound/server/HttpTest.java`
- `backend/src/test/java/com/digitallostfound/service/PasswordsTest.java`
- `database/migrations/001_shared_reports_and_sessions.sql`
- `docs/INTEGRATION-RESULTS.md`
- `frontend/src/App.jsx`
- `frontend/src/components/Layout.jsx`
- `frontend/src/context/AppContext.jsx`
- `frontend/src/hooks.js`
- `frontend/src/pages/Auth.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Home.jsx`
- `frontend/src/pages/ItemDetails.jsx`
- `frontend/src/pages/Items.jsx`
- `frontend/src/pages/Matches.jsx`
- `frontend/src/pages/MyReports.jsx`
- `frontend/src/pages/Notifications.jsx`
- `frontend/src/pages/Profile.jsx`
- `frontend/src/pages/ReportItem.jsx`
- `frontend/src/services/api.js`
- `frontend/src/services/preview.js`
- `frontend/tests/api.test.mjs`
- `frontend/tests/parity.mjs`
- `frontend/vite.config.mjs`
- `package-lock.json`
- `package.json`
- `README.md`
- `scripts/Initialize-Database.ps1`
- `scripts/Install-Maven.ps1`
- `scripts/Start-Backend.ps1`
- `scripts/Start-Frontend.ps1`
- `scripts/Use-DevTools.ps1`
- `tests/integration.mjs`

Temporary test Java, Vite and isolated MySQL processes were stopped after verification. The normal MySQL80 Windows service remained Running. No test data directory was deleted.
