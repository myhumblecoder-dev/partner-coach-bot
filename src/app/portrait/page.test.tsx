import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { prisma } from '@/lib/db'
import { getPortrait, type Portrait } from '@/lib/portrait/load'
import PortraitPage from './page'

vi.mock('@/lib/db', () => ({
  prisma: { profile: { findFirst: vi.fn() } },
}))
vi.mock('@/lib/portrait/load', () => ({ getPortrait: vi.fn() }))
// The metrics and PortraitView are pure local modules — NOT mocked; the page
// test proves the real wiring end to end.

const empty: Portrait = {
  name: 'Ada',
  likes: [],
  dislikes: [],
  jokes: [],
  dreams: [],
  moods: [],
  events: [],
  gifts: [],
  trips: [],
  occasions: [],
}

describe('PortraitPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders the empty state without a profile', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValue(null)

    render(await PortraitPage())

    expect(
      screen.getByText('No profile yet — start the questionnaire in Telegram.')
    ).toBeInTheDocument()
    expect(getPortrait).not.toHaveBeenCalled()
  })

  it('renders the portrait for the first profile', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValue({ id: 'p1' } as never)
    vi.mocked(getPortrait).mockResolvedValue(empty)

    render(await PortraitPage())

    expect(getPortrait).toHaveBeenCalledWith('p1')
    expect(screen.getByText('Ada')).toBeInTheDocument()
  })

  it('computes coverage from the portrait', async () => {
    vi.mocked(prisma.profile.findFirst).mockResolvedValue({ id: 'p1' } as never)
    vi.mocked(getPortrait).mockResolvedValue({ ...empty, likes: ['tea'] })

    render(await PortraitPage())

    expect(screen.getByText('1 of 8 areas filled')).toBeInTheDocument()
  })
})
