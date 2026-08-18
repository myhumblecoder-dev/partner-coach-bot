import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MoodTimeline from './MoodTimeline'

describe('MoodTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one row per day', async () => {
    const buckets = [
      { day: '2026-08-17', labels: ['happy'] },
      { day: '2026-08-18', labels: ['sad'] },
    ]
    render(<MoodTimeline buckets={buckets} />)
    expect(screen.getAllByTestId('mood-day')).toHaveLength(2)
  })

  it('shows the day and its labels', async () => {
    const buckets = [
      { day: '2026-08-17', labels: ['happy', 'tired'] },
    ]
    render(<MoodTimeline buckets={buckets} />)
    expect(screen.getByText('2026-08-17')).toBeInTheDocument()
    expect(screen.getByText('happy')).toBeInTheDocument()
    expect(screen.getByText('tired')).toBeInTheDocument()
  })

  it('empty timeline shows the placeholder', async () => {
    render(<MoodTimeline buckets={[]} />)
    expect(screen.getByText('No moods recorded yet.')).toBeInTheDocument()
  })
})
