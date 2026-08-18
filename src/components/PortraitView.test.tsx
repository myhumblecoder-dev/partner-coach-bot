import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PortraitView from './PortraitView'
import type { Portrait } from '@/lib/portrait/load'
import type { Coverage } from '@/lib/metrics/coverage'
import type { GiftStats } from '@/lib/metrics/gifts'
import type { MoodBucket } from '@/lib/metrics/moodBuckets'

describe('PortraitView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the name and all sections', async () => {
    const portrait: Portrait = {
      name: 'Ada',
      likes: ['tea'],
      dislikes: [],
      jokes: [],
      dreams: [],
      trips: [],
      gifts: [],
      moods: [],
      events: [],
      occasions: []
    }
    const coverage: Coverage = { filled: 1, total: 5, gaps: [] }
    const giftStats: GiftStats = { logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }
    const buckets: MoodBucket[] = []

    render(
      <PortraitView
        portrait={portrait}
        profileId="p1"
        coverage={coverage}
        daysSinceTouch={null}
        giftStats={giftStats}
        buckets={buckets}
      />
    )

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getAllByTestId('portrait-section')).toHaveLength(5)
  })

  it('wires the likes into their section', async () => {
    const portrait: Portrait = {
      name: 'Ada',
      likes: ['tea'],
      dislikes: [],
      jokes: [],
      dreams: [],
      trips: [],
      gifts: [],
      moods: [],
      events: [],
      occasions: []
    }
    const coverage: Coverage = { filled: 1, total: 5, gaps: [] }
    const giftStats: GiftStats = { logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }
    const buckets: MoodBucket[] = []

    render(
      <PortraitView
        portrait={portrait}
        profileId="p1"
        coverage={coverage}
        daysSinceTouch={null}
        giftStats={giftStats}
        buckets={buckets}
      />
    )

    expect(screen.getByText('tea')).toBeInTheDocument()
  })

  it('renders both forms', async () => {
    const portrait: Portrait = {
      name: 'Ada',
      likes: [],
      dislikes: [],
      jokes: [],
      dreams: [],
      trips: [],
      gifts: [],
      moods: [],
      events: [],
      occasions: []
    }
    const coverage: Coverage = { filled: 1, total: 5, gaps: [] }
    const giftStats: GiftStats = { logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }
    const buckets: MoodBucket[] = []

    render(
      <PortraitView
        portrait={portrait}
        profileId="p1"
        coverage={coverage}
        daysSinceTouch={null}
        giftStats={giftStats}
        buckets={buckets}
      />
    )

    expect(screen.getByRole('button', { name: 'Add mood' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
  })
})
