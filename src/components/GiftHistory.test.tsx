import { describe, it, expect } from 'vitest'
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
})
