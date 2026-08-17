import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMessage } from './send'

describe('send', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env = { ...originalEnv }
  })

  it('posts to the sendMessage endpoint', async () => {
    process.env.TELEGRAM_POST_TOKEN = 'tok'
    // Note: The implementation uses process.env.TELEGRAM_BOT_TOKEN
    // We must set the correct key
    process.env.TELEGRAM_BOT_TOKEN = 'tok'
    
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    await sendMessage('42', 'hi')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/bottok/sendMessage'),
      expect.anything()
    )
  })

  it('sends chat id and text as JSON', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'tok'
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    await sendMessage('42', 'hi')

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ chat_id: '42', text: 'hi' })
      })
    )
  })

  it('throws on non-ok response', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'tok'
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request'
    } as Response)

    await expect(sendMessage('42', 'hi')).rejects.toThrow('Telegram API error')
  })

  it('throws when the bot token is unset', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN

    await expect(sendMessage('42', 'hi')).rejects.toThrow()
    expect(fetch).not.toHaveBeenCalled()
  })
})
