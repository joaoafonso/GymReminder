import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/colors';
import { getMuscleLabel } from '../constants/muscles';

type Props = {
  muscle: string;
  selected?: boolean;
};

export function MuscleChip({ muscle, selected }: Props) {
  return (
    <View style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {getMuscleLabel(muscle)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.background,
  },
});
