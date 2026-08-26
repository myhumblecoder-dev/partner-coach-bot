import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import TimezoneCapture from './TimezoneCapture'
import { saveTimezone } from '@/app/actions/saveTimezone'

vi.mock('@/app/actions/saveTimezone', () => ({
  saveTimezone: vi.fn(),
}))

describe('TimezoneCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders detecting message when savedTimezone is null', async () => {
    render(<TimezoneCapture profileId="user-123" savedTimezone={null} />)
    expect(screen.getByTestId('tz-display')).toHaveTextContent('Detecting timezone\u2026')
  })

  it('renders saved timezone text when savedTimezone is a string', async () => {
    render(<TimezoneCapture profileId="user-123" savedTimezone="America/New_York" />)
    expect(screen.getByTestId('tz-display')).toHaveTextContent('Timezone: America/New_York')
  })

  it('calls saveTimezone on mount when savedTimezone is null', async () => {
    vi.mocked(saveTimezone).mockResolvedValue({ ok: true } as any)
    
    render(<TimezoneCapture profileId="user-123" savedTimezone={null} />)
    
    // We need to wait for the useEffect to trigger the async action
    // Since it's an async call in useEffect, we check if it was called
    expect(vi.mocked(saveTimezone)).toHaveBeenCalled()
  })
})
