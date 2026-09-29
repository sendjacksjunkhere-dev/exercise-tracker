# Exercise Tracker

A personal web app for logging gym sessions from an iPhone. The workout plan lives in a
Google Sheet; the app reads the plan, logs sets during a session, and appends the finished
session back to the sheet as history.

Read `docs/SCOPE.md` before planning any feature. It holds the MoSCoW, data model and
milestones. If a request conflicts with SCOPE.md, say so before writing code.

## Vocabulary (use these names everywhere: code, DB, UI)

- **Exercise** – a named movement, e.g. "Bench press".
- **Plan** – the weekly template. Each **PlanDay** (Monday…Sunday) has an ordered list of
  exercises with target sets and reps. Lives in the Google Sheet `Plan` tab.
- **Session** – a dated instance of a PlanDay that the user actually performed.
- **Set** – one entry within a Session: exercise, set number, reps, weight (kg).

Do not use "workout" in code or the database; it is ambiguous.

## Data flow rules (do not break these)

1. The Google Sheet `Plan` tab is the source of truth for the plan. The app reads it and
   never writes to it.
2. The app's database is the source of truth for Sessions and Sets. Logging a set writes to
   the DB only; it must work with poor connectivity.
3. On "Finish session" the app appends all Sets of that Session to the Sheet `Log` tab in a
   single batch. The app never reads `Log`.
4. Every Session has a unique `sessionId`. Before appending to `Log`, check whether rows
   with that `sessionId` already exist; if so, skip. Pushes must be safe to retry.
5. "Last time" lookups (what did I do last time for this exercise) come from the app DB.

## Stack

- Next.js (App Router) + TypeScript + Tailwind, deployed on Vercel.
- Postgres on Neon, accessed via Drizzle ORM. Schema lives in `src/db/schema.ts`.
- Google Sheets via `googleapis` with a service account. Credentials come from env vars
  (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `SHEET_ID`). Never commit them.
- Auth: single shared password from `APP_PASSWORD` env var, checked by middleware, cookie
  session. No user accounts.
- PWA: web manifest + icons so it installs to the iPhone home screen.

## Working conventions

- Build in thin vertical slices: UI + DB + tests for one behaviour, then stop for review.
- Use plan mode for anything touching the schema, the Sheets integration or auth.
- Write unit tests for pure logic: "last time" lookup, Log row formatting, duplicate-push
  guard. UI tests are not required for v1.
- Mobile first. Primary use is mid-workout on a phone: large tap targets, minimal typing,
  big numbers, one hand.
- Commit after each working slice with a short imperative message.
- Record any decision that changes SCOPE.md in `docs/decisions.md` (date, decision, why).

## Commands

- `npm run dev` – local dev server
- `npm run test` – unit tests
- `npm run db:push` – apply schema to Neon (Drizzle)
- `npm run lint` – lint and typecheck

## Current milestone

See "Milestones" in `docs/SCOPE.md`. Update this line when a milestone is done.
M0 done — skeleton and password gate confirmed working on the phone (local dev server
over LAN; not yet deployed to Vercel).
M1 done — Sheets service account wired, today's exercises from `Plan` confirmed working
on the phone.
M2 done — Neon DB, start/log/finish/discard a session, "last time" lookup, Resume
banner, and History browsing all confirmed working on the phone.
Currently: **M3 – Push to sheet.**
