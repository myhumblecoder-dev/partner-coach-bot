import React from 'react';
import type { MoodBucket } from '@/lib/metrics/moodBuckets';

interface MoodTimelineProps {
  buckets: MoodBucket[];
}

export default function MoodTimeline({ buckets }: MoodTimelineProps) {
  if (buckets.length === 0) {
    return <p>No moods recorded yet.</p>;
  }

  return (
    <div className="space-y-4">
      {buckets.map((bucket) => (
        <div
          key={bucket.day}
          data-testid="mood-day"
          className="flex items-center gap-4 border-b border-slate-200 pb-2"
        >
          <span className="font-medium text-slate-900 min-w-[100px]">
            {bucket.day}
          </span>
          <div className="flex flex-wrap gap-2">
            {bucket.labels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
