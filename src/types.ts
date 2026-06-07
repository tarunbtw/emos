export type EmojiMap = Record<string, string>

export interface ParseOptions {
  size?: string           // default '1.2em'
  className?: string      // extra class on img
  alt?: (slug: string) => string
}

export interface EmojiTextProps extends ParseOptions {
  emojis: EmojiMap
  children: string
  wrapperClassName?: string
}
