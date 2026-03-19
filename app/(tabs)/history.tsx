import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { deleteWorkout, getAllWorkouts } from '../../src/db/queries';
import { MuscleChip } from '../../src/components/MuscleChip';

type WorkoutWithMuscles = {
  id: number;
  date: string;
  name: string | null;
  notes: string | null;
  createdAt: string;
  muscles: string[];
};

export default function HistoryScreen() {
  const [workouts, setWorkouts] = useState<WorkoutWithMuscles[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        try {
          const data = await getAllWorkouts();
          setWorkouts(data);
        } finally {
          setLoading(false);
        }
      }
      load();
    }, [])
  );

  function confirmDelete(id: number) {
    Alert.alert('Delete workout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWorkout(id);
          setWorkouts((prev) => prev.filter((w) => w.id !== id));
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyTitle}>No workouts yet</Text>
        <Text style={styles.emptyHint}>Log your first workout in the Log tab.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>History</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
                {item.name ? (
                  <Text style={styles.cardName}>{item.name}</Text>
                ) : null}
              </View>
              <Pressable onPress={() => confirmDelete(item.id)} hitSlop={10}>
                <Text style={styles.deleteBtn}>Delete</Text>
              </Pressable>
            </View>

            {item.muscles.length > 0 && (
              <View style={styles.chipRow}>
                {item.muscles.map((m) => (
                  <MuscleChip key={m} muscle={m} />
                ))}
              </View>
            )}

            {item.notes ? (
              <Text style={styles.notes}>{item.notes}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 2,
  },
  deleteBtn: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
