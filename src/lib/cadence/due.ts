import { localDayParts } from './localDay'

export type CadenceKind = 'daily' | 'weekly' | 'monthly';

export function dueCadences(today: Date, timezone?: string): CadenceKind[] {
  const cadences: CadenceKind[] = ['daily'];

  let dayOfWeek: number;
  let dayOfMonth: number;

  if (timezone) {
    const parts = localDayParts(today, timezone);
    dayOfWeek = parts.dayOfWeek;
    dayOfMonth = parts.dayOfMonth;
  } else {
    dayOfWeek = today.getUTCDay();
    dayOfMonth = today.getUTCDate();
  }

  if (dayOfWeek === 0) {
    cadences.push('weekly');
  }

  if (dayOfMonth === 1) {
    cadences.push('monthly');
  }

  return cadences;
}