import React from 'react'

import * as persisted from '#/state/persisted'

type SetStateCb = (
  s: persisted.Schema['hiddenRepostDids'],
) => persisted.Schema['hiddenRepostDids']
type StateContext = persisted.Schema['hiddenRepostDids']
type ApiContext = {
  hideReposts: (did: string) => void
  showReposts: (did: string) => void
}

const stateContext = React.createContext<StateContext>(
  persisted.defaults.hiddenRepostDids,
)
stateContext.displayName = 'HiddenRepostDidsStateContext'
const apiContext = React.createContext<ApiContext>({
  hideReposts: () => {},
  showReposts: () => {},
})
apiContext.displayName = 'HiddenRepostDidsApiContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('hiddenRepostDids'))

  const setStateWrapped = React.useCallback(
    (fn: SetStateCb) => {
      const s = fn(persisted.get('hiddenRepostDids'))
      setState(s)
      persisted.write('hiddenRepostDids', s)
    },
    [setState],
  )

  const api = React.useMemo(
    () => ({
      hideReposts: (did: string) => {
        setStateWrapped(s => [...(s || []), did])
      },
      showReposts: (did: string) => {
        setStateWrapped(s => (s || []).filter(d => d !== did))
      },
    }),
    [setStateWrapped],
  )

  React.useEffect(() => {
    return persisted.onUpdate('hiddenRepostDids', nextHiddenRepostDids => {
      setState(nextHiddenRepostDids)
    })
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <apiContext.Provider value={api}>{children}</apiContext.Provider>
    </stateContext.Provider>
  )
}

export function useHiddenRepostDids() {
  return React.useContext(stateContext)
}

export function useHiddenRepostDidsApi() {
  return React.useContext(apiContext)
}
