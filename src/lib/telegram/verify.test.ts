import { describe, it, expect } from 'vitest'
import { verifyTelegramSecret } from './verify'

describe('verify', () => {
  it('matching secret is accepted', () => {
    expect(verifyTelegramSecret('s3cret', 's3cret')).toBe(true)
  })

  it('different secret is rejected', () => {
    expect(verifyTelegramSecret('wrong', 's3cret')).toBe(false)
  })

  it('different length is rejected without throwing', () => {
    expect(verifyTelegramSecret('short', 'muchlongersecret')).toBe(false)
  })

  it('null header is rejected', () => {
    expect(verifyTelegramSecret(null, 's3cret')).toBe(false)
  })

  it('unconfigured secret rejects everything', () => {
    expect(verifyTelegramSecret('anything', undefined)).toBe(false)
    expect(verifyTelegramSecret('', '')).toBe(false)
  })
})
