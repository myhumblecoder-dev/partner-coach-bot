import { describe, it, expect } from 'vitest'
import { moodBuckets } from './moodBuckets'

describe('moodBuckets', () => {
  it('groups same-day moods into one bucket', () => {
    const day1 = new Date(Date.UTC(2026, 7, 17, 10, 0, 0));
    const day1Late = new Date(Date.UTC(2026, 7, 17, 22, 0, 0));
    const day2 = new Date(Date.UTC(2026, 7, 18, 5, 0, 0));

    const input = [
      { label: 'Happy', recordedAt: day1 },
      { label: 'Calm', recordedAt: day1Late },
      { label: 'Energetic', recordedAt: day2 },
    ];

    const result = moodBuckets(input);

    expect(result).toHaveLength(2);
    expect(result[0].day).toBe('2026-08-17');
    expect(result[0].labels).toHaveLength(2);
    expect(result[0].labels).toEqual(['Happy', 'Calm']);
  })

  it('buckets are sorted by day ascending', () => {
    const day1 = new Date(Date.UTC(2026, 7, 17, 10, 0, 0));
    const day2 = new Date(Date.UTC(2026, 7, 18, 10, 0, 0));

    const input = [
      { label: 'Late', recordedAt: day2 },
      { label: 'Early', recordedAt: day1 },
    ];

    const result = moodBuckets(input);

    expect(result[0].day).toBe('2026-08-17');
  })

  it('empty input is an empty array', () => {
    expect(moodBuckets([])).toEqual([]);
  })
})
