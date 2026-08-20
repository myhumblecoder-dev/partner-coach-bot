import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generate } from '@/lib/ai'
import { detectIdeaAsk } from './ideaAsk'

vi.mock('@/lib/ai', () => ({ generate: vi.fn() }))

describe('detectIdeaAsk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('detects a gift ask for her', async () => {
    vi.mocked(generate).mockResolvedValue('gift for_her')

    await expect(
      detectIdeaAsk('what should I get her for her birthday?')
    ).resolves.toEqual({ kind: 'gift', audience: 'for_her' })
  })

  it('NONE and garbage are null', async () => {
    vi.mocked(generate).mockResolvedValueOnce('NONE')
    await expect(detectIdeaAsk('she had a rough day')).resolves.toBeNull()

    vi.mocked(generate).mockResolvedValueOnce('banana')
    await expect(detectIdeaAsk('banana?')).resolves.toBeNull()
  })

  it('a missing audience defaults to for_us', async () => {
    vi.mocked(generate).mockResolvedValue('date')

    await expect(detectIdeaAsk('any date ideas?')).resolves.toEqual({
      kind: 'date',
      audience: 'for_us',
    })
  })

  it('a model failure is null', async () => {
    vi.mocked(generate).mockRejectedValue(new Error('down'))

    await expect(detectIdeaAsk('gift ideas?')).resolves.toBeNull()
  })
})
