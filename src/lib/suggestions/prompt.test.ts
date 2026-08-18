import { describe, it, expect } from 'vitest'
import { buildSuggestionPrompt, type SuggestionKind, type Audience } from './prompt'
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

  it('names the kind and audience', () => {
    const kind: SuggestionKind = 'gift'
    const audience: Audience = 'for_her'
    const prompt = buildSuggestionPrompt(base, [], kind, audience)

    expect(prompt).toContain('gift')
    expect(prompt).toContain('for her')
  })

  it('lists existing suggestions to avoid', () => {
    const existing = ['a picnic', 'a movie night']
    const prompt = buildSuggestionPrompt(base, existing, 'date', 'for_us')

    expect(prompt).toContain('a picnic')
    expect(prompt).toContain('a movie night')
    expect(prompt).toContain('Do not repeat any of these existing suggestions.')
  })

  it('no repeat section when nothing exists', () => {
    const prompt = buildSuggestionPrompt(base, [], 'trip', 'for_family')

    expect(prompt).not.toContain('repeat')
    expect(prompt).not.toContain('Existing suggestions')
  })
})
