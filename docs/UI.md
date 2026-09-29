# Exercise Tracker – UI spec (v1)

Place at `docs/UI.md`. This describes structure and behaviour, not visual style.
Visual polish (colours, fonts, dark mode) is M4 and deliberately undecided here.

Mobile first. Primary use is mid-workout on an iPhone, one-handed, sometimes with
sweaty hands: large tap targets (min 44px), minimal typing, big numbers.

## Screens

1. **Login** – single password field. Exists (M0).
2. **Today** – day picker (Mon–Sun, defaults to today's weekday) and that day's
   exercises from the Plan. Exists (M1). M2 adds a "Start session" button.
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
- Right: **Finish** button. Ends the session and triggers the push to the sheet Log
  tab (M3). Confirm if any exercise has 0 sets logged.

### Current exercise card
- Exercise name (large) and "Set N of T" where N = next set number, T = target sets
  for this exercise in this session.
- **Sets stepper** (−/+) top-right, adjusts T for this session only. Never changes
  the Plan. Minimum = sets already logged. Progress bar total recalculates.
- **Last time** line: most recent session containing this exercise, as
  "60 kg × 8, 8, 7" plus date. From the app DB. Hidden if none.
- **Weight stepper**: −/+ in 2.5 kg steps. Tapping the number opens a numeric keypad
  for direct entry. Minimum 0.
- **Reps stepper**: −/+ in steps of 1. Tapping the number opens a numeric keypad.
- **Log set** button, full width, primary. Saves the set to the DB and advances N.
- **Logged sets** row: chips "Set 1 · 62.5 × 8" for sets already done. Tapping a chip
  allows edit or delete of that set.

### Stepper defaults and memory
- First set of an exercise in a session: prefill from last time's first set if it
  exists, else from the Plan targets (reps) and 20 kg (weight).
- Subsequent sets: prefill from the previous set of the **same exercise in this
  session**. This memory is per exercise, so switching between exercises and back
  restores each exercise's own last values.

### Exercise list
- One row per exercise in the plan day, in plan order. Columns: state indicator,
  name, sets done / target, reps, weight.
- Reps and weight show the Plan targets until the first set is logged, then show the
  most recently logged values for that exercise.
- State indicator: **tick** (done: sets logged ≥ target), **ring** (current),
  **dot** (started, not current), **empty** (not started).
- Tapping any row makes it the current exercise; the card reloads with that
  exercise's next set and remembered values. This is how supersets work: no special
  mode, just switching.
- List scrolls inside its own panel; card and progress bar do not move.

### Progress bar
- "X of Y sets · Z%" where Y = sum of target sets across all exercises in the session
  (after any stepper adjustments) and X = total sets logged.

## Data implications (for the schema)

- `sessions` gains nothing new beyond SCOPE.md.
- Per-session target overrides: a `session_exercises` table (session_id,
  exercise_id, order, target_sets, target_reps) created when a session starts from
  the plan, so stepper changes have somewhere to live and the plan stays read-only.
- `sets` as in SCOPE.md. Set number is per exercise within the session.
- "Current exercise" and stepper values are client state, not persisted. On reload,
  default current exercise = first exercise with sets logged < target.

## Out of scope for M2
- Rest timer (undecided).
- Notes per set (undecided).
- Swapping in an exercise not on the plan (Should have).
- Visual styling beyond what Tailwind defaults give.
