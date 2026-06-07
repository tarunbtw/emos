# emos — build plan

**Stack:** TypeScript · tsup (bundler) · React (peer dep) · vitest (tests) · npm  
**CDN:** jsDelivr — auto-serves any npm package, zero setup, zero CC  
**Total infra cost:** $0

---

## Repo structure

```
emos/
├── src/
│   ├── index.ts          # main export (React)
│   ├── parser.ts         # core parse logic, framework-agnostic
│   ├── EmojiText.tsx     # React component
│   ├── vanilla.ts        # renderInto() for UMD bundle
│   └── types.ts          # shared types
├── tests/
│   ├── parser.test.ts
│   └── EmojiText.test.tsx
├── dist/                 # built by tsup, git-ignored
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## Step 1 — Init

```bash
mkdir emos && cd emos
git init
npm init -y
npm install -D typescript tsup vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom
npm install -D @types/react @types/react-dom
```

**package.json — key fields:**

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
  "peerDependencies": {
    "react": ">=17"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }
  },
  "keywords": ["emoji", "react", "inline", "image", "discord"],
  "license": "MIT"
}
```

React is a peer dep — vanilla users don't get it bundled.

---

## Step 2 — tsup config

Two separate entry points: one for React (ESM + CJS), one for vanilla (UMD only).

```ts
// tsup.config.ts
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

After build, jsDelivr serves the UMD file automatically at:  
`https://cdn.jsdelivr.net/npm/@tarunbtw/emos/dist/emos.umd.js`

---

## Step 3 — types.ts

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

## Step 4 — parser.ts (the core, zero deps)

This is the whole engine. Everything else wraps this.

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
    if (match.index > last) {
      nodes.push(text.slice(last, match.index))
    }

    nodes.push({ type: 'img', slug, src, alt: alt(slug), size, className })
    last = match.index + match[0].length
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

## Step 5 — EmojiText.tsx

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

## Step 6 — vanilla.ts (UMD entry)

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

## Step 7 — index.ts (main export)

```ts
export { EmojiText } from './EmojiText'
export { renderEmoji, createParser } from './parser'
export type { EmojiMap, ParseOptions, EmojiTextProps } from './types'
```

---

## Step 8 — tests

```ts
// tests/parser.test.ts
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

## Step 9 — package.json scripts

```json
"scripts": {
  "build": "tsup",
  "test": "vitest run",
  "test:watch": "vitest",
  "coverage": "vitest run --coverage",
  "prepublishOnly": "npm test && npm run build",
  "release": "npm version patch && npm publish --access public"
}
```

`prepublishOnly` means tests must pass before anything ships. No broken releases.

---

## Step 10 — publish

```bash
npm login          # first time
npm run release    # bumps patch, runs tests, builds, publishes
```

jsDelivr CDN is live automatically within ~5 minutes of npm publish:

```
https://cdn.jsdelivr.net/npm/@tarunbtw/emos@latest/dist/emos.umd.js
```

Pin a version for stability:

```
https://cdn.jsdelivr.net/npm/@tarunbtw/emos@0.1.0/dist/emos.umd.js
```

---

## What each version ships

| version | what's new |
|---|---|
| 0.1.0 | parser, EmojiText, renderInto, UMD/CDN |
| 0.2.0 | Vue 3 composable `useEmos` |
| 0.3.0 | Svelte action `use:emos` |
| 0.4.0 | lazy loading + intersection observer |
| 1.0.0 | stable API, full test coverage |

---

## Zero cost breakdown

| What | How | Cost |
|---|---|---|
| npm hosting | npmjs.com — public packages always free | $0 |
| CDN | jsDelivr auto-serves from npm | $0 |
| CI (optional) | GitHub Actions — 2000 min/month free | $0 |
| Docs site (optional) | GitHub Pages or Vercel hobby | $0 |

**Total: $0. No credit card. No trials.**
