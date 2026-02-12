import {ModerationUI} from '@atproto/api'

import {filterBlockedByCauses} from '../../../src/lib/moderation/soft-block'

const userSource = {type: 'user' as const}

function makeCause(type: string) {
  return {type, source: userSource, priority: 4} as any
}

describe('filterBlockedByCauses', () => {
  it('returns same instance when no block causes present', () => {
    const modui = new ModerationUI()
    modui.alerts = [makeCause('muted')]
    modui.informs = [makeCause('label')]

    const result = filterBlockedByCauses(modui)
    expect(result).toBe(modui) // same reference
  })

  it('removes blocked-by from all arrays', () => {
    const modui = new ModerationUI()
    modui.filters = [makeCause('blocked-by')]
    modui.blurs = [makeCause('blocked-by')]
    modui.alerts = [makeCause('blocked-by')]
    modui.informs = [makeCause('blocked-by')]

    const result = filterBlockedByCauses(modui)
    expect(result).not.toBe(modui)
    expect(result.filters).toHaveLength(0)
    expect(result.blurs).toHaveLength(0)
    expect(result.alerts).toHaveLength(0)
    expect(result.informs).toHaveLength(0)
    expect(result.filter).toBe(false)
    expect(result.blur).toBe(false)
  })

  it('removes block-other from all arrays', () => {
    const modui = new ModerationUI()
    modui.filters = [makeCause('block-other')]
    modui.blurs = [makeCause('block-other')]

    const result = filterBlockedByCauses(modui)
    expect(result.filters).toHaveLength(0)
    expect(result.blurs).toHaveLength(0)
    expect(result.filter).toBe(false)
  })

  it('preserves non-block causes alongside block causes', () => {
    const modui = new ModerationUI()
    const mutedCause = makeCause('muted')
    const labelCause = makeCause('label')
    modui.filters = [makeCause('blocked-by'), mutedCause]
    modui.blurs = [makeCause('block-other'), labelCause]
    modui.alerts = [makeCause('blocked-by')]
    modui.informs = [makeCause('block-other')]

    const result = filterBlockedByCauses(modui)
    expect(result.filters).toEqual([mutedCause])
    expect(result.blurs).toEqual([labelCause])
    expect(result.alerts).toHaveLength(0)
    expect(result.informs).toHaveLength(0)
  })

  it('preserves blocking cause (viewer blocked the target)', () => {
    const modui = new ModerationUI()
    const blockingCause = makeCause('blocking')
    modui.filters = [blockingCause, makeCause('blocked-by')]

    const result = filterBlockedByCauses(modui)
    expect(result.filters).toEqual([blockingCause])
  })

  it('recomputes noOverride based on remaining blurs', () => {
    const modui = new ModerationUI()
    modui.blurs = [makeCause('blocked-by')]
    modui.noOverride = true

    const result = filterBlockedByCauses(modui)
    // No blurs remain, so noOverride should be false
    expect(result.noOverride).toBe(false)
  })

  it('keeps noOverride true when non-block blurs remain', () => {
    const modui = new ModerationUI()
    modui.blurs = [makeCause('blocked-by'), makeCause('label')]
    modui.noOverride = true

    const result = filterBlockedByCauses(modui)
    expect(result.blurs).toHaveLength(1)
    expect(result.noOverride).toBe(true)
  })

  it('handles empty ModerationUI', () => {
    const modui = new ModerationUI()
    const result = filterBlockedByCauses(modui)
    expect(result).toBe(modui)
  })
})
