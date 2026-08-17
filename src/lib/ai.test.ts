import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generate } from './ai'

describe('ai', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('ollama provider returns response text', async () => {
    process.env.AI_PROVIDER = 'ollama'
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ response: 'hello from ollama' }),
    } as Response)

    const result = await generate('test prompt')

    expect(result).toBe('hello from ollama')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/generate'),
      expect.any(Object)
    )
  })

  it('anthropic provider returns content text', async () => {
    process.env.AI_PROVIDER = 'anthropic'
    process.env.ANTHROPIC_API_KEY = 'test-key'
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ content: [{ text: 'hello from claude' }] }),
    } as Response)

    const result = await generate('test prompt')

    expect(result).toBe('hello from claude')
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-key',
        }),
      })
    )
  })

  it('throws on non-ok response', async () => {
    process.env.AI_PROVIDER = 'ollama'
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
    } as Response)

    await expect(generate('prompt')).rejects.toThrow()
  })
})
