import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { buildSynthesisPrompt } from '@/lib/facets/prompt'
import { parseSynthesis } from '@/lib/facets/parse'

export type FacetSection = 'likes' | 'dislikes' | 'jokes' | 'dreams' | 'trips'

type Row = { id: string; [key: string]: unknown }

function sectionModel(section: FacetSection) {
  switch (section) {
    case 'likes':
      return { findMany: (w: object) => prisma.likesEntry.findMany(w as never), update: (a: object) => prisma.likesEntry.update(a as never), column: 'text' as const }
    case 'dislikes':
      return { findMany: (w: object) => prisma.dislikesEntry.findMany(w as never), update: (a: object) => prisma.dislikesEntry.update(a as never), column: 'text' as const }
    case 'jokes':
      return { findMany: (w: object) => prisma.joke.findMany(w as never), update: (a: object) => prisma.joke.update(a as never), column: 'text' as const }
    case 'dreams':
      return { findMany: (w: object) => prisma.dream.findMany(w as never), update: (a: object) => prisma.dream.update(a as never), column: 'description' as const }
    case 'trips':
      return { findMany: (w: object) => prisma.trip.findMany(w as never), update: (a: object) => prisma.trip.update(a as never), column: 'destination' as const }
  }
}

/** Cluster a section's unassigned observations into facets. Returns how many
 * observations were newly assigned. Synthesis can only ever be BEHIND —
 * an unplaced observation stays unassigned for next week — never destructive. */
export async function synthesizeSection(
  profileId: string,
  section: FacetSection
): Promise<number> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } })
  if (!profile) return 0

  const model = sectionModel(section)
  const observations = (await model.findMany({
    where: { profileId, facetId: null },
  })) as Row[]
  if (observations.length === 0) return 0

  const facets = await prisma.facet.findMany({ where: { profileId, section } })
  const known = new Map(facets.map((f) => [f.id, f]))

  const prompt = buildSynthesisPrompt({
    partnerName: profile.name,
    section,
    facets: facets.map((f) => ({ id: f.id, label: f.label, status: f.status })),
    observations: observations.map((o, index) => ({
      index,
      text: String(o[model.column] ?? ''),
    })),
  })
  const assignments = parseSynthesis(await generate(prompt), observations.length)

  let assigned = 0
  for (const a of assignments) {
    const rows = a.observations.map((i) => observations[i])
    if (rows.length === 0) continue

    let facetId: string
    if (a.facetId !== null) {
      if (!known.has(a.facetId)) continue // hallucinated id: skip, never guess
      facetId = a.facetId
      await prisma.facet.update({
        where: { id: facetId },
        data: {
          evidenceCount: { increment: rows.length },
          lastReinforced: new Date(),
        },
      })
    } else {
      const created = await prisma.facet.create({
        data: {
          profileId,
          section,
          label: a.label as string,
          evidenceCount: rows.length,
        },
      })
      facetId = created.id
    }

    for (const row of rows) {
      await model.update({ where: { id: row.id }, data: { facetId } })
      assigned++
    }
  }
  return assigned
}
