import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureLinkedProfile } from './link'
import { prisma as db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  prisma: {
    telegramChat: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    profile: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('link', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the existing link without writing', async () => {
    vi.mocked(db.telegramChat.findUnique).mockResolvedValue({
      id: 'chat-123',
      chatId: '42',
      profileId: 'p1',
      createdAt: new Date(Date.UTC(2024, 0, 1)),
    } as any)

    const result = await ensureLinkedProfile('42')

    expect(result).toEqual({ profileId: 'p1', created: false })
    expect(db.telegramChat.create).not.toHaveBeenCalled()
  })

  it('links an existing profile', async () => {
    vi.mocked(db.telegramChat.findUnique).mockResolvedValue(null as any)
    vi.mocked(db.profile.findFirst).mockResolvedValue({
      id: 'p1',
      name: 'Existing',
    } as any)
    vi.mocked(db.telegramChat.create).mockResolvedValue({ id: 'chat-42' } as any)

    const result = await ensureLinkedProfile('42')

    expect(db.telegramChat.create).toHaveBeenCalledWith({
      data: { chatId: '42', profileId: 'p1' },
    })
    expect(result.created).toBe(true)
    expect(result.profileId).toBe('p1')
  })

  it('creates the profile when none exists', async () => {
    vi.mocked(db.telegramChat.findUnique).mockResolvedValue(null as any)
    vi.mocked(db.profile.findFirst).mockResolvedValue(null as any)
    vi.mocked(db.profile.create).mockResolvedValue({
      id: 'p2',
      name: 'Your person',
    } as any)
    vi.mocked(db.telegramChat.create).mockResolvedValue({ id: 'chat-42' } as any)

    const result = await ensureLinkedProfile('42')

    expect(db.profile.create).toHaveBeenCalledWith({
      data: { name: 'Your person' },
    })
    expect(result.profileId).toBe('p2')
    expect(result.created).toBe(true)
  })
})
