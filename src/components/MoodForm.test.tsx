import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MoodForm from './MoodForm'

vi.mock('@/app/actions/addMood', () => ({ addMood: vi.fn() }))

describe('MoodForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits the typed mood', async () => {
    const { addMood } = await import('@/app/actions/addMood')
    vi.mocked(addMood).mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    
    render(<MoodForm profileId="p1" />)
    
    const moodInput = screen.getByLabelText('Mood')
    const submitButton = screen.getByRole('button', { name: 'Add mood' })

    await user.type(moodInput, 'happy')
    await user.click(submitButton)

    expect(addMood).toHaveBeenCalledWith('p1', 'happy', null)
  })

  it('clears the input after a successful add', async () => {
    const { addMood } = await import('@/app/actions/addMood')
    vi.mocked(addMood).mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    
    render(<MoodForm profileId="p1" />)
    
    const moodInput = screen.getByLabelText('Mood')
    const submitButton = screen.getByRole('button', { name: 'Add mood' })

    await user.type(moodInput, 'happy')
    await user.click(submitButton)

    expect(moodInput).toHaveValue('')
  })

  it('keeps the input when the action rejects it', async () => {
    const { addMood } = await import('@/app/actions/addMood')
    vi.mocked(addMood).mockResolvedValue({ ok: false })
    const user = userEvent.setup()
    
    render(<MoodForm profileId="p1" />)
    
    const moodInput = screen.getByLabelText('Mood')
    const submitButton = screen.getByRole('button', { name: 'Add mood' })

    await user.type(moodInput, 'x')
    await user.click(submitButton)

    expect(moodInput).toHaveValue('x')
  })
})
