import { describe, it, expect } from 'vitest'
import { staleIds, orderFacets, type FacetLite } from './order'

describe('order', () => {
  it('marks only long-unreinforced active facets stale', () => {
    const today = new Date(Date.UTC(2024, 0, 10, 12, 0, 0))
    
    // 61 days before today: Jan 10 -> Nov 10 (approx)
    // 60 days is 60 * 24 * 60 * 60 * 1000
    const sixtyOneDaysAgo = new Date(today.getTime() - (61 * 86400000))
    const fiftyNineDaysAgo = new Date(today.getTime() - (59 * 86400000))
    const oneHundredDaysAgo = new Date(today.getTime() - (100 * 86400000))

    const facets: FacetLite[] = [
      { id: 'stale-target', label: 'A', status: 'active', evidenceCount: 1, lastReinforced: sixtyOneDaysAgo },
      { id: 'not-stale', label: 'B', status: 'active', evidenceCount: 1, lastReinforced: fiftyNineDaysAgo },
      { id: 'already-stale-but-not-active', label: 'C', status: 'rejected', evidenceCount: 1, lastReinforced: oneHundredDaysAgo },
      { id: 'stale-but-not-active-status', label: 'D', status: 'other', evidenceCount: 1, lastReinforced: oneHundredDaysAgo },
    ]

    const result = staleIds(facets, today)
    expect(result).toEqual(['stale-target'])
  })

  it('orders by evidence with stale last and rejected gone', () => {
    const facets: FacetLite[] = [
      { id: '1', label: 'Z', status: 'active', evidenceCount: 2, lastReinforced: new Date(0) },
      { id: '2', label: 'A', status: 'active', evidenceCount: 5, lastReinforced: new Date(0) },
      { id: '3', label: 'M', status: 'stale', evidenceCount: 9, lastReinforced: new Date(0) },
      { id: '4', label: 'X', status: 'rejected', evidenceCount: 10, lastReinforced: new Date(0) },
    ]

    const result = orderFacets(facets)

    // Expected order: 
    // 1. Active (desc evidence): ID 2 (count 5), then ID 1 (count 2)
    // 2. Stale: ID 3 (count 9)
    // 3. Rejected: ID 4 is gone
    expect(result.map(f => f.id)).toEqual(['2', '1', '3'])
    expect(result.find(f => f.id === '4')).toBeUndefined()
  })
})
