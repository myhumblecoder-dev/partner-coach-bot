import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { sendMessage } from '@/lib/telegram/send'
import { respond } from '@/lib/coach/respond'
import { ensureLinkedProfile } from '@/lib/onboarding/link'
import { onboardingStep } from '@/lib/onboarding/step'

vi.mock('@/lib/telegram/send', () => ({ sendMessage: vi.fn() }))
vi.mock('@/lib/coach/respond', () => ({ respond: vi.fn() }))
vi.mock('@/lib/onboarding/link', () => ({ ensureLinkedProfile: vi.fn() }))
vi.mock('@/lib/onboarding/step', () => ({ onboardingStep: vi.fn() }))
// verify and parse are pure local modules — never mocked; the 401 test
// proves real rejection, not a mocked one.

function request(body: unknown, secret?: string): Request {
  return new Request('http://localhost/api/telegram', {
    method: 'POST',
    headers: secret ? { 'x-telegram-bot-api-secret-token': secret } : {},
    body: JSON.stringify(body),
  })
}

const UPDATE = { message: { chat: { id: 6300285519 }, text: 'hello' } }

describe('POST /api/telegram', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.TELEGRAM_WEBHOOK_SECRET = 'hooksecret'
    vi.mocked(ensureLinkedProfile).mockResolvedValue({ profileId: 'p1', created: false })
    vi.mocked(onboardingStep).mockResolvedValue(null)
    vi.mocked(respond).mockResolvedValue('a coached reply')
  })

  it('rejects a request with the wrong secret', async () => {
    const res = await POST(request(UPDATE, 'wrong'))

    expect(res.status).toBe(401)
    expect(respond).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('acknowledges a non-text update', async () => {
    const res = await POST(request({ message: { chat: { id: 1 }, photo: [] } }, 'hooksecret'))

    expect(res.status).toBe(200)
    expect(respond).not.toHaveBeenCalled()
  })

  it('replies to a known chat via the coach', async () => {
    const res = await POST(request(UPDATE, 'hooksecret'))

    expect(res.status).toBe(200)
    expect(respond).toHaveBeenCalledWith('p1', 'hello')
    expect(sendMessage).toHaveBeenCalledWith('6300285519', 'a coached reply')
  })

  it('first contact starts onboarding', async () => {
    vi.mocked(ensureLinkedProfile).mockResolvedValue({ profileId: 'p9', created: true })
    vi.mocked(onboardingStep).mockResolvedValue('Welcome to cherish.ai. What is their name?')

    const res = await POST(request(UPDATE, 'hooksecret'))

    expect(res.status).toBe(200)
    expect(sendMessage).toHaveBeenCalledWith(
      '6300285519', 'Welcome to cherish.ai. What is their name?')
    expect(respond).not.toHaveBeenCalled()
  })

  it('mid-questionnaire messages get the next question', async () => {
    vi.mocked(onboardingStep).mockResolvedValue('Question 2?')

    await POST(request(UPDATE, 'hooksecret'))

    expect(sendMessage).toHaveBeenCalledWith('6300285519', 'Question 2?')
    expect(respond).not.toHaveBeenCalled()
  })
})
