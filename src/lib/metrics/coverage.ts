export type Coverage = {
  filled: number;
  total: number;
  gaps: string[];
};

export function coverage(counts: Record<string, number>): Coverage {
  const keys = Object.keys(counts);
  const total = keys.length;
  const gaps: string[] = [];
  let filled = 0;

  for (const key of keys) {
    if (counts[key] > 0) {
      filled++;
    } else {
      gaps.push(key);
    }
  }

  return {
    filled,
    total,
    gaps,
  };
}