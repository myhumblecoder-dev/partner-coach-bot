import type { ProfileContext } from '@/lib/profile/context';

export function buildExtractionPrompt(context: ProfileContext, message: string): string {
  const { name, likes, dislikes, jokes, dreams, recentMoods, recentEvents, pastGifts, pastTrips } = context;

  const lines = [
    `Partner Name: ${name}`
  ];

  if (likes.length > 0) lines.push(`Already known likes: ${likes.join(', ')}`);
  if (dislikes.length > 0) lines.push(`Already known dislikes: ${dislikes.join(', ')}`);
  if (jokes.length > 0) lines.push(`Already known jokes: ${jokes.join(', ')}`);
  if (dreams.length > 0) lines.push(`Already known dreams: ${dreams.join(', ')}`);
  if (recentMoods.length > 0) lines.push(`Already known moods: ${recentMoods.join(', ')}`);
  if (recentEvents.length > 0) lines.push(`Already known events: ${recentEvents.join(', ')}`);
  if (pastGifts.length > 0) lines.push(`Already known gifts: ${pastGifts.join(', ')}`);
  if (pastTrips.length > 0) lines.push(`Already known trips: ${pastTrips.join(', ')}`);
  const occasions = context.occasions ?? [];
  if (occasions.length > 0) lines.push(`Already known occasions: ${occasions.map((o) => o.label).join(', ')}`);

  return `Return ONLY a JSON object with these eight keys, each an array of strings: "likes", "dislikes", "jokes", "dreams", "moods", "events", "gifts", "trips" — plus an optional ninth key "occasions": an array of {"kind": "birthday" or "anniversary" or "other", "label": string, "month": 1-12, "day": 1-31}, and an optional tenth key "cycle": {"daysAgo": integer}. Include an occasion ONLY when the user explicitly stated a recurring date with a month and day; never guess a date. Under "gifts", include only ACTUAL gifts — given, received, or concretely planned; never the word gifts itself, gift ideas in the abstract, or trips (trips belong under "trips").

Set "cycle" ONLY when the user explicitly said their partner's period STARTED, and set "daysAgo" to how many whole days ago it started — 0 for today, 1 for yesterday, 7 for a week ago. Use null for "cycle" in every other case: a period that is ongoing, ending, or late, cramps, PMS, moods, any symptom, or any mention of her cycle that does not report a start. Never infer a start from how she is feeling, and never give a calendar date here — only a whole number of days.

Extract only facts the user EXPLICITLY stated about their partner in this message; never infer, never invent; return empty arrays when nothing qualifies; at most 3 items per key; do not repeat anything already listed.

${lines.join('\n')}

${message}`;
}