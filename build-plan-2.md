# emos v0.2 — polish & build plan

## The core problem

Right now every emoji image renders with `height: 1.2em; width: auto`. A square image looks fine. A wide GIF (say 200×80px) renders at `width: 3em` — three times wider than a normal character. It breaks the "sits like a character" illusion that makes this feel like Discord/Slack emojis.

**Fix:** lock both height *and* width to the same value, and use `object-fit: contain` so the image scales down to fit inside that box without stretching or cropping. Every emoji becomes a consistent square slot — exactly how Discord, Slack, and Twemoji do it.

```css
/* before */
.emos-emoji {
  height: 1.2em;
  width: auto;
  display: inline;
  vertical-align: -0.25em;
  margin: 0 0.05em;
}

/* after */
.emos-emoji {
  height: 1.2em;
  width: 1.2em;
  object-fit: contain;
  display: inline-block;
  vertical-align: -0.25em;
  margin: 0 0.05em;
}
```

This single change fixes the visual inconsistency for every wide GIF, landscape meme, or odd-aspect-ratio PNG. This is step 1 and the highest priority.

---

## Full list of improvements (v0.2.0)

| # | Change | Why |
|---|---|---|
| 1 | Square sizing with `object-fit: contain` | Fixes wide GIFs/images breaking inline flow |
| 2 | Per-emoji size override | Some emojis (logos, badges) legitimately need to be bigger |
| 3 | `loading="lazy"` + `decoding="async"` | Free perf win, no API change |
| 4 | Broken-image fallback | Dead URL shouldn't show a broken-image icon mid-sentence |
| 5 | SSR guard in `renderInto` | Currently crashes if called during SSR (`document` undefined) |
| 6 | `EmojiProvider` + `useEmos` (React) | Avoid passing the same `emojis` map to every `<EmojiText>` |
| 7 | CSS custom property for global size | Let users theme size via CSS instead of props everywhere |

Each is independent — ship 1–3 first as a quick patch, then 4–7 as the real 0.2.0.

---

## Step 1 — Square sizing (do this first)

### `src/parser.ts`

No changes needed to parser logic — `size` already flows through. Just confirm `size` stays a single value (it represents both height and width now).

### `src/EmojiText.tsx`

```tsx
const baseStyle: React.CSSProperties = {
  display: 'inline-block',
  objectFit: 'contain',
  verticalAlign: '-0.25em',
  margin: '0 0.05em',
}
```

```tsx
<img
  key={i}
  src={node.src}
  alt={node.alt}
  className={`emos-emoji${node.className ? ` ${node.className}` : ''}`}
  style={{ ...baseStyle, height: node.size, width: node.size }}
  loading="lazy"
  decoding="async"
  draggable={false}
/>
```

### `src/vanilla.ts`

Update the inline style string to match:

```ts
return `<img
  src="${node.src}"
  alt="${node.alt}"
  class="emos-emoji${node.className ? ` ${node.className}` : ''}"
  style="height:${h};width:${h};object-fit:contain;display:inline-block;vertical-align:-0.25em;margin:0 0.05em"
  loading="lazy"
  decoding="async"
  draggable="false"
/>`
```

### Test it

Add a wide-image test case — verify `size` is applied as both height and width (the rendering itself can't be tested in jsdom, but you can assert the node carries the right `size` value):

```ts
it('applies size to both dimensions via size field', () => {
  const result = parse(':fire:', emojis, { size: '2em' })
  expect((result[0] as any).size).toBe('2em')
})
```

Run:
```bash
npm test
```

This alone is worth shipping as **0.1.2** — it's a one-line CSS fix with outsized visual impact.

```bash
npm version patch
npm publish --access public
```

---

## Step 2 — Per-emoji size override

Sometimes one emoji in your set is a wordmark/badge and needs to render bigger than the rest. Allow the emoji map value to be either a plain string (current behavior) or an object with its own size.

### `src/types.ts`

```ts
export type EmojiSource = string | { src: string; size?: string }
export type EmojiMap = Record<string, EmojiSource>
```

### `src/parser.ts`

```ts
for (const match of text.matchAll(EMOJI_RE)) {
  const slug = match[0].slice(1, -1)
  const entry = emojis[slug]
  if (!entry) continue

  const src = typeof entry === 'string' ? entry : entry.src
  const entrySize = typeof entry === 'string' ? undefined : entry.size

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
```

This is fully backward compatible — existing `{ doge: '/doge.png' }` maps keep working unchanged.

### Usage after this change

```tsx
<EmojiText
  emojis={{
    doge: dogeImg,                       // uses default size
    sponsor: { src: logoImg, size: '2em' } // bigger, just this one
  }}
>
  Brought to you by :sponsor: feat. :doge:
</EmojiText>
```

### Tests

```ts
it('allows per-emoji size override', () => {
  const map = { doge: '/doge.png', big: { src: '/big.png', size: '2em' } }
  const result = parse(':doge: :big:', map, { size: '1.2em' })
  expect((result[0] as any).size).toBe('1.2em')
  expect((result[2] as any).size).toBe('2em')
})
```

---

## Step 3 — Broken image fallback

If an emoji URL 404s, you get a broken-image icon sitting in the middle of a sentence. Fall back to the raw `:slug:` text instead.

### `src/EmojiText.tsx`

Add error state per image using a small wrapper component:

```tsx
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
```

Then in `EmojiText`, render `<EmojiImage key={i} node={node} />` instead of the raw `<img>`.

### Vanilla (`renderInto`)

For vanilla, attach a delegated error handler after setting `innerHTML`:

```ts
export function renderInto(
  selector: string | Element,
  emojis: EmojiMap,
  options?: ParseOptions
): void {
  if (typeof document === 'undefined') return  // SSR guard, see step 4

  const el = typeof selector === 'string' ? document.querySelector(selector) : selector
  if (!el) return

  const text = el.textContent ?? ''
  el.innerHTML = renderEmoji(text, emojis, options)

  el.querySelectorAll<HTMLImageElement>('.emos-emoji').forEach((img) => {
    img.addEventListener('error', () => {
      img.replaceWith(document.createTextNode(img.alt))
    })
  })
}
```

---

## Step 4 — SSR guard

`renderInto` touches `document` directly — crashes in Next.js server components or any SSR context if accidentally imported into a server file. One-line guard (already included above):

```ts
if (typeof document === 'undefined') return
```

`renderEmoji` itself is already safe — it's pure string manipulation, no DOM. This only affects `renderInto`.

---

## Step 5 — `EmojiProvider` + `useEmos` (React convenience)

For apps using the same emoji set everywhere, passing `emojis={...}` to every `<EmojiText>` is repetitive. Add an optional context provider.

### `src/EmojiProvider.tsx` (new file)

```tsx
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
```

### `src/EmojiText.tsx`

Make `emojis` prop optional — fall back to context if not provided:

```tsx
import { useEmos } from './EmojiProvider'

export function EmojiText({ children, emojis, ...rest }: EmojiTextProps & { emojis?: EmojiMap }) {
  const contextEmojis = useEmos()
  const map = emojis ?? contextEmojis
  // ...rest unchanged, use `map` instead of `emojis`
}
```

### `src/index.ts`

```ts
export { EmojiProvider, useEmos } from './EmojiProvider'
```

### Usage after this change

```tsx
<EmojiProvider emojis={{ doge: dogeImg, fire: fireImg }}>
  <EmojiText>Hello :doge:</EmojiText>
  <EmojiText>Still works :fire:</EmojiText>
</EmojiProvider>
```

Old usage (`<EmojiText emojis={{...}}>`) keeps working unchanged — fully additive.

---

## Step 6 — Global size via CSS variable (optional, nice-to-have)

Let users override the default size sitewide without touching props:

```css
:root {
  --emos-size: 1.2em;
}

.emos-emoji {
  height: var(--emos-size, 1.2em);
  width: var(--emos-size, 1.2em);
}
```

In `EmojiText.tsx`, only set inline `height`/`width` when an explicit `size` is passed — otherwise let the CSS variable win:

```tsx
const sizeStyle = node.size !== '1.2em'
  ? { height: node.size, width: node.size }
  : {}

style={{ ...baseStyle, ...sizeStyle }}
```

This is the lowest priority — skip it if you want to keep the API surface smaller. Mention it in the README as a CSS hook either way, since `.emos-emoji` is already a stable class name.

---

## Suggested version rollout

| Version | Includes |
|---|---|
| **0.1.2** | Step 1 (square sizing) — ship immediately, biggest visual fix for least effort |
| **0.2.0** | Steps 2–4 (per-emoji size, broken-image fallback, SSR guard) — backward compatible additions |
| **0.3.0** | Step 5 (`EmojiProvider`/`useEmos`) — new but optional API surface |
| skip / later | Step 6 (CSS var) — only if someone actually asks for it |

---

## What NOT to add

Keep scope tight. Resist adding:

- **Emoji picker UI component** — that's a separate package, different audience
- **Built-in emoji sets** (Twemoji bundled, etc.) — keep emos "bring your own images," that's the whole pitch
- **Animation/hover effects** — styling is the consumer's job via `.emos-emoji` and `className`
- **Vue/Svelte adapters** — only do this if someone actually asks; React + vanilla covers 90% of use cases
- **Sprite-sheet optimization** — premature; `loading="lazy"` covers the real perf concern for now

The package's strength is doing one thing — `:slug:` → sized inline image — really well across every surface. Each addition above is in service of that, not scope creep.

---

## Testing checklist before each release

```bash
npm test            # all parser + component tests pass
npm run build       # dist/ builds clean, check file sizes didn't balloon
npm pack --dry-run  # confirm dist/ + README are in the tarball
```

Then smoke-test in a throwaway project (`npm install ../emos`) before publishing — exactly like the 0.1.0 flow.

After publish, update the landing page's `index.html`:
- bump the version badge in the hero pill
- if the playground demo uses wide/non-square images, it'll now visibly show the new square sizing — good opportunity to add one wide-aspect demo emoji to show off the fix
