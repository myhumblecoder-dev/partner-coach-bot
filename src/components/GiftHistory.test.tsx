import { describe, it, expect, vi, beforeEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { rateGift } from '@/app/actions/rateGift'

vi.mock('@/app/actions/rateGift', () => ({ rateGift: vi.fn() }))
import { render, screen } from '@testing-library/react'
import GiftHistory from './GiftHistory'

describe('GiftHistory', () => {
  it('renders each gift with its outcome', () => {
    render(
      <GiftHistory
        gifts={[
          { description: 'a record player', givenAt: null, howItLanded: 'hit' },
          { description: 'socks', givenAt: null, howItLanded: null },
        ]}
      />
    )

    const outcomes = screen.getAllByTestId('gift-outcome')
    expect(outcomes).toHaveLength(2)
    expect(outcomes[0]).toHaveTextContent('landed')
    expect(outcomes[1]).toHaveTextContent('unrated')
    expect(screen.getByText('a record player')).toBeInTheDocument()
  })

  it('empty history shows the placeholder', () => {
    render(<GiftHistory gifts={[]} />)

    expect(screen.getByText('No gifts logged yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('unrated gifts offer rating', async () => {
    vi.mocked(rateGift).mockResolvedValue({ ok: true })
    render(
      <GiftHistory
        gifts={[]}
        rows={[
          { id: 'g1', description: 'socks', givenAt: null, howItLanded: null, source: 'manual' },
          { id: 'g2', description: 'a record player', givenAt: null, howItLanded: 'hit', source: 'manual' },
        ]}
      />
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mark socks landed' }))

    expect(rateGift).toHaveBeenCalledWith('g1', 'hit')
    expect(screen.queryByRole('button', { name: 'Mark a record player landed' })).toBeNull()
  })
})
