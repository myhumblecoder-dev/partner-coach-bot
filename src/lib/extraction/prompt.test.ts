import { describe, it, expect } from 'vitest'
import { buildExtractionPrompt } from './prompt'
import type { ProfileContext } from '@/lib/profile/context'

describe('prompt', () => {
  const base: ProfileContext = {
    name: 'Ada',
    likes: [],
    dislikes: [],
    jokes: [],
    dreams: [],
    recentMoods: [],
    recentEvents: [],
    pastGifts: [],
    pastTrips: []
  }

  it('ends with the message', () => {
    const message = 'she loved the thai place'
    const prompt = buildExtractionPrompt(base, message)
    expect(prompt.endsWith(message)).toBe(true)
  })

  it('lists known items for dedupe', () => {
    const context = { ...base, likes: ['tea'] }
    const prompt = buildExtractionPrompt(context, 'new message')
    expect(prompt).toContain('Already known likes: tea')
  })

  it('names the eight keys', () => {
    const prompt = buildExtractionPrompt(base, 'new message')
    const keys = ['likes', 'dislikes', 'jokes', 'dreams', 'moods', 'events', 'gifts', 'trips']
    keys.forEach(key => {
      expect(prompt).toContain(`"${key}"`) 
    })
  })
})
