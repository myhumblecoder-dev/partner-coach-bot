import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import type { TelegramChat } from '@prisma/client'
import { POST } from './route'
import { sendMessage } from '@/lib/telegram/send'
import { respond } from '@/lib/coach/respond'
import { ensureLinkedProfile } from '@/lib/onboarding/link'
import { onboardingStep } from '@/lib/onboarding/step'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    likesEntry: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    dislikesEntry: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    joke: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    mood: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    event: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    gift: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    trip: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    dream: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    suggestion: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    telegramChat: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    message: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    questionnaireAnswer: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    occasion: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    cadenceRun: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    user: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    account: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    session: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    verificationToken: { create: vi.fn(), createMany: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), count: vi.fn() },
  },
}))

vi.mock('@/lib/telegram/send', () => ({
  sendMessage: vi.fn(),
}))

vi.mock('@/lib/coach/respond', () => ({
  respond: vi.fn(),
}))

vi.mock('@/lib/onboarding/link', () => ({
  ensureLinkedProfile: vi.fn(),
}))

vi.mock('@/lib/onboarding/step', () => ({
  onboardingStep: vi.fn(),
}))

const makeTelegramChat = (overrides: Partial<TelegramChat> = {}): TelegramChat =>
  ({
    id: '',
    chatId: '',
    profileId: '',
    createdAt: new Date(Date.UTC(2024, 0, 1)),
    ...overrides,
  } as unknown as TelegramChat)

describe('route', () => {
  const WEBHOOK_SECRET = 'super-set-token'
  const VALID_HEADER = 'valid-token'
  const INVALID_HEADER = 'wrong-token'

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_WEBHOOK_SECRET = WEBHOOK_SECRET
  })

  it('rejects a request with the wrong secret', async () => {
    const request = new Request('https://api.telegram.org/webhook', {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': INVALID_HEADER,
      },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(respond).not.toHaveBeenCalled()
  })

  it('acknowledges a non-text update', async () => {
    const request = new APIRequest('https://api.telegram.im/webhook', {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': WEBHOOK_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update_id: 12345,
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(respond).not.toHaveBeenCalled()
  })

  it('replies to a known chat', async () => {
    const chatId = '12345'
    const text = 'Hello Coach!'
    const profileId = 'p1'
    const replyText = 'Hello back!'

    const request = new Request('https://api.telegram.org/webhook', {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': WEBHOOK_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          chat: { id: chatId },
          text: text,
        },
      }),
    })

    vi.mocked(ensureLinkedProfile).mockResolvedValue({ profileId, created: true })
    vi.mocked(onboardingStep).mockResolvedValue(null)
    vi.mocked(respond).mockResolvedValue(replyText)

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(respond).toHaveBeenCalledWith(profileId, text)
    expect(sendMessage).toHaveBeenCalledWith(chatId, replyText)
  })

  it('first contact starts onboarding', async () => {
    const chatId = '99999'
    const text = 'Hi'
    const profileId = 'p1'
    const question = 'What is your name?'

    const request = new Request('https://api.telegram.org/webhook', {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': WEBHOOK_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          chat: { id: chatId },
          text: text,
        },
      }),
    })

    vi.mocked(ensureLinkedProfile).mockResolvedValue({ profileId, created: true })
    vi.mocked(onboardingStep).mockResolvedValue(question)

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(onboardingStep).toHaveBeenCalledWith(profileId, text)
    expect(sendMessage).toHaveBeenCalledWith(chatId, question)
    expect(respond).not.toHaveBeenCalled()
  })

  it('mid-questionnaire messages get the next question', async () => { 
    const chatId = '12345'
    const text = 'Answer to Q1'
    const profileId = 'p1'
    const nextQuestion = 'Question 2?'

    const request = new Request('https://api.telegram.org/webhook', {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': WEBHOOK_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          chat: { id: chatId },
          text: text,
        },
      }),
    })

    vi.mocked(ensureLinkedProfile).mockResolvedValue({ profileId, created: true })
    vi.mocked(onboardingStep).mockResolvedValue(nextQuestion)

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(sendMessage).toHaveBeenCalledWith(chatId, nextQuestion)
    expect(respond).not.toHaveBeenCalled()
  })

  // We use a payload that parseUpdate will return null for (e.g. an unhandled update type)
  // Since parseUpdate is not mocked, we rely on its real behavior.
  // For this test, we provide a valid JSON that doesn't contain a message.text
  it('handles non-message updates gracefully', async () => {
    const request = new Request('https://api.telegram.org/webhook', {
      method: 'POST',
      headers: {
        'x-telegram-bot-api-secret-token': WEBHOOK_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        update_id: 12345,
      }),
    })

    const response = await POST(request)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ ok: true })
    expect(respond).not.toHaveBeenCalled()
  })
})

// Helper to bypass Request body restrictions in some environments
class APIRequest extends Request {}
