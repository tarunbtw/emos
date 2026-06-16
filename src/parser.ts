import type { EmojiMap, ParseOptions } from './types'

const EMOJI_RE = /:[a-z0-9_-]+:/g

export type TextNode = string
export type ImgNode = {
  type: 'img'
  slug: string
  src: string
  alt: string
  size: string
  className: string
}
export type ParsedNode = TextNode | ImgNode

export function parse(
  text: string,
  emojis: EmojiMap,
  options: ParseOptions = {}
): ParsedNode[] {
  const {
    size = '1.2em',
    className = '',
    alt = (slug) => `:${slug}:`,
  } = options

  const nodes: ParsedNode[] = []
  let last = 0

  for (const match of text.matchAll(EMOJI_RE)) {
    const slug = match[0].slice(1, -1)   // strip colons
    const entry = emojis[slug]

    // no mapping → keep as raw text
    if (!entry) continue

    const src = typeof entry === 'string' ? entry : entry.src
    const entrySize = typeof entry === 'string' ? undefined : entry.size

    // text before this match
    if (match.index! > last) {
      nodes.push(text.slice(last, match.index))
    }

    nodes.push({
      type: 'img',
      slug,
      src,
      alt: alt(slug),
      size: entrySize ?? size,
      className,
    })
    last = match.index! + match[0].length
  }

  // trailing text
  if (last < text.length) nodes.push(text.slice(last))

  return nodes
}

export function createParser(emojis: EmojiMap, options?: ParseOptions) {
  return (text: string) => parse(text, emojis, options)
}
