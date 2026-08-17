import { describe, it, expect } from 'vitest'
import { prisma } from './db'

describe('db', () => {
  it('prisma is defined', () => {
    expect(prisma).toBeDefined()
    expect(typeof prisma.$connect).toBe('function')
  })

  it('importing twice returns the same instance', async () => {
    // We import the module again via a dynamic import to verify the singleton
    // Since the module is already in the cache, it should return the same object
    const { prisma: prismaSecondImport } = await import('./db')
    expect(prismaSecondImport).toBe(prisma)
  })
})
