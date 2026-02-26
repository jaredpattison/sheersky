import React from 'react'
import {StyleSheet, View} from 'react-native'

import {decodeToDataURIAsync} from './index.web'
import {type ThumbHashViewProps} from './ThumbHashView.types'

interface State {
  dataURI: string | null
}

/**
 * Web implementation of ThumbHashView.
 * Decodes the hash to a data URI and renders it as a background image.
 */
export class ThumbHashView extends React.PureComponent<
  ThumbHashViewProps,
  State
> {
  state: State = {dataURI: null}

  componentDidMount() {
    this.decode()
  }

  componentDidUpdate(prevProps: ThumbHashViewProps) {
    if (prevProps.thumbHash !== this.props.thumbHash) {
      this.decode()
    }
  }

  private async decode() {
    const uri = await decodeToDataURIAsync(this.props.thumbHash)
    this.setState({dataURI: uri})
  }

  render() {
    const {thumbHash: _, crossFadeDuration, style, ...rest} = this.props
    const {dataURI} = this.state
    const duration = crossFadeDuration ?? 200

    return (
      <View
        {...rest}
        style={[
          styles.container,
          style,
          dataURI
            ? {
                backgroundImage: `url(${dataURI})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: `opacity ${duration}ms ease-in-out`,
                opacity: 1,
              }
            : {opacity: 0},
        ]}
      />
    )
  }
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
})
