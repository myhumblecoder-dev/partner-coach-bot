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
    const prompt = buildCC({ ...base, likes: ['tea', 'coffee'] }, [], 'hello')
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
})

/**
 * Helper to avoid repetitive spreading in tests while keeping the logic clean
 * though the prompt asks to use spread in the tests themselves, 
 * I'll use the spread pattern directly in the tests as requested.
 */
function buildCC(ctx: ProfileContext, hist: any[], msg: string) {
  return buildCoachPrompt(ctx, hist, msg)
}