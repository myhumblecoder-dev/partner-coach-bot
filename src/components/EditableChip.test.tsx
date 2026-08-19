import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EditableChip from './EditableChip'

vi.mock('@/app/actions/editEntry', () => ({ updateEntry: vi.fn(), deleteEntry: vi.fn() }))

describe('EditableChip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('edits in place on enter', async () => {
    const user = userEvent.setup()
    const { updateEntry } = await import('@/app/actions/editEntry')
    vi.mocked(updateEntry).mockResolvedValue({ ok: true })

    render(<EditableChip field="likes" id="l1" text="tea" source="manual" />)

    const editButton = screen.getByRole('button', { name: 'Edit tea' })
    await user.click(editButton)

    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, 'green tea')
    await user.keyboard('{Enter}')

    expect(updateEntry).toHaveBeenCalledWith('likes', 'l1', 'green tea')
    expect(screen.getByText('tea')).toBeInTheDocument()
  })

  it('deletes on the delete button', async () => {
    const user = userEvent.setup()
    const { deleteEntry } = await import('@/app/actions/editEntry')
    vi.mocked(deleteEntry).mockResolvedValue({ ok: true })

    render(<EditableChip field="likes" id="l1" text="tea" source="manual" />)

    const deleteButton = screen.getByRole('button', { name: 'Delete tea' })
    await user.click(deleteButton)

    expect(deleteEntry).toHaveBeenCalledWith('likes', 'l1')
  })

  it('escape cancels without saving', async () => {
    const user = userEvent.setup()
    const { updateEntry } = await import('@/app/actions/editEntry')
    vi.mocked(updateEntry).mockResolvedValue({ ok: true })

    render(<EditableChip field="likes" id="l1" text="tea" source="manual" />)

    const editButton = screen.getByRole('button', { name: 'Edit tea' })
    await user.click(editButton)

    await user.keyboard('{Escape}')

    expect(updateEntry).not.toHaveBeenCalled()
    expect(screen.getByText('tea')).toBeInTheDocument()
  })

  it('extracted chips carry the ai marker', async () => {
    const { rerender } = render(<EditableChip field="likes" id="l1" text="tea" source="extracted" />)
    expect(screen.getByTestId('source-marker')).toHaveTextContent('ai')

    rerender(<EditableChip field="likes" id="l1" text="tea" source="manual" />)
    expect(screen.queryByTestId('source-marker')).toBeNull()
  })
})
