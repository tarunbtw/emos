import { parse } from './parser'
import type { EmojiMap, ParseOptions } from './types'

export function renderEmoji(text: string, emojis: EmojiMap, options?: ParseOptions): string {
  return parse(text, emojis, options)
    .map((node) => {
      if (typeof node === 'string') return node
      const h = node.size ?? '1.2em'
      return `<img
        src="${node.src}"
        alt="${node.alt}"
        class="emos-emoji${node.className ? ` ${node.className}` : ''}"
        style="height:${h};width:auto;display:inline;vertical-align:-0.25em;margin:0 0.05em"
        draggable="false"
      />`
    })
    .join('')
}

export function renderInto(
  selector: string | Element,
  emojis: EmojiMap,
  options?: ParseOptions
): void {
  const el =
    typeof selector === 'string'
      ? document.querySelector(selector)
      : selector

  if (!el) return

  const text = el.textContent ?? ''
  el.innerHTML = renderEmoji(text, emojis, options)
}
