# Design: facets — the portrait learns to synthesize

Approved direction (2026-08-20): the chip is one *utterance*; the unit of
study is the *finding*. Two layers:

- **Observations** — the existing entry rows. Immutable, dated,
  provenance-marked, append-only forever. They move into an expandable
  "field notes" area per section; ✕/edit stay here.
- **Facets** — few, strong, synthesized. A weekly pass by the coach's model
  (the *portrait editor*) clusters a section's observations into facets with
  a canonical phrasing, reinforces existing ones (evidence count, last
  reinforced), and lets untouched ones go stale rather than be deleted. The
  page renders facets weighted by evidence; observations are the receipts
  underneath.

Decisions:

1. **Weekly cadence**, on the existing cron's weekly beat. Live synthesis
   would re-label the portrait daily; a study updates its findings on
   review, not on every note.
2. **The composed paragraph exists** — 2–3 sentences from active facet
   labels only, stored on the profile, shown as the portrait's abstract
   under the header dates. Grounding rule: it may only rephrase facets,
   never introduce facts.
3. **Sections that facet**: likes, dislikes, jokes, dreams, trips. Gifts
   stay a ledger (episodic); moods and events stay a timeline (temporal).
4. **Rejection teaches.** Rejecting a facet sets `status: rejected`; its
   evidence keeps its assignment so re-clustering doesn't resurrect it, and
   the synthesis prompt lists rejected labels as forbidden.
5. **Stale is deterministic**: no new evidence in 60 days → `stale`
   (a pure function of dates, not a model call). Stale facets render faded,
   below active ones.
6. **Fallback**: a section with no facets yet renders chips exactly as
   today — first synthesis upgrades it. Deploy-day synthesis is run once by
   hand so the portrait doesn't wait a week.
7. **The coach benefits too** (follow-up, not this epic): once facets are
   trustworthy, the conversation context sends facet labels instead of raw
   lists — fixes prompt bloat at the same root.

Mechanics: clustering is index-based — the prompt numbers the section's
observations and existing facets; the model returns strict JSON assigning
observation indices to existing facet ids or new labels. The parser drops
anything malformed, out of range, or over-cap. Every observation the model
fails to place stays unassigned for the next pass — synthesis can only ever
be behind, never wrong-and-destructive.
