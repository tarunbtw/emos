import React from 'react'
import { parse } from './parser'
import type { EmojiTextProps } from './types'

const baseStyle: React.CSSProperties = {
  display: 'inline',
  width: 'auto',
  verticalAlign: '-0.25em',
  margin: '0 0.05em',
}

export function EmojiText({
  children,
  emojis,
  size = '1.2em',
  className,
  alt,
  wrapperClassName,
}: EmojiTextProps) {
  const nodes = parse(children, emojis, { size, className, alt })

  return (
    <span className={wrapperClassName}>
      {nodes.map((node, i) => {
        if (typeof node === 'string') return node

        return (
          <img
            key={i}
            src={node.src}
            alt={node.alt}
            className={`emos-emoji${node.className ? ` ${node.className}` : ''}`}
            style={{ ...baseStyle, height: node.size }}
            draggable={false}
          />
        )
      })}
    </span>
  )
}
