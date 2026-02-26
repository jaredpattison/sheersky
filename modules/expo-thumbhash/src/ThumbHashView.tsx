import React from 'react'
import {requireNativeViewManager} from 'expo-modules-core'

import {type ThumbHashViewProps} from './ThumbHashView.types'

const NativeView: React.ComponentType<
  ThumbHashViewProps & {ref: React.RefObject<any>}
> = requireNativeViewManager('ExpoThumbHash')

export class ThumbHashView extends React.PureComponent<ThumbHashViewProps> {
  render() {
    return <NativeView {...this.props} />
  }
}
