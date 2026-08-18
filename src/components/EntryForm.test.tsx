import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EntryForm from './EntryForm'
import { addEntry } from '@/app/actions/addEntry'

vi.mock('@/app/actions/addEntry', () => ({ addEntry: vi.fn() }))

describe('EntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits to the selected field', async () => {
    const user = userEvent.setup()
    vi.mocked(addEntry).mockResolvedValue({ ok: true })
    
    render(<EntryForm profileId="p1" />)
    
    const select = screen.getByLabelText('Add to')
    const input = screen.getByLabelText('Entry')
    const button = screen.getByRole('button', { name: 'Add entry' })

    await user.selectOptions(select, 'dreams')
    await user.type(input, 'a cabin')
    await user.click(button)

    expect(addEntry).toHaveBeenCalledWith('p1', 'dreams', 'a cabin')
  })

  it('defaults to likes', async () => {
    const user = userEvent.setup()
    vi.mocked(addEntry).mockResolvedValue({ ok: true })
    
    render(<EntryForm profileId="p1" />)
    
    const input = screen.getByLabelText('Entry')
    const button = screen.getByRole('button', { name: 'Add entry' })

    await user.type(input, 'tea')
    await user.click(button)

    expect(addEntry).toHaveBeenCalledWith('p1', 'likes', 'tea')
  })

  it('clears the entry after success', async () => {
    const user = userEvent.setup()
    vi.mocked(addEntry).mockResolvedValue({ ok: true })
    
    render(<EntryForm profileId="p1" />)
    
    const input = screen.getByLabelText('Entry')
    const button = screen.getByRole('button', { name: 'Add entry' })

    await user.type(input, 'some text')
    await user.click(button)

    await expect(input).toHaveValue('')
  })
})
