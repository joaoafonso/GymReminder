import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Body from 'react-native-body-highlighter';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../src/constants/colors';
import { insertWorkout } from '../../src/db/queries';

type BodyPart = { slug: string; intensity?: number };

export default function LogWorkoutScreen() {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedMuscles, setSelectedMuscles] = useState<BodyPart[]>([]);
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [saving, setSaving] = useState(false);

  function handleBodyPartPress(part: BodyPart) {
    setSelectedMuscles((prev) => {
      const exists = prev.find((p) => p.slug === part.slug);
      if (exists) {
        return prev.filter((p) => p.slug !== part.slug);
      }
      return [...prev, { slug: part.slug, intensity: 2 }];
    });
  }

  async function handleSave() {
    if (selectedMuscles.length === 0) {
      Alert.alert('No muscles selected', 'Tap the body diagram to select the muscles you trained.');
      return;
    }

    setSaving(true);
    try {
      const isoDate = date.toISOString().split('T')[0];
      await insertWorkout(
        {
          date: isoDate,
          name: name.trim() || null,
          notes: notes.trim() || null,
          createdAt: new Date().toISOString(),
        },
        selectedMuscles.map((m) => m.slug)
      );
      router.replace('/(tabs)/');
    } catch (e) {
      Alert.alert('Error', 'Failed to save workout.');
    } finally {
      setSaving(false);
    }
  }

  const isoDate = date.toISOString().split('T')[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Log Workout</Text>

      {/* Optional name */}
      <Text style={styles.label}>Name (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Push Day"
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      {/* Date picker */}
      <Text style={styles.label}>Date</Text>
      <Pressable style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.inputText}>{formatDate(isoDate)}</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selected) setDate(selected);
          }}
          style={Platform.OS === 'ios' ? styles.iosDatePicker : undefined}
        />
      )}

      {/* Body diagram */}
      <Text style={styles.label}>Muscles trained</Text>
      <View style={styles.viewToggle}>
        <Pressable
          style={[styles.toggleBtn, bodyView === 'front' && styles.toggleBtnActive]}
          onPress={() => setBodyView('front')}
        >
          <Text style={[styles.toggleText, bodyView === 'front' && styles.toggleTextActive]}>
            Front
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, bodyView === 'back' && styles.toggleBtnActive]}
          onPress={() => setBodyView('back')}
        >
          <Text style={[styles.toggleText, bodyView === 'back' && styles.toggleTextActive]}>
            Back
          </Text>
        </Pressable>
      </View>

      <View style={styles.bodyContainer}>
        <Body
          data={selectedMuscles}
          onBodyPartPress={handleBodyPartPress}
          side={bodyView}
          gender="male"
          scale={1.4}
          colors={['#3A3A3A', Colors.primaryDim, Colors.primary]}
        />
      </View>

      {selectedMuscles.length > 0 && (
        <Text style={styles.selectedHint}>
          {selectedMuscles.length} muscle{selectedMuscles.length > 1 ? 's' : ''} selected — tap to deselect
        </Text>
      )}

      {/* Notes */}
      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="How did it go?"
        placeholderTextColor={Colors.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
        maxLength={500}
      />

      {/* Save */}
      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Workout'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
  },
  inputText: {
    color: Colors.text,
    fontSize: 16,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  iosDatePicker: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginTop: 8,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.background,
  },
  bodyContainer: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 16,
    overflow: 'hidden',
  },
  selectedHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.background,
  },
});
