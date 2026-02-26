import {useEffect, useRef} from 'react'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {useDialogStateContext} from '#/state/dialogs'
import {emitSoftReset} from '#/state/events'
import {useLightbox} from '#/state/lightbox'
import {useModals} from '#/state/modals'
import {useSession} from '#/state/session'
import {useComposerState} from '#/state/shell/composer'
import {useIsDrawerOpen} from '#/state/shell/drawer-open'
import {navigate} from '#/Navigation'

const TWO_KEY_TIMEOUT_MS = 800

/**
 * Returns true if the keyboard event target is an editable element
 * (text input, textarea, contenteditable, select).
 */
function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  if (!target) return false
  const {tagName} = target
  if (!tagName) return false
  const isInput =
    tagName === 'INPUT' &&
    ![
      'checkbox',
      'radio',
      'range',
      'button',
      'file',
      'reset',
      'submit',
      'color',
    ].includes((target as HTMLInputElement).type)
  if (
    target.isContentEditable ||
    ((isInput || tagName === 'TEXTAREA' || tagName === 'SELECT') &&
      !target.readOnly)
  ) {
    return true
  }
  return false
}

export function useKeyboardShortcuts({
  onOpenHelp,
}: {
  onOpenHelp: () => void
}): void {
  const {openComposer} = useOpenComposer()
  const {openDialogs} = useDialogStateContext()
  const {isModalActive} = useModals()
  const {activeLightbox} = useLightbox()
  const isDrawerOpen = useIsDrawerOpen()
  const {hasSession, currentAccount} = useSession()
  const composerState = useComposerState()
  const pendingKeyRef = useRef<string | null>(null)
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handler(event: KeyboardEvent) {
      // Never fire when typing in inputs
      if (isTyping(event)) return

      // Never fire when overlays are open
      if (
        openDialogs?.current.size > 0 ||
        isModalActive ||
        activeLightbox ||
        isDrawerOpen ||
        composerState !== undefined
      ) {
        return
      }

      const key = event.key

      // Handle second key of a two-key sequence (g + ...)
      if (pendingKeyRef.current === 'g') {
        pendingKeyRef.current = null
        if (pendingTimerRef.current) {
          clearTimeout(pendingTimerRef.current)
          pendingTimerRef.current = null
        }

        switch (key) {
          case 'h':
            event.preventDefault()
            void navigate('HomeTab')
            return
          case 'n':
            event.preventDefault()
            void navigate('NotificationsTab')
            return
          case 's':
            event.preventDefault()
            void navigate('SearchTab')
            return
          case 'p':
            if (currentAccount) {
              event.preventDefault()
              void navigate('Profile', {name: currentAccount.handle})
            }
            return
          case 'm':
            event.preventDefault()
            void navigate('MessagesTab')
            return
          default:
            // Unknown second key — fall through to single-key handling
            break
        }
      }

      // Start a two-key sequence
      if (key === 'g') {
        pendingKeyRef.current = 'g'
        if (pendingTimerRef.current) {
          clearTimeout(pendingTimerRef.current)
        }
        pendingTimerRef.current = setTimeout(() => {
          pendingKeyRef.current = null
          pendingTimerRef.current = null
        }, TWO_KEY_TIMEOUT_MS)
        return
      }

      // Single-key shortcuts
      switch (key) {
        case 'n':
        case 'N':
          // Compose — handled by useComposerKeyboardShortcut
          return
        case '/': {
          event.preventDefault()
          void navigate('SearchTab')
          // Focus the search input after a short delay to let navigation complete
          setTimeout(() => {
            const searchInput = document.querySelector<HTMLInputElement>(
              'input[data-testid="searchTextInput"]',
            )
            searchInput?.focus()
          }, 100)
          return
        }
        case '.':
          if (hasSession) {
            event.preventDefault()
            emitSoftReset()
          }
          return
        case '?':
          event.preventDefault()
          onOpenHelp()
          return
      }
    }

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      if (pendingTimerRef.current) {
        clearTimeout(pendingTimerRef.current)
      }
    }
  }, [
    openComposer,
    openDialogs,
    isModalActive,
    activeLightbox,
    isDrawerOpen,
    hasSession,
    currentAccount,
    composerState,
    onOpenHelp,
  ])
}
