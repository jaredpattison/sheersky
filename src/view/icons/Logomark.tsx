import Svg, {Path, type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'

const ratio = 1

export function Logomark({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(rest.width || 32)

  return (
    <Svg
      fill="none"
      viewBox="0 0 64 64"
      {...rest}
      width={size}
      height={Number(size) * ratio}>
      <Path
        fill={fill || pal.text.color}
        d="M6 56 L22 8 L30 30 L35 22 L40 30 L50 16 L58 56 Z"
      />
    </Svg>
  )
}
