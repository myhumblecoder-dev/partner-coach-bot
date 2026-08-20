export type ExtractedOccasion = {
  kind: 'birthday' | 'anniversary' | 'other';
  label: string;
  month: number;
  day: number;
};

export type ExtractedFacts = {
  likes: string[];
  dislikes: string[];
  jokes: string[];
  dreams: string[];
  moods: string[];
  events: string[];
  gifts: string[];
  trips: string[];
  occasions: ExtractedOccasion[];
};

const EMPTY_FACTS: ExtractedFacts = {
  likes: [],
  dislikes: [],
  jokes: [],
  dreams: [],
  moods: [],
  events: [],
  gifts: [],
  trips: [],
  occasions: [],
};

export function parseExtraction(raw: string): ExtractedFacts {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return { ...EMPTY_FACTS };

    const parsed = JSON.parse(raw.substring(start, end + 1));
    const result: ExtractedFacts = { ...EMPTY_FACTS };
    type StringKey = Exclude<keyof ExtractedFacts, 'occasions'>;
    const keys: StringKey[] = [
      'likes', 'dislikes', 'jokes', 'dreams', 'moods', 'events', 'gifts', 'trips'
    ];

    // Occasions are structured, not strings: a recurring date is only worth
    // storing when the model committed to an explicit month and day.
    const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const KINDS = new Set(['birthday', 'anniversary', 'other']);
    if (Array.isArray(parsed.occasions)) {
      result.occasions = parsed.occasions
        .filter((o: unknown): o is Record<string, unknown> =>
          typeof o === 'object' && o !== null)
        .filter((o: Record<string, unknown>) =>
          typeof o.kind === 'string' && KINDS.has(o.kind) &&
          typeof o.label === 'string' && (o.label as string).trim().length > 0 &&
          Number.isInteger(o.month) && (o.month as number) >= 1 && (o.month as number) <= 12 &&
          Number.isInteger(o.day) && (o.day as number) >= 1 &&
          (o.day as number) <= DAYS[(o.month as number) - 1])
        .slice(0, 2)
        .map((o: Record<string, unknown>) => ({
          kind: o.kind as ExtractedOccasion['kind'],
          label: (o.label as string).trim(),
          month: o.month as number,
          day: o.day as number,
        }));
    }

    for (const key of keys) {
      const val = parsed[key];
      if (Array.isArray(val)) {
        result[key] = val
          .filter((item) => typeof item === 'string')
          .map((s) => s.trim())
          .filter((s) => s !== '')
          .slice(0, 3);
      }
    }

    return result;
  } catch {
    return { ...EMPTY_FACTS };
  }
}