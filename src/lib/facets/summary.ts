import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'

/** Compose and store the portrait's abstract from active facets.
 * Grounding rule: the model may only rephrase findings, never add facts.
 * Fewer than 3 active facets → no abstract; two findings is padding. */
export async function composePortraitSummary(
  profileId: string
): Promise<string | null> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } })
  if (!profile) return null

  const facets = await prisma.facet.findMany({
    where: { profileId, status: 'active' },
  })
  if (facets.length < 3) return null

  const findings = facets.map((f) => `${f.section}: ${f.label}`).join('\n')
  try {
    const raw = await generate(
      `These are studied findings about ${profile.name}:\n${findings}\n\n` +
      'Write 2-3 warm sentences describing them USING ONLY these findings. ' +
      'Never add facts, names, or dates that are not in the list. No ' +
      'preamble, no markdown — just the sentences.')
    const summary = raw.trim()
    if (!summary) return null
    await prisma.profile.update({
      where: { id: profileId },
      data: { portraitSummary: summary, summaryUpdatedAt: new Date() },
    })
    return summary
  } catch {
    return null
  }
}
