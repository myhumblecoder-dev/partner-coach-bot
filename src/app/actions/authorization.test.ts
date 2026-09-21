import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '@/lib/db'
import { isSignedIn } from '@/lib/auth/session'
import { addEntry } from './addEntry'
import { addMood } from './addMood'
import { updateEntry, deleteEntry } from './editEntry'
import { rateGift } from './rateGift'
import { saveTimezone } from './saveTimezone'

vi.mock('@/lib/db', () => ({
  prisma: {
    profile: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    likesEntry: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    dislikesEntry: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    joke: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    mood: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    dream: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    gift: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
    trip: { create: vi.fn(), update: vi.fn(), delete: vi.fn(), deleteMany: vi.fn(), upsert: vi.fn(), updateMany: vi.fn() },
  },
}))
vi.mock('@/lib/auth/session', () => ({ isSignedIn: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const EVERY_WRITE = () =>
  Object.values(prisma as unknown as Record<string, Record<string, unknown>>)
    .flatMap((m) => Object.values(m))

// Server Actions are public POST endpoints — the action id ships in the
// client bundle, and a crafted request reaches the function body without
// ever passing through a page or the middleware. Before this guard existed,
// an anonymous POST to /portrait carrying a lifted action id ran
// saveTimezone to completion and changed the row. Every action must refuse
// on its own.
describe('an anonymous caller', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isSignedIn).mockResolvedValue(false)
  })

  const invocations: [string, () => Promise<{ ok: boolean }>][] = [
    ['addEntry', () => addEntry('p1', 'likes', 'tea')],
    ['addMood', () => addMood('p1', 'happy', null)],
    ['updateEntry', () => updateEntry('likes', 'id1', 'tea')],
    ['deleteEntry', () => deleteEntry('likes', 'id1')],
    ['rateGift', () => rateGift('g1', 'hit')],
    ['saveTimezone', () => saveTimezone('p1', 'America/New_York')],
  ]

  for (const [name, call] of invocations) {
    it(`is refused by ${name}, which writes nothing`, async () => {
      await expect(call()).resolves.toEqual({ ok: false })

      for (const write of EVERY_WRITE()) {
        expect(write).not.toHaveBeenCalled()
      }
    })
  }

  it('is refused by every action file in the directory', () => {
    // The table above can go stale. This cannot: a new action added to this
    // directory without the guard fails here rather than in production.
    // import.meta.url is an http: URL under vitest's transform, so the
    // path comes from the run root instead.
    const dir = join(process.cwd(), 'src/app/actions')
    const actionFiles = readdirSync(dir).filter(
      (f) => f.endsWith('.ts') && !f.includes('.test.')
    )

    expect(actionFiles.length).toBeGreaterThan(0)
    for (const file of actionFiles) {
      expect(readFileSync(join(dir, file), 'utf8')).toContain('isSignedIn')
    }
  })
})
