import { prisma } from '@/lib/db'
import { QUESTIONS, type Question } from '@/lib/questionnaire/questions'
import { nextQuestion } from '@/lib/questionnaire/flow'

const PLACEHOLDER_NAME = 'Your person'

async function storeAnswer(
  profileId: string,
  question: Question,
  text: string
): Promise<void> {
  await prisma.questionnaireAnswer.create({
    data: { profileId, questionId: question.id, answer: text },
  })
  switch (question.field) {
    case 'likes':
      await prisma.likesEntry.create({ data: { profileId, text, source: 'questionnaire' } })
      break
    case 'dislikes':
      await prisma.dislikesEntry.create({ data: { profileId, text, source: 'questionnaire' } })
      break
    case 'jokes':
      await prisma.joke.create({ data: { profileId, text, source: 'questionnaire' } })
      break
    case 'moods':
      await prisma.mood.create({ data: { profileId, label: text, source: 'questionnaire' } })
      break
    case 'dreams':
      await prisma.dream.create({ data: { profileId, description: text, source: 'questionnaire' } })
      break
    case 'events':
      await prisma.event.create({
        data: { profileId, title: text, occurredAt: new Date(), source: 'questionnaire' },
      })
      break
    case 'gifts':
      await prisma.gift.create({ data: { profileId, description: text, source: 'questionnaire' } })
      break
    case 'trips':
      await prisma.trip.create({ data: { profileId, destination: text, source: 'questionnaire' } })
      break
  }
}

/** The next message the bot should send, or null when onboarding is done. */
export async function onboardingStep(
  profileId: string,
  text: string
): Promise<string | null> {
  const trimmed = text.trim()

  const profile = await prisma.profile.findUnique({ where: { id: profileId } })
  if (profile && profile.name === PLACEHOLDER_NAME) {
    if (!trimmed) {
      return 'Welcome to cherish.ai. What is their name?'
    }
    await prisma.profile.update({
      where: { id: profileId },
      data: { name: trimmed },
    })
    return (
      `${trimmed} it is. Twelve quick questions to start the portrait.\n\n` +
      QUESTIONS[0].prompt
    )
  }

  const answered = await prisma.questionnaireAnswer.findMany({
    where: { profileId },
  })
  const answeredIds = answered.map((a) => a.questionId)
  const current = nextQuestion(answeredIds)
  if (current === null) {
    return null // questionnaire complete: the coach takes it from here
  }

  await storeAnswer(profileId, current, trimmed)
  const upNext = nextQuestion([...answeredIds, current.id])
  if (upNext === null) {
    return (
      'That completes the questionnaire — the portrait has its first ' +
      'layer. From here, just talk to me: tell me how things are going, ' +
      'and ask whenever you need an idea.'
    )
  }
  return upNext.prompt
}
