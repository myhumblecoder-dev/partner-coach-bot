import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { respond } from '@/lib/coach/respond'
import { sendMessage } from '@/lib/telegram/send'
import { GET } from './route'
import { synthesizeSection } from '@/lib/facets/synthesize'
import { composePortraitSummary } from '@/lib/facets/summary'

vi.mock('@/lib/db', () => ({
  prisma: {
    telegramChat: { findMany: vi.fn() },
    occasion: { findMany: vi.fn() },
    cadenceRun: { findFirst: vi.fn(), create: vi.fn() },
    profile: { findUnique: vi.fn() },
    facet: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}))
vi.mock('@/lib/coach/respond', () => ({ respond: vi.fn() }))
vi.mock('@/lib/telegram/send', () => ({ sendMessage: vi.fn() }))
vi.mock('@/lib/facets/synthesize', () => ({ synthesizeSection: vi.fn() }))
vi.mock('@/lib/facets/summary', () => ({ composePortraitSummary: vi.fn() }))

function request(auth?: string): Request {
  return new Request('http://localhost/api/cron',
    auth ? { headers: { authorization: auth } } : undefined)
}

describe('route', () => {
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
    vi.mocked(prisma.facet.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.facet.updateMany).mockResolvedValue({ count: 0 } as never)
    vi.mocked(synthesizeSection).mockResolvedValue(1)
    vi.mocked(composePortraitSummary).mockResolvedValue(null)
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

  it('weekly runs synthesis for the five sections', async () => {
    // Sunday, Aug 23, 2026
    const sunday = new Date(Date.UTC(2026, 7, 23, 13, 0, 0))
    vi.setSystemTime(sunday)

    // We need to ensure dueCadences returns 'weekly'
    // Since we don't mock dueCadences, we rely on the real implementation
    // which for a Sunday will include 'weekly'.

    vi.mocked(prisma.facet.findMany).mockResolvedValue([
      { id: 'f1', profileId: 'p1', section: 'likes', label: 'x', status: 'active', evidenceCount: 1, lastReinforced: new Date() } as any
    ] as any)

    const res = await GET(request('Bearer cronsecret'))
    const body = await res.json()

    const sections = ['likes', 'dislikes', 'jokes', 'dreams', 'trips']
    for (const section of sections) {
      expect(synthesizeSection).toHaveBeenCalledWith('p1', section)
    }
    expect(composePortraitSummary).toHaveBeenCalledWith('p1')
    expect(body.synthesized).toBeGreaterThan(0)

    vi.useRealTimers()
  })

  it('a plain weekday synthesizes nothing', async () => {
    // Monday, Aug 24, 2026
    const monday = new Date(Date.UTC(2026, 7, 24, 13, 0, 0))
    vi.setSystemTime(monday)

    const res = await GET(request('Bearer cronsecret'))
    const body = await res.json()

    expect(synthesizeSection).not.toHaveBeenCalled()
    expect(body.synthesized).toBe(0)

    vi.useRealTimers()
  })

  it('synthesis failure does not break the check-in', async () => {
    // Sunday, Aug 23, 2026
    const sunday = new Date(Date.UTC(2026, 7, 23, 13, 0, 0))
    vi.setSystemTime(sunday)

    vi.mocked(synthesizeSection).mockRejectedValue(new Error('Synthesis failed'))

    const res = await GET(request('Bearer cronsecret'))

    expect(res.status).toBe(200)
    expect(sendMessage).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('passes timezone to dueCadences', async () => {
    // 02:00 UTC Aug 25 = 22:00 EDT Aug 24 — an Aug-24 occasion is due ONLY if
    // the profile timezone is threaded through (the #201 midnight crossing).
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T02:00:00Z'))
    try {
      vi.mocked(prisma.telegramChat.findMany).mockResolvedValue(
        [{ chatId: 'c1', profileId: 'p1' }] as never)
      vi.mocked(prisma.profile.findUnique).mockResolvedValue(
        { timezone: 'America/New_York' } as never)
      vi.mocked(prisma.cadenceRun.findFirst).mockResolvedValue({ id: 'ran' } as never)
      vi.mocked(prisma.occasion.findMany).mockResolvedValue(
        [{ id: 'o1', kind: 'birthday', label: 'her birthday', month: 8, day: 24, leadTimeDays: 0 }] as never)
      vi.mocked(prisma.facet.findMany).mockResolvedValue([] as never)

      const res = await GET(request('Bearer cronsecret'))

      expect(res.status).toBe(200)
      expect(prisma.profile.findUnique).toHaveBeenCalledWith(
        { where: { id: 'p1' }, select: { timezone: true } })
      expect(sendMessage).toHaveBeenCalledWith('c1',
        expect.stringContaining('her birthday'))
    } finally {
      vi.useRealTimers()
    }
  })
})
