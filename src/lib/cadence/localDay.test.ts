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
});