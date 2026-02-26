/**
 * Integration tests for the app-lock preference provider.
 *
 * Tests state management, persistence, and the API contract that
 * the settings UI and AppLockGate depend on.
 */

jest.mock('../../src/state/persisted', () => {
  const store: Record<string, unknown> = {}
  return {
    get: jest.fn((key: string) => store[key]),
    write: jest.fn((key: string, value: unknown) => {
      store[key] = value
    }),
    __store: store,
  }
})

const mockPersisted = require('../../src/state/persisted') as {
  get: jest.Mock
  write: jest.Mock
  __store: Record<string, unknown>
}

import React, {useEffect, useRef} from 'react'
import {Text} from 'react-native'
import {act, render} from '@testing-library/react-native'

import {
  Provider,
  useAppLock,
  useAppLockApi,
} from '../../src/state/preferences/app-lock'

/**
 * Test consumer that captures hook values via a ref + callback,
 * avoiding react-compiler errors about outer variable reassignment.
 */
function TestConsumer({capture}: {capture: {current: {state: any; api: any}}}) {
  const state = useAppLock()
  const api = useAppLockApi()
  const ref = useRef(capture)
  ref.current = capture
  useEffect(() => {
    ref.current.current = {state, api}
  })
  // Also assign synchronously for immediate reads after render
  capture.current = {state, api}
  return <Text>{state.enabled ? 'locked' : 'unlocked'}</Text>
}

function OrphanState({capture}: {capture: {current: any}}) {
  const state = useAppLock()
  capture.current = state
  return null
}

function OrphanApi({capture}: {capture: {current: any}}) {
  const api = useAppLockApi()
  capture.current = api
  return null
}

describe('app-lock provider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPersisted.__store.appLockEnabled = undefined
    mockPersisted.__store.appLockAutoLockSeconds = undefined
    mockPersisted.get.mockImplementation(
      (key: string) => mockPersisted.__store[key],
    )
  })

  describe('initial state', () => {
    it('defaults to disabled with 0s auto-lock', () => {
      const captured = {current: {state: null as any, api: null as any}}
      render(
        <Provider>
          <TestConsumer capture={captured} />
        </Provider>,
      )

      expect(captured.current.state).toEqual({
        enabled: false,
        autoLockSeconds: 0,
      })
    })

    it('reads enabled state from persisted storage', () => {
      mockPersisted.get.mockImplementation((key: string) => {
        if (key === 'appLockEnabled') return true
        if (key === 'appLockAutoLockSeconds') return 60
        return undefined
      })

      const captured = {current: {state: null as any, api: null as any}}
      render(
        <Provider>
          <TestConsumer capture={captured} />
        </Provider>,
      )

      expect(captured.current.state).toEqual({
        enabled: true,
        autoLockSeconds: 60,
      })
    })
  })

  describe('setEnabled', () => {
    it('updates state and persists', () => {
      const captured = {current: {state: null as any, api: null as any}}
      render(
        <Provider>
          <TestConsumer capture={captured} />
        </Provider>,
      )

      expect(captured.current.state.enabled).toBe(false)

      act(() => {
        captured.current.api.setEnabled(true)
      })

      expect(captured.current.state.enabled).toBe(true)
      expect(mockPersisted.write).toHaveBeenCalledWith('appLockEnabled', true)
    })

    it('can disable after enabling', () => {
      const captured = {current: {state: null as any, api: null as any}}
      render(
        <Provider>
          <TestConsumer capture={captured} />
        </Provider>,
      )

      act(() => captured.current.api.setEnabled(true))
      expect(captured.current.state.enabled).toBe(true)

      act(() => captured.current.api.setEnabled(false))
      expect(captured.current.state.enabled).toBe(false)
      expect(mockPersisted.write).toHaveBeenCalledWith('appLockEnabled', false)
    })
  })

  describe('setAutoLockSeconds', () => {
    it('updates auto-lock delay and persists', () => {
      const captured = {current: {state: null as any, api: null as any}}
      render(
        <Provider>
          <TestConsumer capture={captured} />
        </Provider>,
      )

      act(() => captured.current.api.setAutoLockSeconds(30))
      expect(captured.current.state.autoLockSeconds).toBe(30)
      expect(mockPersisted.write).toHaveBeenCalledWith(
        'appLockAutoLockSeconds',
        30,
      )
    })

    it('supports all auto-lock options', () => {
      const captured = {current: {state: null as any, api: null as any}}
      render(
        <Provider>
          <TestConsumer capture={captured} />
        </Provider>,
      )

      for (const seconds of [0, 30, 60, 300]) {
        act(() => captured.current.api.setAutoLockSeconds(seconds))
        expect(captured.current.state.autoLockSeconds).toBe(seconds)
      }
    })
  })

  describe('context isolation', () => {
    it('useAppLock returns defaults outside provider', () => {
      const captured = {current: null as any}
      render(<OrphanState capture={captured} />)

      expect(captured.current).toEqual({
        enabled: false,
        autoLockSeconds: 0,
      })
    })

    it('useAppLockApi returns no-op functions outside provider', () => {
      const captured = {current: null as any}
      render(<OrphanApi capture={captured} />)

      expect(() => captured.current.setEnabled(true)).not.toThrow()
      expect(() => captured.current.setAutoLockSeconds(30)).not.toThrow()
    })
  })
})
