import { localDayParts } from './localDay';

export type OccasionInput = {
  id: string;
  kind: string;
  label: string;
  month: number;
  day: number;
  leadTimeDays: number;
};

export function dueOccasions(occasions: OccasionInput[], today: Date, timezone?: string): OccasionInput[] {
  const results: OccasionInput[] = [];
  let todayStart: Date;
  if (timezone) {
    const { year, month, dayOfMonth } = localDayParts(today, timezone);
    // UTC midnight representing the user's LOCAL calendar date.
    todayStart = new Date(Date.UTC(year, month - 1, dayOfMonth));
  } else {
    todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  for (const occasion of occasions) {
    // 1. Start with the occurrence in the current year
    let occurrence = new Date(today.getFullYear(), occasion.month - 1, occasion.day);
    let occurrenceStart = new Date(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate());

    // 2. If the date has already passed this year, roll to next year
    if (occurrenceStart < todayStart) {
      const nextYear = occurrence.getFullYear() + 1;
      occurrence = new Date(nextYear, occasion.month - 1, occasion.day);
      occurrenceStart = new Date(occurrence.getFullYear(), occurrence.getMonth(), occurrence.getDate());
    }

    // 3. Calculate the end of the lead window (today + leadTimeDays)
    const windowEnd = new Date(todayStart);
    windowEnd.setDate(todayStart.getDate() + occasion.leadTimeDays);
    const windowEndEndOfDay = new Date(windowEnd.getFullYear(), windowEnd.getMonth(), windowEnd.getDate(), 23, 59, 59, 999);

    // 4. Check if the occurrence falls within [today, today + leadTimeDays]
    if (occurrenceStart >= todayStart && occurrenceStart <= windowEndEndOfDay) {
      results.push(occasion);
    }
  }

  return results;
}