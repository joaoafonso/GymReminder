export const MUSCLE_GROUPS = [
  { slug: 'chest', label: 'Chest' },
  { slug: 'upper-back', label: 'Upper Back' },
  { slug: 'lower-back', label: 'Lower Back' },
  { slug: 'shoulders', label: 'Shoulders' },
  { slug: 'biceps', label: 'Biceps' },
  { slug: 'triceps', label: 'Triceps' },
  { slug: 'forearm', label: 'Forearms' },
  { slug: 'abs', label: 'Abs' },
  { slug: 'obliques', label: 'Obliques' },
  { slug: 'quadriceps', label: 'Quadriceps' },
  { slug: 'hamstring', label: 'Hamstrings' },
  { slug: 'calves', label: 'Calves' },
  { slug: 'gluteal', label: 'Glutes' },
] as const;

export type MuscleSlug = (typeof MUSCLE_GROUPS)[number]['slug'];

export function getMuscleLabel(slug: string): string {
  return MUSCLE_GROUPS.find((m) => m.slug === slug)?.label ?? slug;
}
