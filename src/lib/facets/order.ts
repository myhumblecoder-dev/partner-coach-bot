export type FacetLite = {
  id: string;
  label: string;
  status: string;
  evidenceCount: number;
  lastReinforced: Date;
};

export function staleIds(facets: FacetLite[], today: Date): string[] {
  const threshold = 60 * 86400000;
  return facets
    .filter((f) => {
      if (f.status !== 'active') return false;
      return today.getTime() - f.lastReinforced.getTime() > threshold;
    })
    .map((f) => f.id);
}

export function orderFacets(facets: FacetLite[]): FacetLite[] {
  return facets
    .filter((f) => f.status !== 'rejected')
    .sort((a, b) => {
      const getPriority = (status: string) => {
        if (status === 'active') return 1;
        if (status === 'stale') return 2;
        return 3;
      };

      const pA = getPriority(a.status);
      const pB = getPriority(b.status);

      if (pA !== pB) return pA - pB;
      if (a.evidenceCount !== b.evidenceCount) {
        return b.evidenceCount - a.evidenceCount;
      }
      return a.label.localeCompare(b.label);
    });
}