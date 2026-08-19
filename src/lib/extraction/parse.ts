export type ExtractedFacts = {
  likes: string[];
  dislikes: string[];
  jokes: string[];
  dreams: string[];
  moods: string[];
  events: string[];
  gifts: string[];
  trips: string[];
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
};

export function parseExtraction(raw: string): ExtractedFacts {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return { ...EMPTY_FACTS };

    const parsed = JSON.parse(raw.substring(start, end + 1));
    const result: ExtractedFacts = { ...EMPTY_FACTS };
    const keys: (keyof ExtractedFacts)[] = [
      'likes', 'dislikes', 'jokes', 'dreams', 'moods', 'events', 'gifts', 'trips'
    ];

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