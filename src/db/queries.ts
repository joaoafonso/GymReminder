import { desc, eq, sql } from 'drizzle-orm';
import { db } from './index';
import {
  reminderConfigs,
  sessionMuscleGroups,
  workoutSessions,
  type NewReminderConfig,
  type NewWorkoutSession,
} from './schema';

// ── Workout Sessions ──────────────────────────────────────────────

export async function insertWorkout(
  data: NewWorkoutSession,
  muscles: string[]
): Promise<number> {
  const result = await db.insert(workoutSessions).values(data).returning({ id: workoutSessions.id });
  const sessionId = result[0].id;

  if (muscles.length > 0) {
    await db.insert(sessionMuscleGroups).values(
      muscles.map((muscle) => ({ sessionId, muscle }))
    );
  }

  return sessionId;
}

export async function getAllWorkouts() {
  const sessions = await db
    .select()
    .from(workoutSessions)
    .orderBy(desc(workoutSessions.date));

  const muscles = await db.select().from(sessionMuscleGroups);

  return sessions.map((s) => ({
    ...s,
    muscles: muscles.filter((m) => m.sessionId === s.id).map((m) => m.muscle),
  }));
}

export async function deleteWorkout(id: number) {
  await db.delete(workoutSessions).where(eq(workoutSessions.id, id));
}

export async function getLastWorkoutDate(): Promise<string | null> {
  const result = await db
    .select({ date: sql<string>`MAX(${workoutSessions.date})` })
    .from(workoutSessions);
  return result[0]?.date ?? null;
}

export async function getLastMuscleDate(muscle: string): Promise<string | null> {
  const result = await db
    .select({ date: sql<string>`MAX(${workoutSessions.date})` })
    .from(workoutSessions)
    .innerJoin(
      sessionMuscleGroups,
      eq(workoutSessions.id, sessionMuscleGroups.sessionId)
    )
    .where(eq(sessionMuscleGroups.muscle, muscle));
  return result[0]?.date ?? null;
}

// ── Reminder Configs ──────────────────────────────────────────────

export async function getAllReminders() {
  return db.select().from(reminderConfigs);
}

export async function insertReminder(data: NewReminderConfig) {
  const result = await db.insert(reminderConfigs).values(data).returning({ id: reminderConfigs.id });
  return result[0].id;
}

export async function updateReminder(id: number, data: Partial<NewReminderConfig>) {
  await db.update(reminderConfigs).set(data).where(eq(reminderConfigs.id, id));
}

export async function deleteReminder(id: number) {
  await db.delete(reminderConfigs).where(eq(reminderConfigs.id, id));
}
