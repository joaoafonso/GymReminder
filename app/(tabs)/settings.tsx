import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../src/constants/colors';
import {
  deleteReminder,
  getAllReminders,
  insertReminder,
  updateReminder,
} from '../../src/db/queries';
import { MUSCLE_GROUPS } from '../../src/constants/muscles';
import { ReminderConfig } from '../../src/db/schema';
import { scheduleReminders } from '../../src/notifications/scheduler';

type ReminderType = 'inactivity' | 'muscle_group';

export default function SettingsScreen() {
  const [reminders, setReminders] = useState<ReminderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<ReminderType>('inactivity');
  const [formMuscle, setFormMuscle] = useState<string>(MUSCLE_GROUPS[0].slug);
  const [formThreshold, setFormThreshold] = useState('3');
  const [formTimes, setFormTimes] = useState<string[]>(['08:00']);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReminders(await getAllReminders());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(load);

  async function handleToggle(id: number, enabled: boolean) {
    await updateReminder(id, { enabled: enabled ? 1 : 0 });
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: enabled ? 1 : 0 } : r))
    );
    scheduleReminders();
  }

  function confirmDelete(id: number) {
    Alert.alert('Delete reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReminder(id);
          setReminders((prev) => prev.filter((r) => r.id !== id));
          scheduleReminders();
        },
      },
    ]);
  }

  function addTimePicker() {
    setShowTimePicker(true);
  }

  function handleTimeChange(_: unknown, selected?: Date) {
    setShowTimePicker(Platform.OS === 'ios');
    if (selected) {
      const hh = String(selected.getHours()).padStart(2, '0');
      const mm = String(selected.getMinutes()).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      setFormTimes((prev) => (prev.includes(timeStr) ? prev : [...prev, timeStr]));
    }
  }

  function removeTime(t: string) {
    setFormTimes((prev) => prev.filter((x) => x !== t));
  }

  async function handleSave() {
    const threshold = parseInt(formThreshold, 10);
    if (isNaN(threshold) || threshold < 1) {
      Alert.alert('Invalid', 'Threshold must be at least 1 day.');
      return;
    }
    if (formTimes.length === 0) {
      Alert.alert('Invalid', 'Add at least one notification time.');
      return;
    }

    setSaving(true);
    try {
      await insertReminder({
        type: formType,
        muscle: formType === 'muscle_group' ? formMuscle : null,
        thresholdDays: threshold,
        notificationTimes: JSON.stringify(formTimes),
        enabled: 1,
      });
      setShowForm(false);
      resetForm();
      await load();
      scheduleReminders();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setFormType('inactivity');
    setFormMuscle(MUSCLE_GROUPS[0].slug);
    setFormThreshold('3');
    setFormTimes(['08:00']);
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Reminders</Text>

      <FlatList
        data={reminders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyHint}>No reminders yet. Add one below.</Text>
        }
        ListFooterComponent={
          showForm ? (
            <ReminderForm
              type={formType}
              setType={setFormType}
              muscle={formMuscle}
              setMuscle={setFormMuscle}
              threshold={formThreshold}
              setThreshold={setFormThreshold}
              times={formTimes}
              onAddTime={addTimePicker}
              onRemoveTime={removeTime}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); resetForm(); }}
              saving={saving}
            />
          ) : (
            <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addBtnText}>+ Add Reminder</Text>
            </Pressable>
          )
        }
        renderItem={({ item }) => (
          <ReminderRow
            reminder={item}
            onToggle={handleToggle}
            onDelete={confirmDelete}
          />
        )}
      />

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ReminderRow({
  reminder,
  onToggle,
  onDelete,
}: {
  reminder: ReminderConfig;
  onToggle: (id: number, enabled: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const times: string[] = JSON.parse(reminder.notificationTimes);
  const label =
    reminder.type === 'inactivity'
      ? 'General inactivity'
      : `${MUSCLE_GROUPS.find((m) => m.slug === reminder.muscle)?.label ?? reminder.muscle}`;

  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reminderCardLabel}>{label}</Text>
          <Text style={styles.reminderCardSub}>
            After {reminder.thresholdDays} day{reminder.thresholdDays > 1 ? 's' : ''} · {times.join(', ')}
          </Text>
        </View>
        <Switch
          value={!!reminder.enabled}
          onValueChange={(v) => onToggle(reminder.id, v)}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.background}
        />
      </View>
      <Pressable onPress={() => onDelete(reminder.id)}>
        <Text style={styles.deleteBtn}>Delete</Text>
      </Pressable>
    </View>
  );
}

function ReminderForm({
  type, setType,
  muscle, setMuscle,
  threshold, setThreshold,
  times, onAddTime, onRemoveTime,
  onSave, onCancel,
  saving,
}: {
  type: ReminderType; setType: (t: ReminderType) => void;
  muscle: string; setMuscle: (m: string) => void;
  threshold: string; setThreshold: (v: string) => void;
  times: string[]; onAddTime: () => void; onRemoveTime: (t: string) => void;
  onSave: () => void; onCancel: () => void;
  saving: boolean;
}) {
  return (
    <View style={styles.form}>
      <Text style={styles.formTitle}>New Reminder</Text>

      <Text style={styles.formLabel}>Type</Text>
      <View style={styles.segmentRow}>
        {(['inactivity', 'muscle_group'] as ReminderType[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.segmentBtn, type === t && styles.segmentBtnActive]}
            onPress={() => setType(t)}
          >
            <Text style={[styles.segmentText, type === t && styles.segmentTextActive]}>
              {t === 'inactivity' ? 'Inactivity' : 'Muscle Group'}
            </Text>
          </Pressable>
        ))}
      </View>

      {type === 'muscle_group' && (
        <>
          <Text style={styles.formLabel}>Muscle Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.muscleScroll}>
            {MUSCLE_GROUPS.map((m) => (
              <Pressable
                key={m.slug}
                style={[styles.muscleOption, muscle === m.slug && styles.muscleOptionActive]}
                onPress={() => setMuscle(m.slug)}
              >
                <Text style={[styles.muscleOptionText, muscle === m.slug && styles.muscleOptionTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.formLabel}>Remind after (days without training)</Text>
      <TextInput
        style={styles.formInput}
        value={threshold}
        onChangeText={setThreshold}
        keyboardType="number-pad"
        maxLength={3}
      />

      <Text style={styles.formLabel}>Notification times</Text>
      <View style={styles.timeChips}>
        {times.map((t) => (
          <Pressable key={t} style={styles.timeChip} onPress={() => onRemoveTime(t)}>
            <Text style={styles.timeChipText}>{t} ✕</Text>
          </Pressable>
        ))}
        <Pressable style={styles.addTimeBtn} onPress={onAddTime}>
          <Text style={styles.addTimeBtnText}>+ Add time</Text>
        </Pressable>
      </View>

      <View style={styles.formActions}>
        <Pressable style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>
    </View>
  );
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
  emptyHint: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  reminderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderCardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  reminderCardSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
  },
  addBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  form: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentBtnActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  segmentTextActive: { color: Colors.background },
  muscleScroll: { marginBottom: 4 },
  muscleOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  muscleOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  muscleOptionText: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary },
  muscleOptionTextActive: { color: Colors.background },
  timeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  timeChipText: { fontSize: 13, fontWeight: '600', color: Colors.background },
  addTimeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addTimeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: Colors.background },
});
