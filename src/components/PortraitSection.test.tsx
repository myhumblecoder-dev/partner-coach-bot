import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import PortraitSection from './PortraitSection'

describe('PortraitSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the title and items', async () => {
    render(<PortraitSection title="Likes" items={['tea', 'rain']} />)
    expect(screen.getByText('Likes')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('empty items show the placeholder', async () => {
    render(<PortraitSection title="Dislikes" items={[]} />)
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
