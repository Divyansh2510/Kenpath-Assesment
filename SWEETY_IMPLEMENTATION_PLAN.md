# Sweety – Blood Glucose Tracker: Implementation Plan

> **Instructions for the AI editor:** Read this whole file first. Implement it **phase by phase** in the order given. After each phase, run the app/tests, then make a git commit using the suggested message. Do not skip validation or tests. Keep code simple, readable and commented where the logic is non-obvious. If something is ambiguous, pick the simplest option, and add it to the "Notes → Assumptions" section of the README.

---

## 0. Goal and Scope

A small web app where a diabetes patient:
1. Signs up / logs in.
2. Records up to **4 glucose readings per day** (mg/dl) and can view, edit and delete them.
3. Views **Daily**, **Month-to-date** and **Previous-month** reports (highest, lowest, average, count).

**Stack (note: "MERN" in the brief, but the DB is PostgreSQL, so there is no MongoDB):**
- Backend: Node.js 20+, Express, `pg` (node-postgres, raw SQL), `bcrypt`, `jsonwebtoken`, `zod`, `dotenv`, `cors`, `helmet`
- Database: PostgreSQL 15+
- Frontend: React 18 + Vite, React Router, Axios, (Recharts for bonus chart)
- Tests: Jest + Supertest (backend), Vitest + React Testing Library (frontend)

**Required first, bonus later.** Bonus plan to attempt (cheap and high-value): Pagination, Docker, Charts, Frontend tests.

---

## 1. Repository Structure

```
sweety/
├── README.md
├── .gitignore
├── docker-compose.yml            (bonus)
├── screenshots/                  (screenshots / link to recording)
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── db/
│   │   ├── schema.sql
│   │   └── migrate.js            (runs schema.sql)
│   ├── scripts/
│   │   └── seed.js
│   ├── src/
│   │   ├── server.js             (starts listening)
│   │   ├── app.js                (builds express app; exported for tests)
│   │   ├── config/env.js         (reads & validates env vars)
│   │   ├── db/pool.js            (pg Pool + DATE type parser)
│   │   ├── constants/slots.js
│   │   ├── middleware/
│   │   │   ├── auth.js           (JWT verification)
│   │   │   ├── validate.js       (zod wrapper)
│   │   │   └── errorHandler.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   └── dates.js          (pure date helpers)
│   │   ├── schemas/              (zod schemas: auth, reading)
│   │   ├── repositories/         (SQL only: users, readings)
│   │   ├── services/             (business rules: auth, readings, reports)
│   │   ├── controllers/
│   │   └── routes/               (auth.routes.js, readings.routes.js, reports.routes.js)
│   └── tests/
│       ├── setup.js
│       ├── dates.test.js
│       ├── auth.test.js
│       ├── readings.test.js
│       └── reports.test.js
└── client/
    ├── package.json
    ├── .env.example
    ├── index.html
    └── src/
        ├── main.jsx, App.jsx
        ├── api/client.js          (axios instance + interceptors)
        ├── context/AuthContext.jsx
        ├── components/            (ProtectedRoute, Navbar, ReadingForm, ReadingList, ReportCard, ErrorBanner, EmptyState)
        ├── pages/                 (Login, Register, Dashboard, Reports)
        ├── utils/                 (constants.js, validation.js, dates.js)
        └── __tests__/ReadingForm.test.jsx   (bonus)
```

Layering rule for backend: **routes → controllers → services (business rules) → repositories (SQL)**. Controllers contain no SQL; repositories contain no business rules.

---

## 2. Database Design

File: `server/db/schema.sql` (idempotent: `CREATE ... IF NOT EXISTS`).

```sql
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,   -- store lower-cased
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE reading_slot AS ENUM
    ('MORNING_FASTING','AFTER_BREAKFAST','AFTER_LUNCH','AFTER_DINNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS readings (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date  DATE NOT NULL,
  slot          reading_slot NOT NULL,
  value         INTEGER NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_date_slot UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings (user_id, reading_date);
```

**Important decisions**
- Use Postgres `DATE` (not timestamp) for `reading_date`, which avoids timezone bugs.
- In `db/pool.js`, call `types.setTypeParser(1082, v => v)` from `pg` so DATE columns come back as `'YYYY-MM-DD'` **strings** (no JS Date conversion shifting the day).
- DB constraints (CHECK, UNIQUE) are the safety net; the service layer also validates to produce friendly messages.
- `server/db/migrate.js` reads `schema.sql` and executes it using the pool. Add npm script `"db:migrate": "node db/migrate.js"`.

---

## 3. Environment Variables

`server/.env.example`
```
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sweety
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/sweety_test
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
CLIENT_ORIGIN=http://localhost:5173
APP_TIMEZONE=Asia/Kolkata
# Bonus (only if implemented)
# REDIS_URL=redis://localhost:6379
```

`client/.env.example`
```
VITE_API_URL=http://localhost:5000/api
```

`config/env.js` must throw a clear error at startup if `DATABASE_URL` or `JWT_SECRET` is missing. `.gitignore` must include `node_modules`, `.env`, `dist`, `coverage`.

---

## 4. Shared Constants

`server/src/constants/slots.js` and the client's `utils/constants.js` (keep identical):

| Slot key          | Label                |
|-------------------|----------------------|
| MORNING_FASTING   | Morning (fasting)    |
| AFTER_BREAKFAST   | After breakfast      |
| AFTER_LUNCH       | After lunch          |
| AFTER_DINNER      | After dinner         |

Also export `MIN_VALUE = 40`, `MAX_VALUE = 600`, `MAX_READINGS_PER_DAY = 4`.

---

## 5. Backend API Specification

Base path: `/api`. All JSON. Dates are strings `YYYY-MM-DD`.

### 5.1 Error response format (use everywhere)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Value must be between 40 and 600 mg/dl.",
    "fields": { "value": "Value must be between 40 and 600 mg/dl." }
  }
}
```
Codes → HTTP status: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `NOT_FOUND` 404, `CONFLICT` 409, `INTERNAL_ERROR` 500 (hide stack traces and DB details in responses). Implement an `AppError(status, code, message, fields)` class and a central `errorHandler` middleware. Wrap async controllers (or use `express-async-errors`).

### 5.2 Auth endpoints

| Method | Path | Auth | Body | Success |
|---|---|---|---|---|
| POST | `/auth/register` | No | `{name, email, password}` | 201 `{user, token}` |
| POST | `/auth/login` | No | `{email, password}` | 200 `{user, token}` |
| GET  | `/auth/me` | Yes | – | 200 `{user}` |

Rules:
- `name`: required, trimmed, 1–100 chars. `email`: valid format, lower-cased and trimmed. `password`: min 8 chars (assumption; document it).
- Hash with `bcrypt` (salt rounds from env). **Never** return `password_hash`. Never log passwords.
- Duplicate email → 409 `"An account with this email already exists."`
- Wrong email OR password → 401 with the **same** message `"Invalid email or password."` (don't reveal which one).
- JWT payload `{ sub: userId }`, signed with `JWT_SECRET`, expiry from env.
- `auth` middleware: read `Authorization: Bearer <token>`, verify, load `req.user = { id }`; else 401 `"Please log in to continue."`

### 5.3 Reading endpoints (all require auth; all scoped to `req.user.id`)

| Method | Path | Description |
|---|---|---|
| POST | `/readings` | Create. Body `{ date, slot, value }` → 201 `{reading}` |
| GET | `/readings?date=YYYY-MM-DD` | List readings for that date (ordered by slot order). Without `date`, list all, newest first |
| GET | `/readings/:id` | Get one (own only) |
| PUT | `/readings/:id` | Update `{ date, slot, value }` → 200 `{reading}` |
| DELETE | `/readings/:id` | Delete → 204 |

Reading JSON shape: `{ id, date, slot, slotLabel, value, createdAt, updatedAt }`.

Another user's reading id → respond **404** (not 403), so existence isn't leaked.

**Validation rules and exact messages** (check in this order; return the first failure; always include `fields`):

| # | Rule | Field | Message | Status |
|---|---|---|---|---|
| 1 | Value is required (missing/null/empty string) | value | `Please enter a glucose value.` | 400 |
| 2 | Value is a whole number 40–600 (reject decimals like 100.5, strings like "abc", NaN) | value | `Value must be between 40 and 600 mg/dl.` | 400 |
| 3 | Slot must be one of the 4 enums | slot | `Please select a valid time slot.` | 400 |
| 4 | Date required & valid `YYYY-MM-DD` real calendar date | date | `Please select a valid date.` | 400 |
| 5 | Date not in the future (compare to "today" in `APP_TIMEZONE`) | date | `Date cannot be in the future.` | 400 |
| 6 | One reading per slot per day (per user) | slot | `You already have an <Slot label> reading for this date.` e.g. "After lunch" | 409 |
| 7 | Max 4 readings per day (per user) | date | `You can add only 4 readings per day.` | 409 |

Implementation notes:
- Use **zod** for rules 1–5 (shape/format/future date). Coerce carefully: accept numeric strings like `"120"` from forms, but reject `"12.5"`, `""`, `null`. Rule 5 can be a `.refine` using `getTodayString()` from `utils/dates.js`.
- Rules 6–7 live in `readingsService` using the repository: count readings for (user, date) and check slot existence.
- Because of the 1-per-slot rule, rule 7 can only trigger if a 5th reading is attempted, but a duplicate slot would be caught first by rule 6. To make rule 7 reachable and testable, **check rule 7 before rule 6 when the day already has 4 readings** (i.e. a full day returns "You can add only 4 readings per day." regardless of slot). Document this ordering in the README assumptions.
- Update (PUT): run rules 1–5; rule 6 excludes the reading's own id; rule 7 applies only if the **date changes** and the target date already has 4 readings.
- Race conditions: wrap create in a transaction and also catch Postgres error code `23505` (unique violation) and map it to the rule-6 409 message. Optional: `pg_advisory_xact_lock(userId)` inside the transaction before counting.
- Pagination (bonus): `GET /readings?page=1&limit=20` returns `{ data: [...], pagination: { page, limit, total, totalPages } }`. Default limit 20, max 100. Keep the response shape consistent: when `date` is passed, you may still return the same wrapped shape.

### 5.4 Report endpoints (auth required)

| Method | Path | Range |
|---|---|---|
| GET | `/reports/daily?date=YYYY-MM-DD` | the selected date only |
| GET | `/reports/month-to-date?date=YYYY-MM-DD` | 1st of that month → selected date |
| GET | `/reports/monthly?date=YYYY-MM-DD` | the **whole previous month** relative to the selected date |

`date` is optional; default = today (in `APP_TIMEZONE`). Same validation as above (valid date; future dates rejected with `Date cannot be in the future.`).

Response:
```json
{
  "type": "daily",
  "range": { "from": "2026-10-15", "to": "2026-10-15", "label": "15 Oct 2026" },
  "stats": { "count": 3, "highest": 180, "lowest": 95, "average": 132.7 },
  "readings": [ { "id": 1, "slot": "MORNING_FASTING", "slotLabel": "Morning (fasting)", "value": 95 } ]
}
```
- `readings` is included **only for daily**.
- Empty period → `stats: { count: 0, highest: null, lowest: null, average: null }` (HTTP 200, not an error); frontend shows the empty state.
- Average rounded to **1 decimal**: SQL `ROUND(AVG(value)::numeric, 1)` and convert to a JS number (pg returns numerics as strings → `Number()`).
- Labels: daily `15 Oct 2026`; range `1 Oct – 15 Oct 2026`; monthly `1 Sep – 30 Sep 2026`.
- Single SQL for stats:
  ```sql
  SELECT COUNT(*)::int AS count, MAX(value) AS highest, MIN(value) AS lowest,
         ROUND(AVG(value)::numeric, 1) AS average
  FROM readings
  WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3;
  ```

### 5.5 Date helpers (`utils/dates.js`) – pure functions, heavily unit tested
Work with `'YYYY-MM-DD'` strings; avoid `new Date('YYYY-MM-DD')` pitfalls (parses as UTC). Prefer building with `Date.UTC` or manual arithmetic.
- `getTodayString(tz)` – today's date in `APP_TIMEZONE` (use `Intl.DateTimeFormat('en-CA', { timeZone })` → `YYYY-MM-DD`).
- `isValidDateString(s)` – regex + real calendar date check (rejects `2026-02-30`).
- `isFutureDate(s, tz)`.
- `startOfMonth(s)` → `2026-10-01`.
- `previousMonthRange(s)` → `{ from, to }`; must handle January → December of previous year, and leap years (e.g. selected `2024-03-10` → `2024-02-01`..`2024-02-29`).
- `formatLabel(s)` → `15 Oct 2026`; `formatRangeLabel(from, to)`.

### 5.6 App setup (`app.js`)
`helmet()`, `cors({ origin: CLIENT_ORIGIN })`, `express.json()`, mount routes under `/api`, `GET /api/health` → `{status:"ok"}`, 404 handler for unknown routes, then `errorHandler`. `server.js` only imports app and calls `listen`. Optional: `express-rate-limit` on `/auth/*`.

---

## 6. Frontend Specification

### 6.1 Routing
- `/login`, `/register` – public (redirect to `/` if already logged in)
- `/` – Dashboard (protected)
- `/reports` – Reports (protected)
- Unknown route → redirect to `/`.

### 6.2 Auth handling
- `AuthContext` holds `user`, `token`, `login()`, `register()`, `logout()`, `loading`.
- Store token in `localStorage` (note the XSS trade-off in README "What I'd improve": httpOnly cookies).
- Axios instance: base URL from `VITE_API_URL`; request interceptor adds the Bearer token; response interceptor on 401 → clear token and redirect to `/login`.
- On app load, if a token exists call `/auth/me` to restore the session (show a small loading state).
- `ProtectedRoute` component wraps protected pages.

### 6.3 Dashboard page
- Header (Navbar): app name "Sweety", links Dashboard / Reports, user name, Logout.
- **Date picker** (`<input type="date" max={today}>`; default today). Selecting a date loads that date's readings.
- **Reading list** for the selected date: show all 4 slots as rows/cards; each shows value or "Not recorded", with **Edit** and **Delete** buttons for existing readings. Delete asks `window.confirm`.
- **Reading form** (add & edit mode): fields date, slot (select with the 4 labels), value (number input). Buttons Save / Cancel. Disable the submit button while submitting. After success: refresh list, reset form, show brief success message.
- **Error display:**
  - Client-side validation first (same rules 1–5, same messages) shown under each field.
  - Server errors: map `error.fields` to field messages; also show `error.message` in an `ErrorBanner` at the top of the form (so rule 6/7 messages are clearly visible).
- Show "You have recorded X of 4 readings today" hint (nice touch).
- Loading and error states for list fetching.

### 6.4 Reports page
- Date selector (max = today, default today) – "selected date".
- Three cards/tabs: **Daily**, **Month-to-date**, **Previous month**. Each calls its endpoint and displays range label, Highest, Lowest, Average (1 decimal), Count — with units "mg/dl".
- Daily card also lists each reading with its slot label and value.
- **Empty state** (`EmptyState` component) when `count === 0`: e.g. "No readings for this period yet. Add a reading from the Dashboard." with a link.
- Loading spinner/text and error message handling.
- (Bonus) Line chart (Recharts) of month-to-date readings by date (daily average or one line per slot) under the Month-to-date card; requires a helper endpoint or reusing `GET /readings` — simplest: add `GET /reports/month-to-date` field `series: [{date, average}]` only if bonus is attempted.

### 6.5 UI guidelines
Simple, clean, responsive CSS (plain CSS or CSS modules; no heavy UI library needed). Accessible labels (`<label htmlFor>`), `aria-live` on error messages, readable contrast. Light colour hint for out-of-range values is optional (e.g. > 180 amber) — skip if short on time.

---

## 7. Seed Script (`server/scripts/seed.js`, npm script `"seed": "node scripts/seed.js"`)
- Create demo user: **Name** `Demo Patient`, **email** `demo@sweety.test`, **password** `Demo@1234` (hashed with bcrypt). If the user exists, reuse it (idempotent) and clear/replace their readings.
- Insert sample readings for roughly the **last 45 days up to today** (so previous month, month-to-date and daily all have data). Rules: never future dates; random plausible values (fasting 80–130, post-meal 110–220); randomly skip ~15% of slots so some days have fewer than 4; max 4 per day; respect the unique constraint.
- Print the credentials and counts at the end. Print a warning and exit if `NODE_ENV === 'production'`.

---

## 8. Testing Plan

### 8.1 Backend (Jest + Supertest) – use a separate DB `DATABASE_URL_TEST`
`tests/setup.js`: run the schema against the test DB once, `TRUNCATE users, readings RESTART IDENTITY CASCADE` before each test, close the pool after all tests. Script: `"test": "NODE_ENV=test jest --runInBand"` (use `cross-env` for Windows compatibility).

Minimum meaningful tests:
1. **dates.test.js** (pure): valid/invalid dates, `previousMonthRange` for normal month, January, leap-year Feb; `startOfMonth`; label formatting; `isFutureDate`.
2. **auth.test.js**: register success (no `password_hash` in response, hash stored ≠ plain password); duplicate email 409; weak password 400; login success; wrong password 401; `/auth/me` without token 401.
3. **readings.test.js**: create success; each validation rule with the **exact message** (missing value, 39, 601, 100.5, "abc", future date, duplicate slot, 5th reading); edit success; edit into an occupied slot → 409; delete; **user isolation** (user B cannot read/edit/delete user A's reading → 404; list returns only own).
4. **reports.test.js**: insert known readings across current and previous month → verify daily, month-to-date and monthly stats (count/high/low/average with 1-decimal rounding); empty period returns count 0 and nulls; monthly picks the previous month only.
(Use the helper `createUserAndToken()` to keep tests short. Use fixed dates in the past for determinism, or pass `?date=` explicitly.)

### 8.2 Frontend (bonus) – Vitest + React Testing Library
`ReadingForm.test.jsx`: renders fields; shows "Please enter a glucose value." on empty submit; shows range error for 39 / 601; shows "Date cannot be in the future."; calls `onSubmit` with correct data for valid input; displays server error message passed via props.

---

## 9. Bonus Items (do after the required parts work)

1. **Pagination** – as in 5.3.
2. **Charts** – as in 6.4.
3. **Docker** – `docker-compose.yml` with `postgres:15` (env POSTGRES_USER/PASSWORD/DB, port 5432, named volume, healthcheck). Optionally a `server` and `client` service with Dockerfiles. README: `docker compose up -d db` then `npm run db:migrate`.
4. **Frontend tests** – as in 8.2.
5. (Skip unless time remains) Redis caching, BullMQ reminder job, Doctor role.

---

## 10. Implementation Order (with git commits)

Make **small, regular commits** (at least 15–20 overall). Suggested sequence:

| Phase | Work | Commit message |
|---|---|---|
| 1 | Init repo, `.gitignore`, folder structure, README skeleton | `chore: initialize project structure` |
| 2 | Server setup: express app, env config, health route, pool | `feat(server): express app and config` |
| 3 | `schema.sql` + `migrate.js` | `feat(db): users and readings schema` |
| 4 | Date utils + unit tests | `feat(server): date helpers with tests` |
| 5 | Error handling (`AppError`, middleware), validate middleware | `feat(server): error handling and validation middleware` |
| 6 | Auth: register/login/me + JWT middleware | `feat(auth): register, login, jwt middleware` |
| 7 | Auth tests | `test(auth): auth endpoint tests` |
| 8 | Readings CRUD + all validation rules | `feat(readings): CRUD with validation rules` |
| 9 | Readings tests (rules + isolation) | `test(readings): validation and isolation tests` |
| 10 | Reports endpoints | `feat(reports): daily, month-to-date, monthly` |
| 11 | Reports tests | `test(reports): report calculation tests` |
| 12 | Seed script | `feat: seed script with demo user` |
| 13 | Client scaffold (Vite, router, axios, AuthContext) | `feat(client): scaffold and auth context` |
| 14 | Login/Register pages + protected routes | `feat(client): login and register pages` |
| 15 | Dashboard: date picker, list, form with validation | `feat(client): dashboard and reading form` |
| 16 | Edit/delete flows | `feat(client): edit and delete readings` |
| 17 | Reports page + empty state | `feat(client): reports page` |
| 18 | Bonus: pagination / Docker / chart / frontend tests (one commit each) | `feat: <bonus name>` |
| 19 | README, `.env.example` check, screenshots | `docs: readme, notes and screenshots` |

---

## 11. README.md Requirements (generate at the end; keep it accurate)

Sections:
1. **About** – one paragraph + screenshot(s).
2. **Tech stack**.
3. **Prerequisites** – Node 20+, PostgreSQL 15+ (or Docker).
4. **Installation** – clone, `cd server && npm install`, `cd ../client && npm install`.
5. **Environment** – copy `.env.example` → `.env` in both folders; explain every variable.
6. **Database setup** – create DBs (`createdb sweety`, `createdb sweety_test`) or `docker compose up -d db`; run `npm run db:migrate`.
7. **Seed** – `npm run seed` and demo credentials (`demo@sweety.test` / `Demo@1234`).
8. **Run** – server: `npm run dev` (port 5000); client: `npm run dev` (port 5173).
9. **Tests** – `npm test` in `server`; `npm test` in `client` (if bonus done).
10. **API summary** – table of endpoints + error format.
11. **Screenshots / demo video** link (2–3 min covering: sign up, login, add readings, each validation error, edit, delete, daily / month-to-date / monthly reports, empty state).
12. **Notes**
    - *Assumptions:* DB is PostgreSQL so no MongoDB; password min 8 chars; "today" computed in `APP_TIMEZONE` (default Asia/Kolkata); month-to-date and monthly are relative to the *selected date*; "previous month" means the month before the selected date's month; a full day (4 readings) returns the "max 4" error before the duplicate-slot error; average rounded to 1 decimal; token in localStorage; users can only see their own data (404 for others' ids).
    - *What I'd improve with more time:* refresh tokens + httpOnly cookies, rate limiting & account lockout, email verification/password reset, an ORM/migration tool (Prisma/Knex), E2E tests (Playwright), glucose range highlighting and trends, CSV/PDF export, CI pipeline, deployment, Redis caching, doctor role.

---

## 12. Final Acceptance Checklist (verify before submitting)

**Functionality**
- [ ] Register + login work; passwords stored as bcrypt hashes; wrong creds rejected.
- [ ] Each user sees only their own readings (tested).
- [ ] Add/view/edit/delete readings work from the UI.
- [ ] All 5 validation rules show the exact messages in the UI **and** from the API.
- [ ] Daily, month-to-date, previous-month reports correct (high, low, avg to 1 decimal, count); daily lists readings with slots.
- [ ] Empty state shown when no data.
- [ ] Edge cases: January → previous December; leap year; selecting 1st of the month; future dates blocked.

**Quality**
- [ ] No secrets committed; `.env.example` lists every variable used (server and client).
- [ ] Seed script runs on a clean DB and the demo login shows data in all three reports.
- [ ] Backend tests pass on a clean checkout (`npm test`).
- [ ] No console errors in the browser; no unhandled promise rejections on the server.
- [ ] Clear, readable code; consistent naming; no dead code or commented-out blocks.
- [ ] 15+ meaningful commits.

**Submission**
- [ ] Public GitHub repo URL.
- [ ] README complete (install, DB setup, run server/client/tests, Notes).
- [ ] Screenshots folder and/or 2–3 min recording link.
