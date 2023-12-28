'use client'

import store from '@/state/store'
import { StoreProvider } from 'easy-peasy'
import { HTMLAttributes } from 'react'

type Props = HTMLAttributes<HTMLElementDeprecatedTagNameMap>

const Client = (props: Props) => {
  return (
    <StoreProvider store={store}>
      {props.children}
    </StoreProvider>
  )
}

export default Client