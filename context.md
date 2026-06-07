# emos — Project Context

## Folder Structure

```
emos/
├── src/
│   ├── index.ts          # main export (re-exports everything)
│   ├── types.ts          # shared TypeScript types
│   ├── parser.ts         # core parse logic, zero dependencies
│   ├── EmojiText.tsx     # React component
│   └── vanilla.ts        # renderEmoji / renderInto for UMD/CDN
├── tests/
│   └── parser.test.ts    # vitest unit tests for the parser
├── dist/                 # built by tsup (git-ignored)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .gitignore
├── build-plan.md
├── context.md
└── README.md
```

---

## File Contents

### `package.json`

```json
{
  "name": "@tarunbtw/emos",
  "version": "0.1.0",
  "description": "Drop-in inline image emojis. Any image, any framework.",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "prepublishOnly": "npm test && npm run build",
    "release": "npm version patch && npm publish --access public"
  },
  "keywords": ["emoji", "react", "inline", "image", "discord"],
  "license": "MIT",
  "peerDependencies": {
    "react": ">=17"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitest/coverage-v8": "^4.1.8",
    "jsdom": "^29.1.1",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "tsup": "^8.5.1",
    "typescript": "^6.0.3",
    "vitest": "^4.1.8"
  },
  "vitest": {
    "environment": "jsdom"
  }
}
```

---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "ignoreDeprecations": "6.0",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

### `tsup.config.ts`

```ts
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    external: ['react', 'react-dom'],
    clean: true,
  },
  {
    entry: { 'emos.umd': 'src/vanilla.ts' },
    format: ['iife'],
    globalName: 'emos',
    outDir: 'dist',
    minify: true,
    sourcemap: false,
  },
])
```

---

### `src/types.ts`

```ts
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
```

---

### `src/parser.ts`

```ts
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
    const src = emojis[slug]

    // no mapping → keep as raw text
    if (!src) continue

    // text before this match
    if (match.index! > last) {
      nodes.push(text.slice(last, match.index))
    }

    nodes.push({ type: 'img', slug, src, alt: alt(slug), size, className })
    last = match.index! + match[0].length
  }

  // trailing text
  if (last < text.length) nodes.push(text.slice(last))

  return nodes
}

export function createParser(emojis: EmojiMap, options?: ParseOptions) {
  return (text: string) => parse(text, emojis, options)
}
```

---

### `src/EmojiText.tsx`

```tsx
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
```

---

### `src/vanilla.ts`

```ts
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
```

---

### `src/index.ts`

```ts
export { EmojiText } from './EmojiText'
export { createParser } from './parser'
export { renderEmoji, renderInto } from './vanilla'
export type { EmojiMap, ParseOptions, EmojiTextProps } from './types'
```

---

### `tests/parser.test.ts`

```ts
import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser'

const emojis = { doge: '/doge.png', fire: '/fire.gif' }

describe('parse', () => {
  it('returns plain string when no tokens', () => {
    expect(parse('hello world', emojis)).toEqual(['hello world'])
  })

  it('replaces known token', () => {
    const result = parse('hello :doge:', emojis)
    expect(result).toHaveLength(2)
    expect(result[0]).toBe('hello ')
    expect((result[1] as any).slug).toBe('doge')
    expect((result[1] as any).src).toBe('/doge.png')
  })

  it('keeps unknown token as text', () => {
    expect(parse('hello :cat:', emojis)).toEqual(['hello :cat:'])
  })

  it('handles multiple emojis', () => {
    const result = parse(':doge: and :fire:', emojis)
    expect(result).toHaveLength(3)
  })

  it('handles emoji at start', () => {
    const result = parse(':fire: boom', emojis)
    expect((result[0] as any).slug).toBe('fire')
    expect(result[1]).toBe(' boom')
  })
})
```

---

## Build Output (`dist/` — generated, not committed)

| File | Format | Description |
|---|---|---|
| `dist/index.mjs` | ESM | React / modern bundler import |
| `dist/index.js` | CJS | CommonJS require |
| `dist/index.d.ts` | DTS | TypeScript declarations |
| `dist/index.d.mts` | DTS | ESM TypeScript declarations |
| `dist/emos.umd.global.js` | IIFE | Minified CDN / vanilla bundle |

## CDN URL (after publish)

```
https://cdn.jsdelivr.net/npm/@tarunbtw/emos@latest/dist/emos.umd.global.js
```
