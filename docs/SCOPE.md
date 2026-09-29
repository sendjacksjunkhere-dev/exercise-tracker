# Exercise Tracker – Scope (v1)

**In one sentence:** open the app at the gym, see today's exercises and what I lifted last
time, log each set as I go, and have the finished session land in my Google Sheet.

Single user. Practice project built with Claude Code. Place this file at `docs/SCOPE.md`.

## MoSCoW

### Must have
- Plan: each day of the week has an ordered list of exercises with target sets and reps.
- Read the plan from the `Plan` tab of the Google Sheet. The sheet is the source of truth
  for the plan; the app never edits it.
- Start a session for a plan day (defaults to today's weekday, user can pick another) and
  log reps and weight per set as you go.
- While logging an exercise, show what you did last time for that exercise (sets × reps ×
  weight and the date).
- On "Finish session", append every set as one row to the `Log` tab of the Google Sheet.
- If the push fails, retry next time the app opens. Never write duplicate rows (guard on
  Session ID).
- Browse past sessions in the app.
- Works on iPhone (installable to home screen as a PWA) and on desktop via the same URL.
- Simple shared password so only I can see or log data.

### Should have
- Per-exercise progress view in the app (history of that exercise over time).
- Swap or add an exercise for today's session only, without touching the plan.
- Rest timer between sets. *(TBC – not yet confirmed)*
- Notes field per set or per session. *(TBC – not yet confirmed)*

### Could have
- Optional image/video link per exercise (the `Video URL` column already exists in `Plan`).
- Progress charts in the app.
- iPhone home screen widget showing today's plan (via Scriptable reading a small JSON
  endpoint).
- AI suggestions for adjusting the plan over time.

### Won't have (v1)
- The app editing the `Plan` tab.
- The app reading the `Log` tab back (hand edits to `Log` do not appear in the app).
- Live per-set sync to the sheet; sets are pushed in one batch on finish.
- Multiple users or accounts.
- Built-in exercise library or images.
- Social features, nutrition, Apple Health.

## Google Sheet layout

Tab names are exact; the app finds them by name. Template: `exercise-tracker-sheet-template.xlsx`.

**Plan** (I edit; one row per exercise)

| Day | Order | Exercise | Sets | Reps | Notes | Video URL |
|-----|-------|----------|------|------|-------|-----------|
| Monday | 1 | Bench press | 3 | 8 | Pause at chest | |

**Log** (app appends; one row per set; weights in kg; dates/times in Australia/Sydney time;
Start time and Duration are per-session and repeat on every row of that session's block)

| Session ID | Date | Day | Start time | Duration (min) | Exercise | Set # | Reps | Weight (kg) | Notes |
|------------|------|-----|------------|-----------------|----------|-------|------|-------------|-------|
| 2026-09-28-monday-a1b2 | 2026-09-28 | Monday | 18:02 | 43 | Bench press | 1 | 8 | 60 | |

Duration is minutes from the session's `started_at` to its last logged set (not to when
Finish/Save is pressed, so lingering on the summary screen doesn't inflate it).

## Data model (app database)

- `exercises` – id, name (unique, case-insensitive), created from Plan rows on first sight.
- `sessions` – id (the Session ID), date, plan_day, started_at, finished_at,
  pushed_to_sheet_at (null until the Log push succeeds).
- `sets` – id, session_id, exercise_id, set_number, reps, weight_kg, notes, logged_at
  (used to compute the Log push's Duration column).

The plan itself is not stored; it is fetched from the sheet and cached briefly (e.g. 5 min).

## Milestones

- **M0 – Skeleton.** Next.js app deployed on Vercel, password gate, opens on the iPhone.
- **M1 – Read plan.** Sheets service account wired; app shows today's exercises from `Plan`.
- **M2 – Log sets.** Neon DB, start session, log sets, "last time" lookup, browse history.
- **M3 – Push to sheet.** Finish session appends to `Log`; retry and duplicate guard tested.
- **M4 – Phone polish.** PWA manifest and icons, layout tuned for one-handed gym use.
- **Then:** use it for a week before touching Should/Could.

## Open questions

1. Rest timer in v1?
2. Any fields beyond reps and weight (notes, RPE, bodyweight)?
3. What should the app show on a day with no plan (rest day)? Proposal: list of days to pick.
