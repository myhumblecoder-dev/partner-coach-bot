import { localDayParts } from '@/lib/cadence/localDay'

const DAY_MS = 24 * 60 * 60 * 1000

/** UTC midnight of the profile's local calendar day.
 *
 * The repo's shape for "a day, not a moment" — the cron's `ranOn` is built
 * the same way. Without a timezone it falls back to the UTC day, exactly as
 * `dueCadences` does.
 */
function localMidnightUTC(now: Date, timezone?: string | null): number {
  if (timezone) {
    const { year, month, dayOfMonth } = localDayParts(now, timezone)
    return Date.UTC(year, month - 1, dayOfMonth)
  }
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
}

/** The start date of a period reported as having begun `daysAgo` days ago.
 *
 * The model is asked for an OFFSET, never an absolute date. This codebase
 * has already watched it hallucinate the year (see the coach prompt's date
 * line and the fix that put the year back in it); a small whole number of
 * days back is the one thing a local model reliably gets right, and every
 * bit of calendar arithmetic happens here instead.
 */
export function startDateFromDaysAgo(
  now: Date,
  daysAgo: number,
  timezone?: string | null
): Date {
  return new Date(localMidnightUTC(now, timezone) - daysAgo * DAY_MS)
}

/** Whole days from the recorded start to today, in the profile's local days.
 *
 * Never negative: a start in the future is a record we should not reason
 * from, so it reads as day 0 rather than as a countdown.
 */
export function daysSinceStart(
  start: Date,
  now: Date,
  timezone?: string | null
): number {
  const days = Math.round(
    (localMidnightUTC(now, timezone) - start.getTime()) / DAY_MS
  )
  return days < 0 ? 0 : days
}
