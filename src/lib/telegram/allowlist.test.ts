import { describe, it, expect } from 'vitest'
import { parseAllowedChatIds } from './allowlist'

describe('parseAllowedChatIds', () => {
  it('splits, trims and drops blanks', () => {
    expect(parseAllowedChatIds(' 42, 6300285519 ,,  ')).toEqual([
      '42',
      '6300285519',
    ])
  })

  it('a single id needs no commas', () => {
    expect(parseAllowedChatIds('42')).toEqual(['42'])
  })

  it('unset and empty are both empty', () => {
    expect(parseAllowedChatIds(undefined)).toEqual([])
    expect(parseAllowedChatIds('')).toEqual([])
    expect(parseAllowedChatIds('  ,  ')).toEqual([])
  })
})
