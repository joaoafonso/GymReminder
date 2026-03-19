import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { getAllReminders, getAllWorkouts, getLastMuscleDate, getLastWorkoutDate } from '../../src/db/queries';
import { getMuscleLabel } from '../../src/constants/muscles';
import { MuscleChip } from '../../src/components/MuscleChip';

type ReminderStatus = {
  id: number;
  label: string;
  daysSince: number | null;
  threshold: number;
  overdue: boolean;
};

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null);
  const [recentMuscles, setRecentMuscles] = useState<string[]>([]);
  const [reminderStatuses, setReminderStatuses] = useState<ReminderStatus[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const [lastDate, reminders, workouts] = await Promise.all([
            getLastWorkoutDate(),
            getAllReminders(),
            getAllWorkouts(),
          ]);

          setLastWorkoutDate(lastDate);

          // Most recent workout's muscles
          if (workouts.length > 0) {
            setRecentMuscles(workouts[0].muscles);
          } else {
            setRecentMuscles([]);
          }

          // Evaluate each reminder
          const today = new Date();
          const statuses: ReminderStatus[] = [];

          for (const r of reminders) {
            if (!r.enabled) continue;

            let lastDateStr: string | null = null;
            if (r.type === 'inactivity') {
              lastDateStr = lastDate;
            } else if (r.muscle) {
              lastDateStr = await getLastMuscleDate(r.muscle);
            }

            let daysSince: number | null = null;
            if (lastDateStr) {
              const diff = today.getTime() - new Date(lastDateStr).getTime();
              daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));
            }

            const overdue = daysSince === null || daysSince >= r.thresholdDays;
            const label =
              r.type === 'inactivity'
                ? 'General activity'
                : getMuscleLabel(r.muscle ?? '');

            statuses.push({ id: r.id, label, daysSince, threshold: r.thresholdDays, overdue });
          }

          setReminderStatuses(statuses);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  const daysSinceLastWorkout = lastWorkoutDate
    ? Math.floor((new Date().getTime() - new Date(lastWorkoutDate).getTime()) / 86_400_000)
    : null;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>MuscleMemo</Text>

      {/* Last workout card */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Last workout</Text>
        {lastWorkoutDate ? (
          <>
            <Text style={styles.bigNumber}>
              {daysSinceLastWorkout === 0
                ? 'Today'
                : daysSinceLastWorkout === 1
                ? 'Yesterday'
                : `${daysSinceLastWorkout}d ago`}
            </Text>
            <Text style={styles.cardSub}>{formatDate(lastWorkoutDate)}</Text>
            {recentMuscles.length > 0 && (
              <View style={styles.chipRow}>
                {recentMuscles.map((m) => (
                  <MuscleChip key={m} muscle={m} />
                ))}
              </View>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>No workouts logged yet</Text>
        )}
      </View>

      {/* Reminder statuses */}
      {reminderStatuses.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Reminders</Text>
          {reminderStatuses.map((r) => (
            <View
              key={r.id}
              style={[styles.reminderRow, r.overdue && styles.reminderRowOverdue]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderLabel}>{r.label}</Text>
                <Text style={styles.reminderSub}>
                  {r.daysSince === null
                    ? 'Never trained'
                    : r.daysSince === 0
                    ? 'Trained today'
                    : `${r.daysSince}d ago`}
                </Text>
              </View>
              <View style={[styles.badge, r.overdue ? styles.badgeDanger : styles.badgeOk]}>
                <Text style={styles.badgeText}>
                  {r.overdue ? 'Overdue' : `${r.threshold - (r.daysSince ?? 0)}d left`}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {reminderStatuses.length === 0 && (
        <Text style={styles.emptyHint}>
          Set up reminders in the Reminders tab to track your muscle groups.
        </Text>
      )}
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingTop: 60 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  emptyText: { fontSize: 16, color: Colors.textSecondary },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reminderRowOverdue: {
    borderColor: Colors.danger + '55',
    backgroundColor: Colors.danger + '11',
  },
  reminderLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  reminderSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeOk: { backgroundColor: Colors.success + '22' },
  badgeDanger: { backgroundColor: Colors.danger + '22' },
  badgeText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  emptyHint: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 20,
  },
});
