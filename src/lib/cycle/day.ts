import { localDayParts } from '@/lib/cadence/localDay'

const DAY_MS = 24 * 60 * 60 * 1000

/** Past this, the record can no longer place her in a cycle — a cycle and a
 * half. Nothing clears the row, so without a read-side bound a start
 * mentioned once in January is still being narrated to the coach in June
 * ("started 150 days ago") as if it meant something. The coach is better
 * told nothing than told a number that cannot be acted on. */
export const CYCLE_STALE_AFTER_DAYS = 45

/** How long a correction may still move the stored date BACKWARDS.
 *
 * Reports otherwise only move forward, which alone would make a bad date
 * permanent: the model hears "she started last Tuesday" as today, and the
 * user's "no, six days ago" computes an older date and is silently
 * dropped until the next cycle start happens to be reported. A correction
 * arrives close behind the mistake, so write recency — not the age of the
 * date itself — is what opens the door. */
export const CYCLE_CORRECTION_WINDOW_DAYS = 1

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
