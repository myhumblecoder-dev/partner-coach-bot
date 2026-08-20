import { describe, it, expect } from 'vitest'
import { parseSynthesis } from './parse'

describe('parse', () => {
  it('parses reinforcement and creation', () => {
    const raw = '{"assignments": [{"facetId": "f1", "observations": [0, 2]}, {"label": "japanese food", "observations": [1]}]}'
    const count = 3
    const result = parseSynthesis(raw, count)
    expect(result).toEqual([
      { facetId: 'f1', label: null, observations: [0, 2] },
      { facetId: null, label: 'japanese food', observations: [1] }
    ])
  })

  it('malformed input is empty', () => {
    expect(parseSynthesis('nope', 5)).toEqual([])
    expect(parseSynthesis('{"assignments": "x"}', 5)).toEqual([])
  })

  it('out-of-range and duplicate indices are dropped', () => {
    // First assignment has 0 (valid) and 7 (out of range for count 3)
    // Second assignment has 0 (duplicate of first)
    const raw = '{"assignments": [{"facetId": "f1", "observations": [0, 7]}, {"label": "f2", "observations": [0]}]}'
    const count = 3
    const result = parseSynthesis(raw, count)
    
    // The first assignment should keep [0]. 
    // The second assignment's [0] is a duplicate, so it's dropped.
    // Since the second assignment is now empty, it is dropped entirely.
    expect(result).toEqual([
      { facetId: 'f1', label: null, observations: [0] }
    ])
  })

  it('an assignment with both ids is dropped', () => {
    const raw = '{"assignments": [{"facetId": "f1", "label": "x", "observations": [0]}]}'
    const count = 1
    const result = parseSynthesis(raw, count)
    expect(result).toEqual([])
  })
})
