import React from 'react'

import * as persisted from '#/state/persisted'

type StateContext = boolean
type SetContext = (v: boolean) => void

const stateContext = React.createContext<StateContext>(
  Boolean(persisted.defaults.hideProfileReposts),
)
stateContext.displayName = 'HideProfileRepostsStateContext'
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'HideProfileRepostsSetContext'

export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState(
    Boolean(persisted.get('hideProfileReposts')),
  )

  const setStateWrapped = React.useCallback(
    (hideProfileReposts: persisted.Schema['hideProfileReposts']) => {
      setState(Boolean(hideProfileReposts))
      persisted.write('hideProfileReposts', hideProfileReposts)
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate('hideProfileReposts', nextHideProfileReposts => {
      setState(Boolean(nextHideProfileReposts))
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export const useHideProfileReposts = () => React.useContext(stateContext)
export const useSetHideProfileReposts = () => React.useContext(setContext)
