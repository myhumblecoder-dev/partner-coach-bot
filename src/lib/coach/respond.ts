import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { getProfileContext } from '@/lib/profile/context'
import { buildCoachPrompt } from '@/lib/coach/prompt'

export async function respond(
  profileId: string,
  userMessage: string
): Promise<string> {
  const context = await getProfileContext(profileId)
  if (!context) {
    return 'I do not have a profile set up yet.'
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

  return reply
}
