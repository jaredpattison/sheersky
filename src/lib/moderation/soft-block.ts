import {ModerationUI} from '@atproto/api'

/**
 * Creates a copy of ModerationUI with 'blocked-by' causes removed.
 * Used for SheerSky's soft-block feature where we show content from
 * users who have blocked us, instead of hiding it.
 */
export function filterBlockedByCauses(modui: ModerationUI): ModerationUI {
  const hasBlockedBy = [
    ...modui.blurs,
    ...modui.alerts,
    ...modui.informs,
    ...modui.filters,
  ].some(c => c.type === 'blocked-by')

  if (!hasBlockedBy) return modui

  const filtered = new ModerationUI()
  filtered.filters = modui.filters.filter(c => c.type !== 'blocked-by')
  filtered.blurs = modui.blurs.filter(c => c.type !== 'blocked-by')
  filtered.alerts = modui.alerts.filter(c => c.type !== 'blocked-by')
  filtered.informs = modui.informs.filter(c => c.type !== 'blocked-by')
  filtered.noOverride = filtered.blurs.length > 0 && modui.noOverride
  return filtered
}
