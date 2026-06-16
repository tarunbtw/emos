import React from 'react'
import { parse, type ImgNode } from './parser'
import type { EmojiTextProps } from './types'
import { useEmos } from './EmojiProvider'

const baseStyle: React.CSSProperties = {
  display: 'inline-block',
  objectFit: 'contain',
  verticalAlign: '-0.25em',
  margin: '0 0.05em',
}

function EmojiImage({ node }: { node: ImgNode }) {
  const [broken, setBroken] = React.useState(false)

  if (broken) return <>{`:${node.slug}:`}</>

  return (
    <img
      src={node.src}
      alt={node.alt}
      className={`emos-emoji${node.className ? ` ${node.className}` : ''}`}
      style={{ ...baseStyle, height: node.size, width: node.size }}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setBroken(true)}
    />
  )
}

export function EmojiText({
  children,
  emojis,
  size = '1.2em',
  className,
  alt,
  wrapperClassName,
}: EmojiTextProps) {
  const contextEmojis = useEmos()
  const map = emojis ?? contextEmojis
  const nodes = parse(children, map, { size, className, alt })

  return (
    <span className={wrapperClassName}>
      {nodes.map((node, i) =>
        typeof node === 'string' ? node : <EmojiImage key={i} node={node} />
      )}
    </span>
  )
}
