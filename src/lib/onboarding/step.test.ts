import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { QUESTIONS } from '@/lib/questionnaire/questions'
import { onboardingStep } from './step'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: { findUnique: vi.fn(), update: vi.fn() },
    questionnaireAnswer: { findMany: vi.fn(), create: vi.fn() },
    likesEntry: { create: vi.fn() },
    dislikesEntry: { create: vi.fn() },
    joke: { create: vi.fn() },
    mood: { create: vi.fn() },
    dream: { create: vi.fn() },
    event: { create: vi.fn() },
    gift: { create: vi.fn() },
    trip: { create: vi.fn() },
  },
}))
// questions/flow are pure local modules — never mocked.

const CREATES = () => [
  prisma.questionnaireAnswer.create, prisma.likesEntry.create,
  prisma.dislikesEntry.create, prisma.joke.create, prisma.mood.create,
  prisma.dream.create, prisma.event.create, prisma.gift.create,
  prisma.trip.create,
]

describe('onboardingStep', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.profile.update).mockResolvedValue({} as never)
    vi.mocked(prisma.questionnaireAnswer.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.questionnaireAnswer.create).mockResolvedValue({} as never)
    vi.mocked(prisma.likesEntry.create).mockResolvedValue({} as never)
  })

  it('asks for the name first', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Your person' } as never)

    const reply = await onboardingStep('p1', '')

    expect(reply).toContain('name')
    for (const fn of CREATES()) expect(fn).not.toHaveBeenCalled()
  })

  it('stores the name and asks the first question', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Your person' } as never)

    const reply = await onboardingStep('p1', 'Ada')

    expect(prisma.profile.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Ada' }) }))
    expect(reply).toContain(QUESTIONS[0].prompt)
  })

  it('stores an answer to its field and asks the next question', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Ada' } as never)

    const reply = await onboardingStep('p1', 'tea and rainy mornings')

    expect(prisma.questionnaireAnswer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ questionId: QUESTIONS[0].id }),
      }))
    // QUESTIONS[0].field is 'likes'
    expect(prisma.likesEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profileId: 'p1',
          text: 'tea and rainy mornings',
        }),
      }))
    expect(reply).toBe(QUESTIONS[1].prompt)
  })

  it('hands over to the coach when complete', async () => {
    vi.mocked(prisma.profile.findUnique).mockResolvedValue(
      { id: 'p1', name: 'Ada' } as never)
    vi.mocked(prisma.questionnaireAnswer.findMany).mockResolvedValue(
      QUESTIONS.map((q) => ({ questionId: q.id })) as never)

    const reply = await onboardingStep('p1', 'anything')

    expect(reply).toBeNull()
    for (const fn of CREATES()) expect(fn).not.toHaveBeenCalled()
  })
})

it('answers carry questionnaire provenance', async () => {
  // Top-level test: the describe's beforeEach does not apply here.
  vi.clearAllMocks()
  vi.mocked(prisma.profile.findUnique).mockResolvedValue(
    { id: 'p1', name: 'Ada' } as never)
  vi.mocked(prisma.questionnaireAnswer.findMany).mockResolvedValue([] as never)
  vi.mocked(prisma.questionnaireAnswer.create).mockResolvedValue({} as never)
  vi.mocked(prisma.likesEntry.create).mockResolvedValue({} as never)

  await onboardingStep('p1', 'tea and rainy mornings')

  expect(prisma.likesEntry.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({ source: 'questionnaire' }),
    }))
})
