export type CadenceKind = 'daily' | 'weekly' | 'monthly';

export function dueCadences(today: Date): CadenceKind[] {
  const cadences: CadenceKind[] = ['daily'];

  if (today.getUTCDay() === 0) {
    cadences.push('weekly');
  }

  if (today.getUTCDate() === 1) {
    cadences.push('monthly');
  }

  return cadences;
}