import {Platform} from 'react-native'

import {useTheme} from '#/alf'
import {Text} from '#/components/Typography'

const MONO_FONT = Platform.OS === 'android' ? 'monospace' : 'Courier New'

export function InlineCode({children}: {children: string}) {
  const t = useTheme()
  return (
    <Text
      style={[
        {
          fontFamily: MONO_FONT,
          fontSize: 13,
          backgroundColor: t.palette.contrast_200,
          paddingHorizontal: 4,
        },
      ]}>
      {children}
    </Text>
  )
}
