import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import { isSignedIn } from './session'

vi.mock('@/auth', () => ({ auth: vi.fn() }))

describe('isSignedIn', () => {
  beforeEach(() => vi.clearAllMocks())

  it('is true for a session with a user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { email: 'a@b.c' } } as never)

    await expect(isSignedIn()).resolves.toBe(true)
  })

  it('is false with no session at all', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)

    await expect(isSignedIn()).resolves.toBe(false)
  })

  it('is false for a session carrying no user', async () => {
    vi.mocked(auth).mockResolvedValue({} as never)

    await expect(isSignedIn()).resolves.toBe(false)
  })

  it('fails closed when the session lookup throws', async () => {
    vi.mocked(auth).mockRejectedValue(new Error('no cookie store'))

    await expect(isSignedIn()).resolves.toBe(false)
  })
})
