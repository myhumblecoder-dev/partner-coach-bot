import { describe, it, expect } from 'vitest'
import { nextQuestion } from './flow'
import { QUESTIONS } from '@/lib/questionnaire/questions'

describe('flow', () => {
  it('returns the first question when nothing is answered', () => {
    expect(nextQuestion([])).toEqual(QUESTIONS[0])
  })

  it('skips answered questions', () => {
    const answeredIds = [QUESTIONS[0].id]
    expect(nextQuestion(answeredIds)).toEqual(QUESTIONS[1])
  })

  it('returns null when all are answered', () => {
    const allAnsweredIds = QUESTIONS.map((q) => q.id)
    expect(nextQuestion(allAnsweredIds)).toBeNull()
  })

  it('unknown ids are ignored', () => {
    const answeredIds = ['no-such-question']
    expect(nextQuestion(answeredIds)).toEqual(QUESTIONS[0])
  })
})
