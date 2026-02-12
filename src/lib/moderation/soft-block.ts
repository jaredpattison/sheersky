import {type ModerationCauseSource, ModerationUI} from '@atproto/api'

type ModerationCause = {type: string; source: ModerationCauseSource}

const SOFT_BLOCK_CAUSES = new Set(['blocked-by', 'block-other'])
const isBlockCause = (c: ModerationCause) => SOFT_BLOCK_CAUSES.has(c.type)

/**
 * Creates a copy of ModerationUI with block-related causes removed.
 * Filters 'blocked-by' (someone blocked you) and 'block-other'
 * (third-party block between other users). Used for SheerSky's
 * soft-block feature where we show content regardless of blocks.
 */
export function filterBlockedByCauses(modui: ModerationUI): ModerationUI {
  const hasBlockCause = [
    ...modui.blurs,
    ...modui.alerts,
    ...modui.informs,
    ...modui.filters,
  ].some(isBlockCause)

  if (!hasBlockCause) return modui

  const filtered = new ModerationUI()
  filtered.filters = modui.filters.filter(c => !isBlockCause(c))
  filtered.blurs = modui.blurs.filter(c => !isBlockCause(c))
  filtered.alerts = modui.alerts.filter(c => !isBlockCause(c))
  filtered.informs = modui.informs.filter(c => !isBlockCause(c))
  filtered.noOverride = filtered.blurs.length > 0 && modui.noOverride
  return filtered
}
