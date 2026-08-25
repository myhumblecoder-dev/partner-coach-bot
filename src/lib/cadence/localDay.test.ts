import { describe, it, expect } from 'vitest'
import { localDayParts } from './localDay'

describe('localDay', () => {
  it('UTC zone returns Tuesday Aug 25 for 2026-08-25T02Z', () => {
    const date = new Date(Date.UTC(2026, 7, 25, 2, 0, 0)); // Month is 0-indexed, 7 = August
    const result = localDayParts(date, 'UTC');

    expect(result.year).toBe(2026);
    expect(result.month).toBe(8);
    expect(result.dayOfMonth).toBe(25);
    expect(result.dayOfWeek).toBe(2); // Tuesday
  });

  it('NY zone rolls back to Monday Aug 24 for 2026-08-25T02Z', () => {
    const date = new Date(Date.UTC(2026, 7, 25, 2, 0, 0));
    const result = localDayParts(date, 'America/New_York');

    expect(result.year).toBe(2026);
    expect(result.month).toBe(8);
    expect(result.dayOfMonth).toBe(24);
    expect(result.dayOfWeek).toBe(1); // Monday
  });

  it('Tokyo forward crossing Sep 1', () => {
    // 2026-08-31T16:00:00Z in JST (UTC+9) is 2026-09-01 01:00:00
    const date = new Date(Date.UTC(2026, 7, 31, 16, 0, 0));
    const result = localDayParts(date, 'Asia/Tokyo');

    expect(result.year).toBe(2026);
    expect(result.month).toBe(9);
    expect(result.dayOfMonth).toBe(1);
    expect(result.dayOfWeek).toBe(2); // Tuesday
  });

  it('NY Sunday Nov 1 dayOfWeek zero', () => {
    // 2026-11-01T10:00:00Z in EST (UTC-5) is 2026-11-01 05:00:00
    const date = new Date(Date.UTC(2026, 10, 1, 10, 0, 0));
    const result = localDayParts(date, 'America/New_York');

    expect(result.year).toBe(2026);
    expect(result.month).toBe(11);
    expect(result.dayOfMonth).toBe(1);
    expect(result.dayOfWeek).toBe(0); // Sunday
  });
});