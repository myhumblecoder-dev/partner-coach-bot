import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { QUESTIONS } from '@/lib/questionnaire/questions'
import { nextQuestion } from '@/lib/questionnaire/flow'
import { extractFacts } from '@/lib/extraction/extract'

const PLACEHOLDER_NAME = 'Your person'
// Reserved progress marker: unknown ids are ignored by nextQuestion, so it
// never counts toward the twelve.
const NAME_MARKER = 'partner-name'

/** The name being GIVEN in a reply, or null when there isn't one.
 *
 * "Hi" became the partner's name in production; the deterministic fix
 * (a greeting blocklist) still read "No her name is not Hi" as an answer to
 * question one. Understanding a reply is model work.
 */
async function extractName(text: string): Promise<string | null> {
  try {
    const raw = await generate(
      "The user was asked for their partner's first name. From their reply, " +
      'extract the name being given. Reply with ONLY the name — or the word ' +
      'NONE if no name is actually being given (a greeting, a question, or a ' +
      `correction is not a name).\n\nTheir reply: "${text}"`)
    const name = raw.trim().split(/\s+/).slice(0, 3).join(' ').replace(/["'.]/g, '')
    if (!name || /^none$/i.test(name) || name.length > 40) return null
    return name
  } catch {
    return null
  }
}

/** A conversational line, with a plain fallback so onboarding never wedges
 * on a model hiccup. */
async function say(instruction: string, fallback: string): Promise<string> {
  try {
    const out = (await generate(instruction)).trim()
    return out || fallback
  } catch {
    return fallback
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
    const asked = await prisma.questionnaireAnswer.findFirst({
      where: { profileId, questionId: NAME_MARKER },
    })
    if (!asked) {
      await prisma.questionnaireAnswer.create({
        data: { profileId, questionId: NAME_MARKER, answer: '' },
      })
      return say(
        'You are a warm relationship coach called cherish.ai, meeting a new ' +
        'user. In one or two short sentences: welcome them, say you will ' +
        'help them study and delight their partner, and ask for their ' +
        "partner's name.",
        "Welcome to cherish.ai — I'm here to help you study and delight " +
        'your partner. What is their name?')
    }
    const name = await extractName(trimmed)
    if (!name) {
      return say(
        'You are a warm relationship coach. The user has not told you their ' +
        `partner's name yet — their last message was: "${trimmed}". In one ` +
        'short friendly sentence, ask again for the name.',
        "I didn't catch it — what is their name?")
    }
    await prisma.profile.update({
      where: { id: profileId },
      data: { name },
    })
    const first = QUESTIONS[0].prompt
    return say(
      `You are a warm relationship coach. The user just told you their ` +
      `partner is called ${name}. In one short sentence acknowledge the ` +
      `name warmly, mention you have twelve quick questions to start their ` +
      `portrait, then ask exactly this question: "${first}"`,
      `${name} it is. Twelve quick questions to start the portrait.\n\n${first}`)
  }

  const answered = await prisma.questionnaireAnswer.findMany({
    where: { profileId },
  })
  const answeredIds = answered.map((a) => a.questionId)
  const current = nextQuestion(answeredIds)
  if (current === null) {
    return null // questionnaire complete: the coach takes it from here
  }

  // Progress first — extraction may fail, and a wedged questionnaire is
  // worse than a thin answer. The raw text is kept on the answer row; the
  // portrait rows come from the same extraction pipeline the coach uses,
  // so one honest rambling answer can feed several fields.
  await prisma.questionnaireAnswer.create({
    data: { profileId, questionId: current.id, answer: trimmed },
  })
  try {
    await extractFacts(profileId, trimmed)
  } catch {
    // fail-silent by design
  }

  const upNext = nextQuestion([...answeredIds, current.id])
  if (upNext === null) {
    return say(
      'You are a warm relationship coach. The user just finished a twelve-' +
      'question intake about their partner. In two short sentences: tell ' +
      'them the questionnaire is complete and the portrait has its first ' +
      'layer, and invite them to just talk to you from here on.',
      'That completes the questionnaire — the portrait has its first ' +
      'layer. From here, just talk to me: tell me how things are going, ' +
      'and ask whenever you need an idea.')
  }
  return say(
    `You are a warm relationship coach walking a user through intake ` +
    `questions about their partner. They just answered: "${trimmed}". In ` +
    `one short sentence acknowledge their answer, then ask exactly this ` +
    `question: "${upNext.prompt}"`,
    upNext.prompt)
}
