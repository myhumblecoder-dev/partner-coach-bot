export type SynthesisInput = {
  partnerName: string;
  section: string;
  facets: { id: string; label: string; status: string }[];
  observations: { index: number; text: string }[];
};

export function buildSynthesisPrompt(input: SynthesisInput): string {
  const { partnerName, section, facets, observations } = input;

  const activeFacets = facets
    .filter((f) => f.status !== 'rejected')
    .map((f) => `${f.id}: ${f.label}`);

  const rejectedFacets = facets
    .filter((f) => f.status === 'rejected')
    .map((f) => f.label);

  const facetInstructions = activeFacets.length > 0
    ? `Existing facets: ${activeFacets.join(', ')}.`
    : '';

  const rejectionWarning = rejectedFacets.length > 0
    ? ` The following labels were rejected by the user and must NOT be recreated, under this or any similar phrasing: ${rejectedFacets.join(', ')}.`
    : '';

  const observationList = observations
    .map((o) => `${o.index}: ${o.text}`)
    .join('\n');

  return `Task: Cluster the numbered observations about ${partnerName} into findings for the section "${section}".

Instructions:
- Assign each observation index either to an existing facet by its ID or to a NEW facet with a short canonical label (2–6 words, about the partner, no meta-language).
- Return ONLY a JSON object of the shape: { "assignments": [{ "facetId": string | null, "label": string | null, "observations": number[] }] }.
- To reinforce an existing facet, set "facetId" (and "label" to null).
- To create a new one, set "label" (and "facetId" to null).
- An observation index may appear at most once; indices not confidently placed must be OMITTED, never guessed.
${facetInstructions}${rejectionWarning}

Observations:
${observationList}`;
}