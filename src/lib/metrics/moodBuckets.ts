export type MoodBucket = {
  day: string;
  labels: string[];
};

export function moodBuckets(moods: { label: string; recordedAt: Date }[]): MoodBucket[] {
  if (moods.length === 0) {
    return [];
  }

  const bucketsMap: Record<string, string[]> = {};

  for (const mood of moods) {
    const day = mood.recordedAt.toISOString().slice(0, 10);
    if (!bucketsMap[day]) {
      bucketsMap[day] = [];
    }
    bucketsMap[day].push(mood.label);
  }

  return Object.keys(bucketsMap)
    .sort()
    .map((day) => ({
      day,
      labels: bucketsMap[day],
    }));
}