import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PortraitView from './PortraitView'
import type { Portrait } from '@/lib/portrait/load'
import type { Coverage } from '@/lib/metrics/coverage'
import type { GiftStats } from '@/lib/metrics/gifts'
import type { MoodBucket } from '@/lib/metrics/moodBuckets'

vi.mock('@/app/actions/editEntry', () => ({ editEntry: vi.fn() }))
vi.mock('@/app/actions/rateGift', () => ({ rateGift: vi.fn() }))
vi.mock('@/app/actions/saveTimezone', () => ({ saveTimezone: vi.fn() }))

const portraitFixture: Portrait = {
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

describe('PortraitView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the name and all sections', async () => {
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

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getAllByTestId('portrait-section')).toHaveLength(5)
  })

  it('wires the likes into their section', async () => {
    const portrait: Portrait = {
      name: 'Ada',
      likes: ['tea'],
      entries: {
        likes: [{ id: 'l1', text: 'tea', source: 'manual' }],
        dislikes: [],
        jokes: [],
        dreams: [],
        trips: [],
        gifts: [],
      },
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

  it('an entries-less portrait still renders', async () => {
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

    expect(screen.getAllByTestId('portrait-section')).toHaveLength(5)
    expect(screen.getAllByText('Nothing here yet.')).toHaveLength(5)
  })

  it('the header carries her dates when known', () => {
    render(
      <PortraitView
        portrait={{
          ...portraitFixture,
          occasions: [
            { kind: 'birthday', label: 'her birthday', month: 9, day: 4 },
            { kind: 'anniversary', label: 'our anniversary', month: 6, day: 12 },
          ],
        }}
        profileId="p1"
        coverage={{ filled: 0, total: 8, gaps: [] }}
        daysSinceTouch={null}
        giftStats={{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }}
        buckets={[]}
      />
    )

    const dates = screen.getByTestId('header-dates')
    expect(dates).toHaveTextContent('Birthday September 4')
    expect(dates).toHaveTextContent('Anniversary June 12')
  })

  it('the abstract renders when present', () => {
    render(
      <PortraitView
        portrait={{ ...portraitFixture, summary: 'She is a maker of order.' }}
        profileId="p1"
        coverage={{ filled: 0, total: 8, gaps: [] }}
        daysSinceTouch={null}
        giftStats={{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }}
        buckets={[]}
      />
    )

    expect(screen.getByTestId('portrait-summary')).toHaveTextContent(
      'She is a maker of order.')
  })

  it('facets route to their section', () => {
    render(
      <PortraitView
        portrait={{
          ...portraitFixture,
          facets: [
            { id: 'f1', section: 'likes', label: 'order at home', status: 'active', evidenceCount: 4 },
          ],
        }}
        profileId="p1"
        coverage={{ filled: 0, total: 8, gaps: [] }}
        daysSinceTouch={null}
        giftStats={{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }}
        buckets={[]}
      />
    )

    expect(screen.getByText('order at home')).toBeInTheDocument()
    expect(screen.getAllByTestId('facet-row')).toHaveLength(1)
  })

  it('renders tz-display when timezone prop is null', () => {
    render(
      <PortraitView
        portrait={portraitFixture}
        profileId="p1"
        coverage={{ filled: 0, total: 8, gaps: [] }}
        daysSinceTouch={null}
        giftStats={{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }}
        buckets={[]}
        timezone={null}
      />
    )
    expect(screen.getByTestId('tz-display')).toBeInTheDocument()
  })

  it('renders tz-display with value when timezone prop is a string', () => {
    render(
      <PortraitView
        portrait={portraitFixture}
        profileId="p1"
        coverage={{ filled: 0, total: 8, gaps: [] }}
        daysSinceTouch={null}
        giftStats={{ logged: 0, hits: 0, misses: 0, unrated: 0, successRate: null }}
        buckets={[]}
        timezone="America/New_York"
      />
    )
    expect(screen.getByTestId('tz-display')).toHaveTextContent('America/New_York')
  })
})
