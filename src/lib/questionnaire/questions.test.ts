import { describe, it, expect } from 'vitest'
import { QUESTIONS } from './questions'

describe('questions', () => {
  it('has twelve questions', () => {
    expect(QUESTIONS).toHaveLength(12)
  })

  it('every id is unique', () => {
    const ids = QUESTIONS.map((q) => q.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(QUESTIONS.length)
  })

  it('every question has a prompt ending in a question mark', () => {
    QUESTIONS.forEach((q) => {
      expect(q.prompt.length).toBeGreaterThan(0)
      expect(q.prompt.endsWith('?')).toBe(true)
    })
  })

  it('every field is a known domain field', () => {
    const allowedFields = [
      'likes',
      'dislikes',
      'jokes',
      'moods',
      'dreams',
      'events',
      'gifts',
      'trips',
    ] as const

    QUESTIONS.forEach((q) => {
      expect(allowedFields).toContain(q.field as any)
    })
  })
})
