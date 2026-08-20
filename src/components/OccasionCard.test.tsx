import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addOccasion } from '@/app/actions/addOccasion'
import OccasionCard from './OccasionCard'

vi.mock('@/app/actions/addOccasion', () => ({ addOccasion: vi.fn() }))

describe('OccasionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(addOccasion).mockResolvedValue({ ok: true })
  })

  it('lists occasions with month and day', () => {
    render(
      <OccasionCard
        profileId="p1"
        occasions={[
          { label: 'her birthday', month: 9, day: 4 },
          { label: 'our anniversary', month: 6, day: 12 },
        ]}
      />
    )

    expect(screen.getAllByTestId('occasion-row')).toHaveLength(2)
    expect(screen.getByText('her birthday')).toBeInTheDocument()
    expect(screen.getByText('September 4')).toBeInTheDocument()
    expect(screen.getByText('June 12')).toBeInTheDocument()
  })

  it('empty state invites adding', () => {
    render(<OccasionCard profileId="p1" occasions={[]} />)

    expect(screen.getByText(/No occasions yet/)).toBeInTheDocument()
  })

  it('submits a new occasion', async () => {
    render(<OccasionCard profileId="p1" occasions={[]} />)

    await userEvent.selectOptions(screen.getByLabelText('Kind'), 'anniversary')
    await userEvent.type(screen.getByLabelText('Label'), 'our anniversary')
    await userEvent.selectOptions(screen.getByLabelText('Month'), 'June')
    await userEvent.clear(screen.getByLabelText('Day'))
    await userEvent.type(screen.getByLabelText('Day'), '12')
    await userEvent.click(screen.getByRole('button', { name: 'Add occasion' }))

    expect(addOccasion).toHaveBeenCalledWith('p1', 'anniversary', 'our anniversary', 6, 12)
  })
})
