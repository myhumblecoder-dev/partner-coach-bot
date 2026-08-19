import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditableSection from './EditableSection'

// Mocking the action module as required by the AC
vi.mock('@/app/actions/editEntry', () => ({
  // We don't need to implement the actual logic, just ensure the module exists
  // so that EditableChip can import the type/logic without crashing.
}))

describe('EditableSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a chip per row', async () => {
    const rows = [
      { id: '1', text: 'First entry', source: 'Web' },
      { id: '2', text: 'Second entry', source: 'App' },
    ]
    
    render(
      <EditableSection 
        title="Test Section" 
        field={'likes' as any} 
        rows={rows as any} 
      />
    )

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
    
    expect(screen.getByText('First entry')).toBeVisible()
    expect(screen.getByText('Second entry')).toBeVisible()
  })

  it('empty rows show the placeholder', async () => {
    render(
      <EditableSection 
        title="Empty Section" 
        field={'likes' as any} 
        rows={[]} 
      />
    )

    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
    expect(screen.queryByRole('list')).toBeNull()
  })
})
