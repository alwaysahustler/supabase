import { describe, expect, it } from 'vitest'

import { caps, getMaxReplicas, max } from './replicas-query'

describe('getMaxReplicas', () => {
  it('returns 0 for ineligible compute sizes (pico, nano, micro)', () => {
    expect(getMaxReplicas('ci_pico')).toBe(0)
    expect(getMaxReplicas('ci_nano')).toBe(0)
    expect(getMaxReplicas('ci_micro')).toBe(0)
  })

  it('returns 4 for ci_small', () => {
    expect(getMaxReplicas('ci_small')).toBe(4)
  })

  it('returns 4 for ci_medium', () => {
    expect(getMaxReplicas('ci_medium')).toBe(4)
  })

  it('returns 4 for ci_large', () => {
    expect(getMaxReplicas('ci_large')).toBe(4)
  })

  it('returns max for ci_xlarge and above', () => {
    expect(getMaxReplicas('ci_xlarge')).toBe(max)
    expect(getMaxReplicas('ci_2xlarge')).toBe(max)
  })

  it('returns max for any unknown compute tier', () => {
    expect(getMaxReplicas('unknown_tier')).toBe(max)
  })

  it('returns max when no compute addon is provided', () => {
    expect(getMaxReplicas(undefined)).toBe(max)
  })

  it('all eligible caps are greater than 0 and at most max', () => {
    for (const [key, cap] of Object.entries(caps)) {
      if (cap > 0) {
        expect(cap).toBeLessThanOrEqual(max)
      }
    }
  })
})
