export function localDayParts(date: Date, tz: string): { year: number; month: number; dayOfMonth: number; dayOfWeek: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'long',
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };

  const result: Record<string, string> = {};
  for (const part of parts) {
    result[part.type] = part.value;
  }

  return {
    year: parseInt(result.year, 10),
    month: parseInt(result.month, 10),
    dayOfMonth: parseInt(result.day, 10),
    dayOfWeek: lookup[result.weekday] ?? 0,
  };
}