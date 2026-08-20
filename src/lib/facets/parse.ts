export type Assignment = {
  facetId: string | null;
  label: string | null;
  observations: number[];
};

export function parseSynthesis(raw: string, observationCount: number): Assignment[] {
  try {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return [];

    const jsonStr = raw.slice(start, end + 1);
    const data = JSON.parse(jsonStr);
    const inputAssignments = Array.isArray(data?.assignments) ? data.assignments : [];

    const seenIndices = new Set<number>();
    const validAssignments: Assignment[] = [];

    for (const item of inputAssignments) {
      if (validAssignments.length >= 10) break;

      const fId = typeof item?.facetId === 'string' && item.facetId.trim() !== '' ? item.facetId : null;
      const lbl = typeof item?.label === 'string' && item.label.trim() !== '' ? item.label.trim().slice(0, 60) : null;

      if ((fId === null && lbl === null) || (fId !== null && lbl !== null)) continue;

      const obs = Array.isArray(item?.observations) ? item.observations : [];
      const filteredObs: number[] = [];

      for (const idx of obs) {
        if (Number.isInteger(idx) && idx >= 0 && idx < observationCount && !seenIndices.has(idx)) {
          filteredObs.push(idx);
          seenIndices.add(idx);
        }
      }

      if (filteredObs.length > 0) {
        validAssignments.push({
          facetId: fId,
          label: lbl,
          observations: filteredObs,
        });
      }
    }

    return validAssignments;
  } catch {
    return [];
  }
}