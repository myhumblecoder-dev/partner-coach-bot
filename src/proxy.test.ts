import { describe, it, expect, vi } from 'vitest'
import proxy, { config } from './proxy'
import { auth } from '@/auth'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

// `auth` is overloaded in Auth.js, so vi.mocked(auth) resolves the
// middleware overload and rejects a session. Drive it through this:
//   mockAuth.mockResolvedValue({ user: { id: 'u1' } })
//   mockAuth.mockResolvedValue(null)
const mockAuth = vi.mocked(auth as unknown as () => Promise<unknown>)

describe('proxy', () => {
  it('default export is the auth function: `expect(proxy).toBeDefined()`', () => {
    expect(proxy).toBeDefined()
    expect(proxy).toBe(auth)
  })

  it('config matcher is an array: `expect(Array.isArray(config.matcher)).toBe(true)`', () => {
    expect(Array.isArray(config.matcher)).toBe(true)
    expect(config.matcher).toContain('/((?!api|_next/static|_next/image|favicon.ico).*)')
  })
})