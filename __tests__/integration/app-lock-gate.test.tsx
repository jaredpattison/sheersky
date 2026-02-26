/**
 * Integration tests for AppLockGate component.
 *
 * Tests the lock/unlock behavior, background state transitions,
 * and conditional rendering based on app lock settings.
 */

// Must mock before imports
jest.mock('../../modules/expo-app-lock', () => ({
  isAvailable: jest.fn().mockReturnValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({success: true}),
  addLockStateListener: jest.fn().mockReturnValue({remove: jest.fn()}),
  getSupportedAuthTypes: jest.fn().mockReturnValue(['biometric', 'passcode']),
}))

jest.mock('../../src/state/preferences/app-lock', () => ({
  useAppLock: jest.fn().mockReturnValue({enabled: false, autoLockSeconds: 0}),
}))

jest.mock('../../src/state/session', () => ({
  useSession: jest.fn().mockReturnValue({hasSession: true}),
}))

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    _: (descriptor: any) => {
      // msg`text` produces {id: hash, message: 'text'}
      if (descriptor && descriptor.message) return descriptor.message
      if (descriptor && descriptor.id) return descriptor.id
      if (typeof descriptor === 'string') return descriptor
      return String(descriptor)
    },
  }),
}))

jest.mock('../../src/alf', () => ({
  atoms: {
    justify_center: {},
    align_center: {},
    gap_lg: {},
    text_xl: {},
    text_sm: {},
    font_bold: {},
    text_md: {},
    leading_snug: {},
  },
  useTheme: () => ({
    atoms: {bg: {}, text: {}, text_contrast_medium: {}},
    palette: {primary_500: '#0284C7'},
  }),
  useAlf: () => ({
    fonts: {scaleMultiplier: 1, family: 'system'},
    flags: {digerati: false},
  }),
}))

// Mock Typography to avoid deep ALF dependency chain
jest.mock('../../src/components/Typography', () => {
  const {Text: RNText} = require('react-native')
  return {
    Text: (props: any) => <RNText {...props} />,
    H1: (props: any) => <RNText {...props} />,
    P: (props: any) => <RNText {...props} />,
  }
})

// Mock Button to avoid deep component dependency chain
jest.mock('../../src/components/Button', () => {
  const {Text: RNText, TouchableOpacity} = require('react-native')
  return {
    Button: ({children, onPress, label, ...rest}: any) => (
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={label}
        accessibilityHint=""
        {...rest}>
        {children}
      </TouchableOpacity>
    ),
    ButtonText: ({children, ...rest}: any) => (
      <RNText {...rest}>{children}</RNText>
    ),
    ButtonIcon: () => null,
  }
})

// Mock icons
jest.mock('../../src/components/icons/Shield', () => ({
  Shield_Stroke2_Corner0_Rounded: () => null,
}))

jest.mock('../../src/env', () => ({
  IS_NATIVE: true,
}))

const mockAppLock = require('../../modules/expo-app-lock')
const mockUseAppLock = require('../../src/state/preferences/app-lock')
  .useAppLock as jest.Mock
const mockUseSession = require('../../src/state/session')
  .useSession as jest.Mock

import React from 'react'
import {Text} from 'react-native'
import {act, fireEvent, render, waitFor} from '@testing-library/react-native'

import {AppLockGate} from '../../src/components/AppLockGate'

function TestChild() {
  return <Text testID="child">App Content</Text>
}

describe('AppLockGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppLock.mockReturnValue({enabled: false, autoLockSeconds: 0})
    mockUseSession.mockReturnValue({hasSession: true})
    mockAppLock.isAvailable.mockReturnValue(true)
    mockAppLock.authenticateAsync.mockResolvedValue({success: true})
    mockAppLock.addLockStateListener.mockReturnValue({remove: jest.fn()})
  })

  describe('when app lock is disabled', () => {
    it('renders children without lock overlay', () => {
      mockUseAppLock.mockReturnValue({enabled: false, autoLockSeconds: 0})

      const {getByTestId, queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      expect(getByTestId('child')).toBeTruthy()
      expect(queryByText('Unlock')).toBeNull()
    })

    it('does not register lock state listener', () => {
      mockUseAppLock.mockReturnValue({enabled: false, autoLockSeconds: 0})

      render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      expect(mockAppLock.addLockStateListener).not.toHaveBeenCalled()
    })
  })

  describe('when app lock is enabled', () => {
    it('starts locked on cold start', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})

      const {getByTestId, getByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      // Children still render (behind the overlay)
      expect(getByTestId('child')).toBeTruthy()
      // Lock overlay is shown
      expect(getByText('Unlock')).toBeTruthy()
    })

    it('registers lock state listener', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})

      render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      expect(mockAppLock.addLockStateListener).toHaveBeenCalledTimes(1)
      expect(mockAppLock.addLockStateListener).toHaveBeenCalledWith(
        expect.any(Function),
      )
    })

    it('unlocks on successful authentication', async () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})
      mockAppLock.authenticateAsync.mockResolvedValue({success: true})

      const {getByText, queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      expect(getByText('Unlock')).toBeTruthy()

      fireEvent.press(getByText('Unlock'))

      await waitFor(() => {
        expect(queryByText('Unlock')).toBeNull()
      })

      expect(mockAppLock.authenticateAsync).toHaveBeenCalledTimes(1)
    })

    it('stays locked on failed authentication', async () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})
      mockAppLock.authenticateAsync.mockResolvedValue({
        success: false,
        error: 'User cancelled',
      })

      const {getByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      fireEvent.press(getByText('Unlock'))

      await waitFor(() => {
        expect(mockAppLock.authenticateAsync).toHaveBeenCalled()
      })

      // Still locked
      expect(getByText('Unlock')).toBeTruthy()
    })

    it('cleans up listener on unmount', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})
      const mockRemove = jest.fn()
      mockAppLock.addLockStateListener.mockReturnValue({remove: mockRemove})

      const {unmount} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      unmount()
      expect(mockRemove).toHaveBeenCalled()
    })
  })

  describe('background lock behavior', () => {
    it('locks when background time exceeds autoLockSeconds', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 30})

      // First authenticate to unlock
      mockAppLock.authenticateAsync.mockResolvedValue({success: true})

      let lockCallback: (event: {secondsInBackground: number}) => void
      mockAppLock.addLockStateListener.mockImplementation(
        (cb: (event: {secondsInBackground: number}) => void) => {
          lockCallback = cb
          return {remove: jest.fn()}
        },
      )

      const {getByText, queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      // Starts locked, unlock first
      fireEvent.press(getByText('Unlock'))

      return waitFor(() => {
        expect(queryByText('Unlock')).toBeNull()
      }).then(() => {
        // Simulate returning from background after 31 seconds
        act(() => {
          lockCallback!({secondsInBackground: 31})
        })

        expect(getByText('Unlock')).toBeTruthy()
      })
    })

    it('does NOT lock when background time is less than autoLockSeconds', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 60})
      mockAppLock.authenticateAsync.mockResolvedValue({success: true})

      let lockCallback: (event: {secondsInBackground: number}) => void
      mockAppLock.addLockStateListener.mockImplementation(
        (cb: (event: {secondsInBackground: number}) => void) => {
          lockCallback = cb
          return {remove: jest.fn()}
        },
      )

      const {getByText, queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      fireEvent.press(getByText('Unlock'))

      return waitFor(() => {
        expect(queryByText('Unlock')).toBeNull()
      }).then(() => {
        // Only 30 seconds in background, threshold is 60
        act(() => {
          lockCallback!({secondsInBackground: 30})
        })

        expect(queryByText('Unlock')).toBeNull()
      })
    })

    it('locks immediately when autoLockSeconds is 0', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})
      mockAppLock.authenticateAsync.mockResolvedValue({success: true})

      let lockCallback: (event: {secondsInBackground: number}) => void
      mockAppLock.addLockStateListener.mockImplementation(
        (cb: (event: {secondsInBackground: number}) => void) => {
          lockCallback = cb
          return {remove: jest.fn()}
        },
      )

      const {getByText, queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      fireEvent.press(getByText('Unlock'))

      return waitFor(() => {
        expect(queryByText('Unlock')).toBeNull()
      }).then(() => {
        // Even 0 seconds in background should trigger lock
        act(() => {
          lockCallback!({secondsInBackground: 0})
        })

        expect(getByText('Unlock')).toBeTruthy()
      })
    })
  })

  describe('no session', () => {
    it('does not lock when user is logged out', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})
      mockUseSession.mockReturnValue({hasSession: false})

      const {queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      expect(queryByText('Unlock')).toBeNull()
    })
  })

  describe('device without biometric support', () => {
    it('does not lock when device does not support auth', () => {
      mockUseAppLock.mockReturnValue({enabled: true, autoLockSeconds: 0})
      mockAppLock.isAvailable.mockReturnValue(false)

      const {queryByText} = render(
        <AppLockGate>
          <TestChild />
        </AppLockGate>,
      )

      expect(queryByText('Unlock')).toBeNull()
    })
  })
})
