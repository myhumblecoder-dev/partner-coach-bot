import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { getProfileContext } from '@/lib/profile/context'
import { buildCoachPrompt } from '@/lib/coach/prompt'
import { detectIdeaAsk } from '@/lib/coach/ideaAsk'
import { generateSuggestion } from '@/lib/suggestions/generate'
import { extractFacts } from '@/lib/extraction/extract'

export async function respond(
  profileId: string,
  userMessage: string
): Promise<string> {
  const context = await getProfileContext(profileId)
  if (!context) {
    return 'I do not have a profile set up yet.'
  }

  // A concrete idea-ask routes to the tracked suggestion engine — it knows
  // what it already proposed and never repeats. Anything unclear falls
  // through to the coach.
  let ask = null
  try {
    ask = await detectIdeaAsk(userMessage)
  } catch {
    ask = null
  }
  if (ask) {
    try {
      const suggestion = await generateSuggestion(profileId, ask.kind, ask.audience)
      if (suggestion) {
        await prisma.message.create({
          data: { profileId, role: 'user', text: userMessage },
        })
        await prisma.message.create({
          data: { profileId, role: 'assistant', text: suggestion },
        })
        try {
          await extractFacts(profileId, userMessage)
        } catch {
          // fail-silent by design
        }
        return suggestion
      }
    } catch {
      // fall through to the coach
    }
  }

  // Newest-first from the store, chronological for the prompt.
  const recent = await prisma.message.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const history = [...recent]
    .reverse()
    .map((m) => ({ role: m.role, text: m.text }))

  const reply = await generate(buildCoachPrompt(context, history, userMessage))

  await prisma.message.create({
    data: { profileId, role: 'user', text: userMessage },
  })
  await prisma.message.create({
    data: { profileId, role: 'assistant', text: reply },
  })

  try {
    await extractFacts(profileId, userMessage)
  } catch {
    // extraction must never break or delay the reply
  }

  return reply
}