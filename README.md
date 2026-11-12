<<<<<<< Updated upstream
# Digital-Lost-Found
Real-time campus Lost &amp; Found system for EC5205 Operating Systems &amp; Network Programming

## Local database configuration

Copy `.env.example` to `.env` in the repository root and replace the
placeholders with your local MySQL credentials. The Java backend reads `DB_URL`,
`DB_USER`, and `DB_PASSWORD` from that file when process environment variables
are not set. Environment variables take precedence.

Never commit `.env` or paste its password into source control.

## Run locally

Run `npm run dev` from the repository root. The frontend waits for the Java
backend health endpoint before starting, so requests are not sent to port 5000
while Maven is still compiling the backend.
=======
# Digital Lost & Found

React + Vite, Java 17 HttpServer/JDBC, and MySQL. The root `package.json` owns the frontend dependencies and commands. The Java Maven project is `backend/`.

## Current status and one remaining local setup step

The integrated code has been tested against real MySQL 8.0.46, including two-user browser and API workflows. The existing Windows `MySQL80` service on port 3306 is running, but its credentials were not supplied. Tests therefore used a separate MySQL data directory under ignored `.local/mysql-test/` on port **13306**. No existing database tables or user data were deleted or modified by testing.

Before normal startup, fill in **DB_USER** and **DB_PASSWORD** in the repository-root `.env` file using your existing MySQL credentials. That file is ignored by Git. Do not put the password in source code or chat. `.env.example` is the safe configuration template. The example `.env` created during setup points to the normal database on **3306**, not the test instance.

The old browser-only demo accounts are not real accounts. Register a new account through the application. Existing database users with placeholder/plaintext password values are preserved, but those values are deliberately not accepted as valid password hashes. Browser-only reports were not silently imported or deleted.

## Tools on this laptop

- Node.js 20.20.0 and npm 10.8.2 are available.
- Java 17.0.4.1 and `javac` were found at `C:\Program Files\JetBrains\PyCharm Edu 2022.2.2\jbr`. They were missing from PATH. The backend compiled and ran with this Java installation.
- Apache Maven 3.9.11 was downloaded from Apache, SHA-512 checked, and installed under `.local/apache-maven-3.9.11/`.
- MySQL Server 8.0.46, Workbench, Shell and Router are installed. The `MySQL80` service is running. The client is `C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe`.
- Frontend dependencies were installed with `npm install`. Maven dependencies are cached under `.local/m2/`.
- No administrator installation or permanent PATH change was made.

Dot-source the helper in **each new PowerShell terminal**:

```powershell
Set-Location 'D:\Projects\Digital-Lost-Found'
. .\scripts\Use-DevTools.ps1
java -version
javac -version
mvn -version
node --version
npm --version
```

The helper loads `.env` and changes PATH only in that terminal. Existing environment variables can be used instead by omitting `.env`.

For another laptop, or if the bundled JetBrains Java is removed:

1. Download a Windows x64 **JDK 17 or newer** ZIP from [Eclipse Temurin](https://adoptium.net/temurin/releases/?version=17&os=windows&arch=x64&package=jdk).
2. Extract it to `.local/` so the JDK directory is `.local/jdk-.../`, or set `JAVA_HOME=C:\your\jdk-folder` in `.env`. Point at the JDK directory, not `bin`.
3. Run `powershell -File .\scripts\Install-Maven.ps1`. It downloads the pinned [Apache Maven 3.9.11 archive](https://archive.apache.org/dist/maven/maven-3/3.9.11/binaries/) and verifies its SHA-512 checksum before extraction.
4. Dot-source `Use-DevTools.ps1` and verify the versions above. If you prefer a system MSI installation or permanent PATH configuration, perform that manually; the portable setup does not need administrator access.

## Terminal 1 — MySQL

Working directory: **D:\Projects\Digital-Lost-Found**.

```powershell
Set-Location 'D:\Projects\Digital-Lost-Found'
Get-Service MySQL80
. .\scripts\Use-DevTools.ps1
mysql --version
mysql --host=127.0.0.1 --port=3306 --user=$env:DB_USER -p
```

Enter the database password at the MySQL prompt. Inspect the existing database without deleting anything:

```sql
SHOW DATABASES;
USE digital_lost_found;
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM lost_items;
SELECT COUNT(*) FROM found_items;
exit
```

If the database does not exist yet, the next command creates it. Apply the base schema and additive migration:

```powershell
.\scripts\Initialize-Database.ps1
```

This script loads `.env`, connects to the host/port/database in `DB_URL`, creates missing base tables, applies the report/session and private-messaging migrations, and prints database/table/count checks. It stops on SQL errors. It does not drop tables, delete rows, reset passwords, or overwrite existing records. Rerunning it is supported. Your MySQL account needs CREATE/ALTER privileges for this setup step, in addition to runtime SELECT/INSERT/UPDATE/DELETE privileges.

If the service is stopped, open an administrator PowerShell and run `Start-Service MySQL80`, then return to the normal terminal. It was already running on this laptop.

Workbench alternative: connect with your normal MySQL account; run `database/schema.sql`, select `digital_lost_found` as the default schema, then run `database/migrations/001_shared_reports_and_sessions.sql` and `database/migrations/002_private_messaging.sql`. The migrations operate on `DATABASE()`; select the correct database first.

If you do not know the password, use the credentials for your working Workbench connection or ask the person who configured MySQL to create a local application account and grant it access. Workbench being installed alone does not supply a password to Java. No password reset of the existing server has been attempted.

## Terminal 2 — Java backend

Working directory starts at **D:\Projects\Digital-Lost-Found**, then changes to **backend** for Maven.

Make sure `.env` contains your real local values:

```dotenv
DB_URL=jdbc:mysql://127.0.0.1:3306/digital_lost_found?connectTimeout=5000&socketTimeout=10000
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
```

Values are literal: do not surround them with quotes. The helper passes them as process environment variables. Java itself reads `DB_URL`, `DB_USER`, and `DB_PASSWORD`; it never embeds a password.

Recommended build-and-start command:

```powershell
Set-Location 'D:\Projects\Digital-Lost-Found'
. .\scripts\Use-DevTools.ps1
java -version
mvn -version
.\scripts\Start-Backend.ps1
```

Equivalent manual build/start:

```powershell
Set-Location 'D:\Projects\Digital-Lost-Found'
. .\scripts\Use-DevTools.ps1
Set-Location .\backend
mvn -B -ntp '-Dmaven.repo.local=D:/Projects/Digital-Lost-Found/.local/m2' package
# Continue only if BUILD SUCCESS appears.
java -jar .\target\digital-lost-found-backend-1.0-SNAPSHOT.jar
```

Stop a manually launched Java process with Ctrl+C **before rebuilding its JAR**. The startup helper uses a separate runtime copy and refuses to start over a server already listening on its port. It keeps the server in the terminal, so Ctrl+C stops it normally.

From Terminal 1 after Java starts:

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
Invoke-RestMethod http://127.0.0.1:5000/api/health/db
Invoke-RestMethod http://127.0.0.1:5000/api/lost-items
Invoke-RestMethod http://127.0.0.1:5000/api/found-items
```

`/health` checks the Java process. `/health/db` also checks the MySQL connection and required migrated columns/tables. Both should return `status: ok`; an empty report array is valid for a new database. Database failures return HTTP 503, never a successful fake write.

## Terminal 3 — React frontend

Working directory: **D:\Projects\Digital-Lost-Found**, not `frontend/`.

```powershell
Set-Location 'D:\Projects\Digital-Lost-Found'
. .\scripts\Use-DevTools.ps1
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. An equivalent helper is `powershell -File .\scripts\Start-Frontend.ps1`.

Vite proxies `/api` to `http://127.0.0.1:5000`, so cookies and requests stay on the same browser origin. Use the same hostname throughout; switching between `localhost` and `127.0.0.1` changes the browser cookie origin. The frontend shows connection errors if either backend or MySQL fails. It never substitutes sample reports.

From Terminal 1:

```powershell
Invoke-RestMethod http://127.0.0.1:5173/api/health/db
```

If port 5173 is already in use, reuse the existing project Vite server or stop it in its own terminal before starting another. Vite uses a strict port to avoid silently opening a different URL. For an intentional alternate port, run `npm run dev -- --port 5174`. If changing Java's `PORT`, also set `VITE_API_TARGET=http://127.0.0.1:YOUR_PORT` before starting Vite. The scripts load these optional settings from `.env`.

## Authentication and reports

- Registration stores a salted PBKDF2-SHA256 password hash. Login checks it.
- Opaque sessions are stored as token hashes in MySQL. The browser receives an HttpOnly, SameSite=Lax cookie. Session lifetime is 12 hours; Remember Me uses 30 days. Logout revokes the server session.
- HTTPS deployments must set `COOKIE_SECURE=true`. The development server binds to loopback.
- JSON writes require `X-DLF-Request: 1`; cross-origin browsers receive no CORS permission. React adds this header automatically through the Vite proxy.
- The authenticated session determines report ownership. JSON `userId`/`ownerId` values do not authorize anything. Edit/delete/status changes check ownership, including in their SQL WHERE clauses.
- New reports require an `Idempotency-Key` header. React reuses its key when retrying the same submission. The database unique index prevents simultaneous duplicate requests; changed content with the same key returns 409.
- Lost and found tables retain independent numeric IDs. React uses `lost-123` and `found-123`, avoiding collisions in detail/edit links.
- The UI maps legacy `LOST`/`FOUND` statuses to `Open` for the appropriate report type. A legacy lost report with `FOUND` is displayed as resolved.
- Dashboard, public lists, My Reports and details all read MySQL through Java. Public lists refresh every 15 seconds while visible and when the browser regains focus.
- Color, image, private contact, registration number and creation time now persist. Private contact is returned only to the owner. Images are limited to PNG/JPEG/WebP up to 2 MB and stored as data URLs in MySQL.

## API contract for teammates

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/health` | Java process health |
| GET | `/api/health/db` | Connection and migrated schema readiness |
| POST | `/api/auth/register` | Create user; name, registration, email, password |
| POST | `/api/auth/login` | Authenticate; email, password, optional remember |
| POST | `/api/auth/logout` | Revoke cookie session |
| GET / PUT | `/api/auth/me` | Authenticated profile / edit profile |
| PUT | `/api/auth/password` | Current password required; revokes other sessions |
| GET / POST | `/api/lost-items` | Public list / authenticated creation |
| GET / PUT / PATCH / DELETE | `/api/lost-items/{id}` | Details / owner edit / owner status / owner deletion |
| GET / POST | `/api/found-items` | Public list / authenticated creation |
| GET / PUT / PATCH / DELETE | `/api/found-items/{id}` | Details / owner edit / owner status / owner deletion |
| GET | `/api/me/reports` | Authenticated user's `{lost: [], found: []}` |
| GET / POST | `/api/conversations` | List conversations / start or reuse an item conversation and send its first message |
| GET | `/api/conversations/unread-count` | Authenticated user's unread private-message count |
| GET / POST | `/api/conversations/{id}/messages` | Read messages / send a private reply as a participant |
| POST | `/api/conversations/{id}/read` | Mark received messages read |

Report create/edit fields remain Java-style: `title`, `description`, `category`, `location`, `dateLost` or `dateFound`, with optional `color`, `contact`, `image`. `PATCH` accepts `status`. PUT edits preserve status; creation always starts open. POST returns 201 and the generated ID; a replay returns 200. DELETE returns 204. Errors are JSON `{error: "..."}`.

Private messages are stored in MySQL tables `conversations` and `messages`; all conversation reads and writes require the authenticated session cookie. The reporter is resolved by the backend from the selected lost/found report. The Messages page refreshes conversations every 15 seconds and the open chat every 5 seconds; unread message counts are separate from the teammate-owned notifications feature.

**Shared-file coordination:** `Server.java` still uses JDK HttpServer, the same existing report URLs, and the repository/model layer. Its duplicated route bodies were moved into `ItemHandler`; auth routes were added through `AuthHandler`. Teammates adding claim or notification routes should keep their `createContext` registrations alongside these existing contexts. No claim-verification or notification HTTP route/table existed in this checkout, so no such API was replaced.

The existing frontend notification and claim preview behavior remains in `services/preview.js`; Contact Reporter now stores messages through the authenticated Java API and MySQL. Matching returns no fabricated matches. Password-reset email is still an explicit preview with no email sent. Live notification/claim verification work remains for the teammates developing it.

## Tests and evidence

```powershell
Set-Location 'D:\Projects\Digital-Lost-Found'
npm test
npm run build
. .\scripts\Use-DevTools.ps1
mvn -B -ntp -f backend/pom.xml '-Dmaven.repo.local=D:/Projects/Digital-Lost-Found/.local/m2' package
```

Real integration tests need a migrated database and MySQL client. They start/stop their own Java server on port 15000, create uniquely named test users, and leave a lost/found report for inspection. Use a separate test database; do not point this at valuable shared team data for routine testing.

```powershell
# DLF_ENV_FILE points to an ignored file with DB_URL, DB_USER, DB_PASSWORD.
$env:DLF_ENV_FILE='.local/mysql-test/test.env'
npm run test:integration
```

The isolated MySQL server must be started before that command. Its files and credentials from this session remain under ignored `.local/mysql-test/`; they are not your normal MySQL80 database. Port 3307 is reserved by Windows on this laptop, so the isolated instance uses 13306.

See **docs/INTEGRATION-RESULTS.md** for actual test results, scope limitations, root causes and the full changed-file inventory. The machine-readable API result is `.local/integration-results.json` and backend unit-test reports are in `backend/target/surefire-reports/`.

## Troubleshooting

- **Java/Maven not recognized:** dot-source `scripts/Use-DevTools.ps1` in that terminal. Check JAVA_HOME if PyCharm was moved or removed.
- **PowerShell scripts disabled:** use a session-only policy permitted by your university/device policy (for example `Set-ExecutionPolicy -Scope Process RemoteSigned`), then rerun the helper. No permanent policy change is required.
- **MySQL access denied:** verify the same host, port, user and password in Workbench and `.env`. Do not change the existing server's root password as a workaround.
- **Database/schema unavailable (503):** run the database initialization script using an account with migration privileges; verify `/api/health/db` before testing reports.
- **Legacy account cannot log in:** placeholder/plaintext hashes from old repository demos cannot authenticate. Register a real application account; old records remain intact.
- **Port already in use:** stop only the service you started in its own terminal or select an explicit alternate port. Do not terminate unrelated team processes.
- **HTTP 409 when deleting:** a related record (for example a teammate's claim foreign key) prevents deletion. The row is preserved; resolve the related workflow rather than bypassing the relationship.
- **Login lost after switching URLs:** keep using `http://127.0.0.1:5173` so the same cookie is used.
>>>>>>> Stashed changes
