# Decisions

Changes to `docs/SCOPE.md` after the fact, with why.

## 2026-09-30 — Log tab gains Start time and Duration columns

Added `Start time` and `Duration (min)` to the `Log` tab layout (between `Day` and
`Exercise`), repeated on every row of a session's block. `sets` gained a `logged_at`
timestamp to compute Duration (minutes from the session's `started_at` to its last
logged set — not to when Finish/Save is pressed, so time spent on the summary screen
doesn't inflate it).

Why: wanted the sheet to show how long a session actually took at a glance, without
opening the app.

## 2026-09-30 — All Log/Session-ID dates and times use Australia/Sydney time

`generateSessionId`'s date and everything written to `Log` (Date, Start time) now use
Australia/Sydney local time via `Intl.DateTimeFormat`, not UTC or server-local time.

Why: the app's data should read correctly in the sheet regardless of what timezone the
server (dev machine now, Vercel later) happens to be running in. Vercel runs UTC by
default, which would have silently shifted dates/times without this.
