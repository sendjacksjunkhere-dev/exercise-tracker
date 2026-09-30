# Exercise Tracker – UI spec (v1)

Place at `docs/UI.md`. This describes structure and behaviour, not visual style.
Visual polish (colours, fonts, dark mode) is M4 and deliberately undecided here.

Mobile first. Primary use is mid-workout on an iPhone, one-handed, sometimes with
sweaty hands: large tap targets (min 44px), minimal typing, big numbers.

## Screens

1. **Login** – single password field. Exists (M0).
2. **Today** – day picker (Mon–Sun, defaults to today's weekday) and that day's
   exercises from the Plan, each shown as "3 × 8" (sets × reps), plus "@ 60 kg" when
   the Plan gives that exercise a target weight. Exists (M1). M2 adds a "Start
   session" button. At most one
   unfinished session can exist at a time. If one exists (started but not saved or
   discarded), a **Resume session** banner appears at the top, above the day picker,
   regardless of which day is selected — linking to that session, with a Discard option
   beside it. Pressing "Start session" while an unfinished session exists: if it has no
   sets logged, it's discarded silently and the new one starts; if it has logged sets,
   Start session is replaced with a note pointing at the Resume banner above (which
   already offers Resume or Discard — that's the choice, no second prompt).
3. **Session** – the main screen. Specified in detail below.
4. **History** – list of past sessions (date, plan day, sets done). Tapping one shows
   its sets grouped by exercise. Plain list is fine for v1.

## Session screen

Fixed vertical layout. Only the exercise list scrolls; everything else stays put.

```
┌──────────────────────────────┐
│ Header: day, count · Finish  │  fixed
├──────────────────────────────┤
│ Current exercise card        │  fixed
├──────────────────────────────┤
│ Exercise list (scrolls)      │  fills remaining height
├──────────────────────────────┤
│ Progress bar                 │  fixed, pinned to bottom
└──────────────────────────────┘
```

### Header
- Left: plan day name ("Tuesday session"), exercise count.
- Right: **Finish** button. Navigates to the session summary screen (below) — doesn't
  itself end the session.

### Current exercise card
- Exercise name (large) and "Set N of T" where N = next set number, T = target sets
  for this exercise in this session.
- **Sets stepper** (−/+) top-right, adjusts T for this session only. Never changes
  the Plan. Minimum = sets already logged. Progress bar total recalculates.
- **Last time** heading: short date ("Tue 29 Sep") of the most recent session containing
  this exercise, with one line per set beneath it ("Set 1 · 20 kg × 8"). From the app
  DB. Hidden if none.
- **Weight stepper**: −/+ in 2.5 kg steps. Tapping the number opens a numeric keypad
  for direct entry. Minimum 0.
- **Reps stepper**: −/+ in steps of 1. Tapping the number opens a numeric keypad.
- **Log set** button, full width, primary. Saves the set to the DB and advances N.
- **Logged sets** row: chips "Set 1 · 62.5 × 8" for sets already done. Tapping a chip
  allows edit or delete of that set.

### Stepper defaults and memory
- For set N of an exercise: prefill from **last time's set N** if it exists, else the
  **previous set of the same exercise in this session** (set N−1) if one's been logged,
  else the **Plan target weight** (if the Plan gives this exercise one) for weight and
  the Plan target reps for reps, else 20 kg if the Plan gives no target weight either.
  Recomputed after every logged set, so switching between exercises and back restores
  each exercise's own next-set values.

### Exercise list
- Small grey column headers above the list: **Sets**, **Reps**, **Kg**.
- One row per exercise in the plan day, in plan order. Columns: state indicator,
  name, sets done / target, reps, weight.
- Reps show the Plan target until the first set is logged this session, then the most
  recently logged value. Weight shows last time's weight for that exercise if there's
  history, else the Plan target weight if the Plan gives one, else a dash — until the
  first set is logged this session, after which it shows the most recently logged
  value.
- State indicator: **tick** (done: sets logged ≥ target), **ring** (current),
  **dot** (started, not current), **empty** (not started).
- Tapping any row makes it the current exercise; the card reloads with that
  exercise's next set and remembered values. This is how supersets work: no special
  mode, just switching.
- List scrolls inside its own panel; card and progress bar do not move.

### Progress bar
- "X of Y sets · Z%" where Y = sum of target sets across all exercises in the session
  (after any stepper adjustments) and X = total sets logged.

## Finish flow (summary screen)

Tapping **Finish** on the session screen navigates to a summary screen for that
session — it does not end the session by itself. The summary shows the same
grouped-by-exercise set list as the History detail view, plus a warning line naming any
exercise with 0 sets logged (informational, not a blocking confirm), and three actions:

- **Save session** – marks the session finished and returns to Today. This is the only
  action that ends the session and triggers the push to the sheet Log tab (M3).
- **Back to workout** – returns to the live session screen, unchanged (not finished,
  nothing deleted).
- **Discard session** – confirmation dialog, then deletes the session and all its
  logged sets, and returns to Today.

Revisiting a session that's already been saved (via its session URL or the Finish
screen) redirects to its History detail instead, since there's nothing left to decide.

## Data implications (for the schema)

- `sessions` gains nothing new beyond SCOPE.md.
- Per-session target overrides: a `session_exercises` table (session_id,
  exercise_id, order, target_sets, target_reps, target_weight_kg) created when a
  session starts from the plan, so stepper changes have somewhere to live and the plan
  stays read-only. `target_weight_kg` is a snapshot of the Plan's Weight (kg) cell at
  start time (null if the Plan gave none), not re-read from the sheet mid-session.
- `sets` as in SCOPE.md. Set number is per exercise within the session.
- "Current exercise" and stepper values are client state, not persisted. On reload,
  default current exercise = first exercise with sets logged < target.

## Out of scope for M2
- Rest timer (undecided).
- Notes per set (undecided).
- Swapping in an exercise not on the plan (Should have).
- Visual styling beyond what Tailwind defaults give.
