import {createContext, useContext, useState} from 'react'

import * as persisted from '#/state/persisted'

interface AppLockState {
  enabled: boolean
  /** Seconds of background time before requiring unlock. Default: 0 (immediate) */
  autoLockSeconds: number
}

interface AppLockApi {
  setEnabled: (enabled: boolean) => void
  setAutoLockSeconds: (seconds: number) => void
}

const defaultState: AppLockState = {
  enabled: false,
  autoLockSeconds: 0,
}

const StateContext = createContext<AppLockState>(defaultState)
const ApiContext = createContext<AppLockApi>({
  setEnabled: () => {},
  setAutoLockSeconds: () => {},
})

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = useState<AppLockState>(() => {
    const stored = persisted.get('appLockEnabled')
    return {
      enabled: stored ?? false,
      autoLockSeconds: persisted.get('appLockAutoLockSeconds') ?? 0,
    }
  })

  const api: AppLockApi = {
    setEnabled: (enabled: boolean) => {
      setState(s => ({...s, enabled}))
      persisted.write('appLockEnabled', enabled)
    },
    setAutoLockSeconds: (seconds: number) => {
      setState(s => ({...s, autoLockSeconds: seconds}))
      persisted.write('appLockAutoLockSeconds', seconds)
    },
  }

  return (
    <StateContext.Provider value={state}>
      <ApiContext.Provider value={api}>{children}</ApiContext.Provider>
    </StateContext.Provider>
  )
}

export function useAppLock(): AppLockState {
  return useContext(StateContext)
}

export function useAppLockApi(): AppLockApi {
  return useContext(ApiContext)
}
