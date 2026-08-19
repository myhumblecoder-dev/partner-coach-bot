import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { respond } from '@/lib/coach/respond'
import { sendMessage } from '@/lib/telegram/send'
import { GET } from './route'

vi.mock('@/lib/db', () => ({
  prisma: {
    telegramChat: { findMany: vi.fn() },
    occasion: { findMany: vi.fn() },
    cadenceRun: { findFirst: vi.fn(), create: vi.fn() },
  },
}))
vi.mock('@/lib/coach/respond', () => ({ respond: vi.fn() }))
vi.mock('@/lib/telegram/send', () => ({ sendMessage: vi.fn() }))
// @/lib/cadence/due and @/lib/cadence/occasions are NOT mocked: they are pure
// local modules, and mocking them would assert against our own mock.

function request(auth?: string): Request {
  return new Request('http://localhost/api/cron',
    auth ? { headers: { authorization: auth } } : undefined)
}

describe('GET /api/cron', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'cronsecret'
    vi.mocked(prisma.telegramChat.findMany).mockResolvedValue([
      { chatId: '42', profileId: 'p1' },
    ] as never)
    vi.mocked(prisma.occasion.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.cadenceRun.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.cadenceRun.create).mockResolvedValue({} as never)
    vi.mocked(respond).mockResolvedValue('good morning')
  })

  it('rejects a request without the cron secret', async () => {
    const res = await GET(request())

    expect(res.status).toBe(401)
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('rejects everything when the secret is unconfigured', async () => {
    delete process.env.CRON_SECRET

    const res = await GET(request('Bearer anything'))

    expect(res.status).toBe(401)
  })

  it('sends the daily check-in', async () => {
    const res = await GET(request('Bearer cronsecret'))

    expect(res.status).toBe(200)
    expect(sendMessage).toHaveBeenCalledWith('42', 'good morning')
    expect(prisma.cadenceRun.create).toHaveBeenCalled()
  })

  it('does not resend a cadence already run today', async () => {
    vi.mocked(prisma.cadenceRun.findFirst).mockResolvedValue({ id: 'r1' } as never)

    await GET(request('Bearer cronsecret'))

    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('reports the number of messages sent', async () => {
    const res = await GET(request('Bearer cronsecret'))

    const body = await res.json()
    expect(typeof body.sent).toBe('number')
    expect(body.sent).toBeGreaterThan(0)
  })
})
