import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FacetSection from './FacetSection'

vi.mock('@/app/actions/editEntry', () => ({
  updateEntry: vi.fn(),
  deleteEntry: vi.fn(),
}))
// EditableChip is a pure local component — rendered real.

const FACETS = [
  { id: 'f1', section: 'likes', label: 'order at home', status: 'active', evidenceCount: 5 },
  { id: 'f2', section: 'likes', label: 'japanese food', status: 'active', evidenceCount: 2 },
]
const ROWS = [
  { id: 'l1', text: 'cleanliness', source: 'extracted' },
  { id: 'l2', text: 'orderliness', source: 'extracted' },
  { id: 'l3', text: 'japanese food', source: 'manual' },
]

describe('FacetSection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders weighted facets with hidden notes', () => {
    render(<FacetSection title="Likes" field="likes" facets={FACETS} rows={ROWS} />)

    expect(screen.getAllByTestId('facet-row')).toHaveLength(2)
    expect(screen.getByText('×5')).toBeInTheDocument()
    expect(screen.queryByText('cleanliness')).toBeNull()
  })

  it('field notes open on demand', async () => {
    render(<FacetSection title="Likes" field="likes" facets={FACETS} rows={ROWS} />)

    await userEvent.click(screen.getByRole('button', { name: 'Field notes (3)' }))

    expect(screen.getByText('cleanliness')).toBeInTheDocument()
  })

  it('no facets falls back to chips', () => {
    render(<FacetSection title="Likes" field="likes" facets={[]} rows={ROWS.slice(0, 2)} />)

    expect(screen.getByText('cleanliness')).toBeInTheDocument()
    expect(screen.getByText('orderliness')).toBeInTheDocument()
    expect(screen.queryByTestId('facet-row')).toBeNull()
  })

  it('a stale facet says fading', () => {
    render(
      <FacetSection
        title="Likes"
        field="likes"
        facets={[{ id: 'f3', section: 'likes', label: 'pickle ball', status: 'stale', evidenceCount: 1 }]}
        rows={[]}
      />
    )

    expect(screen.getByText('fading')).toBeInTheDocument()
  })
})
