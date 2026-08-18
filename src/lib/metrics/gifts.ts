export type GiftStats = {
  logged: number;
  hits: number;
  misses: number;
  unrated: number;
  successRate: number | null;
};

export function giftStats(gifts: { howItLanded: string | null }[]): GiftStats {
  const logged = gifts.length;
  let hits = 0;
  let misses = 0;
  let unrated = 0;

  for (const gift of gifts) {
    if (gift.howItLanded === 'hit') {
      hits++;
    } else if (gift.howItLanded === 'miss') {
      misses++;
    } else {
      unrated++;
    }
  }

  const totalRated = hits + misses;
  const successRate = totalRated > 0 ? hits / totalRated : null;

  return {
    logged,
    hits,
    misses,
    unrated,
    successRate,
  };
}