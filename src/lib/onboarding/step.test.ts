import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { generate } from '@/lib/ai'
import { extractFacts } from '@/lib/extraction/extract'
import { QUESTIONS } from '@/lib/questionnaire/questions'
import { onboardingStep } from './step'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: { findUnique: vi.fn(), update: vi.fn() },
    questionnaireAnswer: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
}))
vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))
vi.mock('@/lib/extraction/extract', () => ({ extractFacts: vi.fn() }))
// questions/flow are pure local modules — never mocked.

describe('onboardingStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)
    vi.mocked(prisma.questionnaireAnswer.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.questionnaireAnswer.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.questionnaireAnswer.create).mockResolvedValue({} as never)
    vi.mocked(extractFacts).mockResolvedValue(0)
    // Default voice: the model hiccups, fallbacks carry the flow.
    vi.mocked(generate).mockResolvedValue('')
  })

  it('a first greeting earns the name question, not a name', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Your person' } as never)

    const reply = await onboardingStep('p1', 'Hi')

    expect(reply).toContain('name')
    expect(prisma.profile.update).not.toHaveBeenCalled()
    expect(prisma.questionnaireAnswer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ questionId: 'partner-name' }),
      }))
  })

  it('extracts the name from a conversational reply', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Your person' } as never)
    vi.mocked(prisma.questionnaireAnswer.findFirst).mockResolvedValue(
      { id: 'm1', questionId: 'partner-name' } as never)
    vi.mocked(generate)
      .mockResolvedValueOnce('Yoyo')  // name extraction
      .mockResolvedValueOnce('')      // voice falls back

    const reply = await onboardingStep('p1', 'Her name is Yoyo')

    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Yoyo' }) }))
    expect(reply).toContain(QUESTIONS[0].prompt)
  })

  it('a correction is not a name — it earns a re-ask', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Your person' } as never)
    vi.mocked(prisma.questionnaireAnswer.findFirst).mockResolvedValue(
      { id: 'm1', questionId: 'partner-name' } as never)
    vi.mocked(generate)
      .mockResolvedValueOnce('NONE')  // extraction sees no name given
      .mockResolvedValueOnce('')      // voice falls back

    const reply = await onboardingStep('p1', 'No her name is not Hi')

    expect(prisma.profile.update).not.toHaveBeenCalled()
    expect(reply).toContain('name')
  })

  it('an answer records progress and feeds extraction', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Yoyo' } as never)

    const reply = await onboardingStep('p1', 'she loves gardening and old films')

    expect(prisma.questionnaireAnswer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ questionId: QUESTIONS[0].id }),
      }))
    expect(extractFacts).toHaveBeenCalledWith('p1', 'she loves gardening and old films')
    expect(reply).toContain(QUESTIONS[1].prompt)
  })

  it('extraction failure never wedges the questionnaire', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Yoyo' } as never)
    vi.mocked(extractFacts).mockRejectedValue(new Error('model down'))

    const reply = await onboardingStep('p1', 'she loves gardening')

    expect(prisma.questionnaireAnswer.create).toHaveBeenCalled()
    expect(reply).toContain(QUESTIONS[1].prompt)
  })

  it('hands over to the coach when complete', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Yoyo' } as never)
    vi.mocked(prisma.questionnaireAnswer.findMany).mockResolvedValue(
      QUESTIONS.map((q) => ({ questionId: q.id })) as never)

    const reply = await onboardingStep('p1', 'anything')

    expect(reply).toBeNull()
    expect(extractFacts).not.toHaveBeenCalled()
  })
})
