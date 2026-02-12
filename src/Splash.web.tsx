/*
 * This is a reimplementation of what exists in our HTML template files
 * already. Once the React tree mounts, this is what gets rendered first, until
 * the app is ready to go.
 */

import {View} from 'react-native'
import Svg, {Path} from 'react-native-svg'

import {atoms as a} from '#/alf'

const size = 100

export function Splash() {
  return (
    <View style={[a.fixed, a.inset_0, a.align_center, a.justify_center]}>
      <Svg
        fill="none"
        viewBox="0 0 64 64"
        style={[a.relative, {width: size, height: size, top: -50}]}>
        <Path
          fill="#0284C7"
          d="M6 56 L22 8 L30 30 L35 22 L40 30 L50 16 L58 56 Z"
        />
      </Svg>
    </View>
  )
}
