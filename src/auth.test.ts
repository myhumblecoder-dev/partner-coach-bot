import { describe, it, expect } from 'vitest'
import * as authModule from './auth'

describe('auth', () => {
  it('exports handlers', () => {
    expect(authModule.handlers).toBeDefined()
  })

  it('exports auth', () => {
    expect(authModule.auth).toBeDefined()
  })

  it('exports signIn', () => {
    expect(authModule.signIn).toBeDefined()
  })

  it('exports signOut', () => {
    expect(authModule.signOut).toBeDefined()
  })
})
