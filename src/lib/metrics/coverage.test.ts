import { describe, it, expect } from 'vitest'
import { coverage } from './coverage'

describe('coverage', () => {
  it('counts filled and total', () => {
    const input = { likes: 3, dislikes: 0, jokes: 1 }
    const result = coverage(input)
    expect(result).toEqual({
      filled: 2,
      total: 3,
      gaps: ['dislikes'],
    })
  })

  it('all filled means no gaps', () => {
    const input = { likes: 1, jokes: 2 }
    const result = coverage(input)
    expect(result.gaps).toEqual([])
    expect(result.filled).toBe(2)
    expect(result.total).toBe(2)
  })

  it('empty input is empty coverage', () => {
    const input = {}
    const result = coverage(input)
    expect(result).toEqual({
      filled: 0,
      total: 0,
      gaps: [],
    })
  })
})
