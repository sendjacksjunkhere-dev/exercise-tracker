import { sql } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
  },
  (table) => [uniqueIndex("exercises_name_lower_unique").on(sql`lower(${table.name})`)]
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  date: date("date").notNull(),
  planDay: text("plan_day").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  pushedToSheetAt: timestamp("pushed_to_sheet_at", { withTimezone: true }),
});

export const sessionExercises = pgTable("session_exercises", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  order: integer("order").notNull(),
  targetSets: integer("target_sets").notNull(),
  targetReps: integer("target_reps"),
});

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => sessions.id),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps").notNull(),
  weightKg: real("weight_kg").notNull(),
  notes: text("notes"),
  loggedAt: timestamp("logged_at", { withTimezone: true }).defaultNow().notNull(),
});
