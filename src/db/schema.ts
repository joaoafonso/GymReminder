import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const workoutSessions = sqliteTable('workout_sessions', {
  id: int('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull(),        // YYYY-MM-DD
  name: text('name'),                  // optional label e.g. "Push Day"
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});

export const sessionMuscleGroups = sqliteTable('session_muscle_groups', {
  id: int('id').primaryKey({ autoIncrement: true }),
  sessionId: int('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  muscle: text('muscle').notNull(),
});

export const reminderConfigs = sqliteTable('reminder_configs', {
  id: int('id').primaryKey({ autoIncrement: true }),
  type: text('type').notNull(),            // 'inactivity' | 'muscle_group'
  muscle: text('muscle'),                  // null for inactivity type
  thresholdDays: int('threshold_days').notNull(),
  notificationTimes: text('notification_times').notNull(), // JSON: ["HH:MM", ...]
  enabled: int('enabled').notNull().default(1),
});

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type NewWorkoutSession = typeof workoutSessions.$inferInsert;
export type SessionMuscleGroup = typeof sessionMuscleGroups.$inferSelect;
export type ReminderConfig = typeof reminderConfigs.$inferSelect;
export type NewReminderConfig = typeof reminderConfigs.$inferInsert;
