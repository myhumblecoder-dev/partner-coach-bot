import React from 'react';
import type { MoodBucket } from '@/lib/metrics/moodBuckets';

// Purely presentational tone map — unknown labels fall through to neutral.
const WARM = new Set(['happy', 'content', 'calm', 'excited', 'loved', 'playful']);
const HEAVY = new Set(['stressed', 'tired', 'sad', 'anxious', 'frustrated', 'sick']);

function tone(label: string): string {
  const l = label.toLowerCase();
  if (WARM.has(l)) return 'border-accent/30 bg-accent/10 text-accent';
  if (HEAVY.has(l)) return 'border-line bg-paper text-ink-soft';
  return 'border-line bg-card text-ink';
}

export default function MoodTimeline({ buckets }: MoodTimelineProps) {
  if (buckets.length === 0) {
    return <p className="text-sm italic text-ink-soft">No moods recorded yet.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-line pl-5">
      {buckets.map((bucket) => (
        <li key={bucket.day} data-testid="mood-day" className="relative">
          <span className="absolute -left-[23px] top-1.5 h-2 w-2 rounded-full bg-accent" />
          <p className="font-mono text-xs text-ink-soft">{bucket.day}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {bucket.labels.map((label, i) => (
              <span
                key={`${label}-${i}`}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone(label)}`}
              >
                {label}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

interface MoodTimelineProps {
  buckets: MoodBucket[];
}
