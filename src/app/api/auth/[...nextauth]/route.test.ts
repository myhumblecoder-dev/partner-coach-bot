import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from './route'

vi.mock('@/auth', () => ({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
}))

describe('route', () => {
  it('GET is exported', () => {
    expect(GET).toBeDefined()
  })

  it('POST is exported', () => {
    expect(POST).toBeDefined()
  })
})
