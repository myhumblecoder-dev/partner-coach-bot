import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StudyMetrics from './StudyMetrics'

describe('StudyMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows coverage and gaps', async () => {
    const coverage = { filled: 2, total: 3, gaps: ['jokes'] }
    const gifts = { logged: 1, hits: 1, misses: 0, unrated: 0, successRate: 1.0 }
    
    render(<StudyMetrics coverage={coverage} daysSinceTouch={1} gifts={gifts} />)
    
    expect(screen.getByText('2 of 3 areas filled')).toBeInTheDocument()
    expect(screen.getByTestId('coverage-gap')).toHaveTextContent('jokes')
  })

  it('shows recency in days', async () => {
    const coverage = { filled: 1, total: 1, gaps: [] }
    const gifts = { logged: 1, hits: 1, misses: 0, unrated: 0, successRate: 1.0 }
    
    render(<StudyMetrics coverage={coverage} daysSinceTouch={5} gifts={gifts} />)
    
    expect(screen.getByText('Updated 5 days ago')).toBeInTheDocument()
  })

  it('never updated and no rated gifts', async () => {
    const coverage = { filled: 0, total: 1, gaps: [] }
    const gifts = { logged: 1, hits: 0, misses: 0, unrated: 1, successRate: null }
    
    render(<StudyMetrics coverage={coverage} daysSinceTouch={null} gifts={gifts} />)
    
    expect(screen.getByText('Never updated')).toBeInTheDocument()
    expect(screen.getByText('No gifts rated yet')).toBeInTheDocument()
  })
})
