import React from 'react'
import {i18n} from '@lingui/core'

import * as persisted from '#/state/persisted'

type StateContext = persisted.Schema['useSkeetTerminology']
type SetContext = (v: persisted.Schema['useSkeetTerminology']) => void

const stateContext = React.createContext<StateContext>(
  persisted.defaults.useSkeetTerminology,
)
stateContext.displayName = 'SkeetTerminologyStateContext'
const setContext = React.createContext<SetContext>(
  (_: persisted.Schema['useSkeetTerminology']) => {},
)
setContext.displayName = 'SkeetTerminologySetContext'

export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(persisted.get('useSkeetTerminology'))

  const setStateWrapped = React.useCallback(
    (useSkeetTerminology: persisted.Schema['useSkeetTerminology']) => {
      setState(useSkeetTerminology)
      persisted.write('useSkeetTerminology', useSkeetTerminology)
      // Force all Lingui consumers to re-render with new terminology
      i18n.emit('change')
    },
    [setState],
  )

  React.useEffect(() => {
    return persisted.onUpdate(
      'useSkeetTerminology',
      nextUseSkeetTerminology => {
        setState(nextUseSkeetTerminology)
      },
    )
  }, [setStateWrapped])

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setStateWrapped}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

export function useSkeetTerminology() {
  return React.useContext(stateContext)
}

export function useSetSkeetTerminology() {
  return React.useContext(setContext)
}
