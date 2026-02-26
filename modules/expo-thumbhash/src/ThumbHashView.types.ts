import {type ViewProps} from 'react-native'

export interface ThumbHashViewProps extends ViewProps {
  /** Base64-encoded ThumbHash (~28 bytes) */
  thumbHash: string
  /** Duration in ms for cross-fade when the real image loads. Default: 200 */
  crossFadeDuration?: number
}
