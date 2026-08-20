import { describe, it, expect } from 'vitest'
import { parseExtraction } from './parse'

describe('parse', () => {
  it('parses fenced JSON and caps at three', () => {
    const raw = `
      Here is the data:
      \`\`\`json
      {
        "likes": ["  tea  ", "coffee", "boba", "juice", "milk"],
        "dislikes": ["rain"]
      }
      \`\`\`
    `
    const result = parseExtraction(raw)
    expect(result.likes).toHaveLength(3)
    expect(result.likes).toEqual(['tea', 'coffee', 'boba'])
    expect(result.dislikes).toEqual(['rain'])
  })

  it('malformed input is all-empty', () => {
    const emptyResult = {
      likes: [],
      dislikes: [],
      jokes: [],
      dreams: [],
      moods: [],
      events: [],
      gifts: [],
      trips: [],
      occasions: [],
    }
    expect(parseExtraction('no json here')).toEqual(emptyResult)
    expect(parseExtraction('{broken')).toEqual(emptyResult)
    expect(parseExtraction('')).toEqual(emptyResult)
  })

  it('non-strings and unknown keys are dropped', () => {
    const raw = JSON.stringify({
      likes: ['tea', 7, '  ', 'coffee'],
      hobbies: ['x'],
      dislikes: [null, 'rain']
    })
    const result = parseExtraction(raw)
    expect(result.likes).toEqual(['tea', 'coffee'])
    expect(result.dislikes).toEqual(['rain'])
    // @ts-expect-error - checking runtime behavior for unknown keys
    expect(result.hobbies).toBeUndefined()
  })

  it('missing keys become empty arrays', () => {
    const raw = JSON.stringify({
      likes: ['tea']
    })
    const result = parseExtraction(raw)
    expect(result.likes).toEqual(['tea'])
    expect(result.dislikes).toEqual([])
    expect(result.trips).toEqual([])
  })

  it('parses a structured occasion and drops invalid dates', () => {
    const result = parseExtraction(JSON.stringify({
      occasions: [
        { kind: 'birthday', label: 'her birthday', month: 9, day: 4 },
        { kind: 'anniversary', label: 'x', month: 2, day: 31 },
        { kind: 'party', label: 'y', month: 1, day: 1 },
        'not an object',
      ],
    }))

    expect(result.occasions).toEqual([
      { kind: 'birthday', label: 'her birthday', month: 9, day: 4 },
    ])
  })
})
