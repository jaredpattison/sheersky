import {useQuery} from '@tanstack/react-query'

import {logger} from '#/logger'
import {STALE} from '#/state/queries'
import {useSession} from '#/state/session'

const RQKEY_ROOT = 'blocked-by-users'
export const RQKEY = (did: string) => [RQKEY_ROOT, did]

interface ClearSkyBlocklistItem {
  did: string
  blocked_date: string
}

interface ClearSkyBlocklistResponse {
  data: {
    blocklist: ClearSkyBlocklistItem[]
  }
}

export async function fetchBlockedByUsers(did: string): Promise<string[]> {
  // Note: the paginated URL (/<did>/<page>) triggers a 308 redirect that
  // lacks CORS headers, so browsers block it. Use the pageless URL instead,
  // which returns up to 100 items directly with proper CORS headers.
  const res = await fetch(
    `https://public.api.clearsky.services/api/v1/anon/single-blocklist/${did}`,
  )
  if (!res.ok) {
    logger.warn('Failed to fetch blocked-by users from ClearSky', {
      status: res.status,
    })
    return []
  }

  const json = (await res.json()) as ClearSkyBlocklistResponse
  const items = json.data.blocklist || []

  // Sort by most recent block date, return just DIDs
  items.sort(
    (a, b) =>
      new Date(b.blocked_date).getTime() - new Date(a.blocked_date).getTime(),
  )
  return items.map(item => item.did)
}

export function useBlockedByUsersQuery() {
  const {currentAccount} = useSession()

  return useQuery({
    queryKey: RQKEY(currentAccount?.did ?? ''),
    queryFn: () => fetchBlockedByUsers(currentAccount!.did),
    staleTime: STALE.HOURS.ONE,
    enabled: !!currentAccount,
  })
}
