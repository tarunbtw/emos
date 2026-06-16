import React, { createContext, useContext } from 'react'
import type { EmojiMap } from './types'

const EmojiContext = createContext<EmojiMap>({})

export function EmojiProvider({
  emojis,
  children,
}: {
  emojis: EmojiMap
  children: React.ReactNode
}) {
  return <EmojiContext.Provider value={emojis}>{children}</EmojiContext.Provider>
}

export function useEmos() {
  return useContext(EmojiContext)
}
