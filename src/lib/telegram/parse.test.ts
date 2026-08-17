import { describe, it, expect } from 'vitest'
import { parseUpdate } from './parse'

describe('parse', () => {
  it('extracts chat id and text', () => {
    const update = {
      message: {
        chat: {
          id: 4242,
        },
        text: 'hello',
      },
    }
    const result = parseUpdate(update)
    expect(result).toEqual({ chatId: '4242', text: 'hello' })
  })

  it('numeric chat id becomes a string', () => {
    const update = {
      message: {
        chat: {
          id: 12345,
        },
        text: 'test',
      },
    }
    const result = parseUpdate(update)
    expect(result?.chatId).toBe('12345')
    expect(typeof result?.chatId).toBe('string')
  })

  it('non-text message returns null', () => {
    const update = {
      message: {
        chat: {
          id: 1,
        },
        photo: [],
      },
    }
    const result = parseUpdate(update)
    expect(result).toBeNull()
  })

  it('malformed input returns null', () => {
    expect(parseUpdate(null)).toBeNull()
    expect(parseUpdate({})).toBeNull()
    expect(parseUpdate('nonsense')).toBeNull()
  })
})
