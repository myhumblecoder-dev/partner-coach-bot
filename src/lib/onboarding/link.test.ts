import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureLinkedProfile } from './link'
import { prisma as db } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  prisma: {
    telegramChat: {
      findUnique: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
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
    delete process.env.TELEGRAM_ALLOWED_CHAT_IDS
    // No chat linked yet: the first-run claim is open.
    vi.mocked(db.telegramChat.count).mockResolvedValue(0 as never)
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
    expect(result?.created).toBe(true)
    expect(result?.profileId).toBe('p1')
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
    expect(result?.profileId).toBe('p2')
    expect(result?.created).toBe(true)
  })

  describe('who may claim a link', () => {
    it('refuses a stranger once some chat is already linked', async () => {
      // The bug: this returned the OWNER's profile, so the coach answered a
      // stranger with the whole study and filed their messages into it.
      vi.mocked(db.telegramChat.findUnique).mockResolvedValue(null as never)
      vi.mocked(db.telegramChat.count).mockResolvedValue(1 as never)

      await expect(ensureLinkedProfile('99999')).resolves.toBeNull()

      expect(db.telegramChat.create).not.toHaveBeenCalled()
      expect(db.profile.create).not.toHaveBeenCalled()
      expect(db.profile.findFirst).not.toHaveBeenCalled()
    })

    it('an allowlist admits only the ids on it', async () => {
      process.env.TELEGRAM_ALLOWED_CHAT_IDS = '42, 77'
      vi.mocked(db.telegramChat.findUnique).mockResolvedValue(null as never)
      // Even with chats already linked, an allowlisted id gets through.
      vi.mocked(db.telegramChat.count).mockResolvedValue(3 as never)
      vi.mocked(db.profile.findFirst).mockResolvedValue({ id: 'p1' } as never)
      vi.mocked(db.telegramChat.create).mockResolvedValue({} as never)

      await expect(ensureLinkedProfile('77')).resolves.toEqual({
        profileId: 'p1',
        created: true,
      })
      await expect(ensureLinkedProfile('99999')).resolves.toBeNull()
      expect(db.telegramChat.create).toHaveBeenCalledTimes(1)
    })

    it('an already-linked chat is never re-checked', async () => {
      // Revoking an id from the allowlist does not cut an existing link;
      // that is a deliberate limit, not an oversight.
      process.env.TELEGRAM_ALLOWED_CHAT_IDS = '42'
      vi.mocked(db.telegramChat.findUnique).mockResolvedValue(
        { chatId: '99999', profileId: 'p1' } as never)

      await expect(ensureLinkedProfile('99999')).resolves.toEqual({
        profileId: 'p1',
        created: false,
      })
    })
  })
})
