import { describe, it, expect } from 'vitest'
import { buildCoachPrompt } from './prompt'
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

  it('includes the partner name', () => {
    const prompt = buildCoachPrompt(base, [], 'hello')
    expect(prompt).toContain('Ada')
  })

  it('includes populated sections', () => {
    const prompt = buildCoachPrompt({ ...base, likes: ['tea', 'coffee'] }, [], 'hello')
    expect(prompt).toContain('Likes:')
    expect(prompt).toContain('tea')
    expect(prompt).toContain('coffee')
  })

  it('omits empty sections', () => {
    const prompt = buildCoachPrompt(base, [], 'hello')
    expect(prompt).not.toContain('Dislikes:')
    expect(prompt).not.toContain('Jokes:')
    expect(prompt).not.toContain('Dreams:')
  })

  it('ends with the user message', () => {
    const userMsg = 'what should I plan?'
    const prompt = buildCoachPrompt(base, [{ role: 'user', text: 'hi' }], userMsg)
    expect(prompt.endsWith(userMsg)).toBe(true)
  })

  it('opens with the understanding', () => {
    const context = {
      ...base,
      summary: 'She is a maker of order.'
    }
    const prompt = buildCoachPrompt(context, [], 'hello')
    const expectedLine = 'What you understand about Ada: She is a maker of order.'
    
    expect(prompt).toContain(expectedLine)
    
    // Ensure it appears before any section headings like Likes:
    const summaryIndex = prompt.indexOf(expectedLine)
    const likesIndex = prompt.indexOf('Likes:')
    if (likesIndex !== -1) {
      expect(summaryIndex).toBeLessThan(likesIndex)
    }
  })

  it('findings replace raw lists per section', () => {
    const context = {
      ...base,
      likes: ['orderliness', 'cleanliness'],
      facets: [
        {
          section: 'likes',
          label: 'order at home',
          evidenceCount: 3
        }
      ]
    } as any // Cast to any to bypass strict type check for the partial facet object
    const prompt = buildCoachPrompt(context, [], 'hello')
    
    expect(prompt).toContain('order at home (×3)')
    expect(prompt).not.toContain('orderliness')
    expect(prompt).not.toContain('cleanliness')
  })

  it('gift outcomes are named', () => {
    const context = {
      ...base,
      giftRecord: [
        { description: 'record player', howItLanded: 'hit' },
        { description: 'perfume set', howItLanded: 'miss' },
        { description: 'book', howItLanded: 'unrated' }
      ]
    } as any
    const prompt = buildCoachPrompt(context, [], 'hello')
    
    expect(prompt).toContain('record player')
    expect(prompt).toContain('landed')
    
    expect(prompt).toContain('perfume set')
    expect(prompt).toContain('missed')

    expect(prompt).toContain('book')
    expect(prompt).toContain('unrated')
  })

  it('includes local date line when timezone set', () => {
    const context = { ...base, timezone: 'UTC' }
    const prompt = buildCoachPrompt(context, [], 'hello')
    
    expect(prompt).toContain('Today is ')
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const hasMonth = months.some(month => prompt.includes(month))
    expect(hasMonth).toBe(true)
    // The user's ask was date AND time — the line carries a local clock too.
    expect(prompt.split('\n')[0]).toMatch(/^Today is [A-Z][a-z]+, [A-Z][a-z]+ \d{1,2}, \d{1,2}:\d{2} (AM|PM) \(UTC\)\.$/)
  })
})
