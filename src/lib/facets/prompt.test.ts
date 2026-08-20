import { describe, it, expect } from 'vitest'
import { buildSynthesisPrompt } from './prompt'

describe('prompt', () => {
  it('numbers the observations', () => {
    const input = {
      partnerName: 'Alex',
      section: 'Interests',
      facets: [],
      observations: [
        { index: 0, text: 'gardening' },
        { index: 1, text: 'planting herbs' }
      ]
    }

    const prompt = buildSynthesisPrompt(input)

    expect(prompt).toContain('0: gardening')
    expect(prompt).toContain('1: planting herbs')
  })

  it('offers existing facets by id', () => {
    const input = {
      partnerName: 'Alex',
      section: 'Interests',
      facets: [
        { id: 'f1', label: 'order at home', status: 'active' }
      ],
      observations: []
    }

    const prompt = buildSynthesisPrompt(input)

    expect(prompt).toContain('f1')
    expect(prompt).toContain('order at home')
  })

  it('rejected labels are forbidden, not offered', () => {
    const input = {
      partnerName: 'Alex',
      section: 'Interests',
      facets: [
        { id: 'f2', label: 'bad label', status: 'rejected' }
      ],
      observations: []
    }

    const prompt = buildSynthesisPrompt(input)

    // Check that the rejected label is mentioned in the context of being forbidden
    // We use a regex to find 'bad label' and then check if 'not' or 'never' appears within 200 chars
    const index = prompt.indexOf('bad label')
    expect(index).not.toBe(-1)

    const contextWindow = prompt.substring(Math.max(0, index - 100), Math.min(prompt.length, index + 200))
    expect(contextWindow).toMatch(/not|never/i)
  })
})
