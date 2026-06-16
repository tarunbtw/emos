# @tarunbtw/emos

Inline image emojis for the web. Write `:slug:` in your text, pass a map of images, get Discord-style inline rendering. Works in React, Next.js, and vanilla JS.

```bash
npm install @tarunbtw/emos
```

---

## React

```tsx
import { EmojiText } from '@tarunbtw/emos'
import doge from './emojis/doge.png'

export default function App() {
  return (
    <EmojiText emojis={{ doge }}>
      Hello :doge: this works
    </EmojiText>
  )
}
```

## Vanilla JS (CDN)

```html
<script src="https://unpkg.com/@tarunbtw/emos/dist/emos.umd.global.js"></script>

<p id="msg">Hello :doge: world</p>

<script>
  emos.renderInto('#msg', {
    doge: './emojis/doge.png'
  })
</script>
```

---

## API

### `<EmojiText>`

```tsx
<EmojiText
  emojis={{ doge: dogeImg, fire: fireImg }}
  size="1.4em"
  wrapperClassName="my-text"
  alt={(slug) => `custom emoji: ${slug}`}
>
  Hello :doge: world :fire:
</EmojiText>
```

| Prop | Type | Default | Description |
|---|---|---|---|
| `emojis` | `EmojiMap` | from context | Map of slug to image source. Optional if an `EmojiProvider` is above in the tree |
| `size` | `string` | `"1.2em"` | Size of the emoji (height **and** width), scales with font size |
| `className` | `string` | — | Class added to each `<img>` |
| `wrapperClassName` | `string` | — | Class on the outer `<span>` |
| `alt` | `(slug: string) => string` | `:slug:` | Alt text for each image |

Each emoji renders into a square slot (`size` × `size`) with `object-fit: contain`, so wide GIFs and odd-aspect images scale down to fit without stretching — they sit inline like a character.

If an image fails to load, emos falls back to rendering the raw `:slug:` text instead of a broken-image icon.

---

### `EmojiProvider` / `useEmos`

Share one emoji map across many `<EmojiText>` elements instead of passing `emojis` to each.

```tsx
import { EmojiProvider, EmojiText } from '@tarunbtw/emos'

<EmojiProvider emojis={{ doge: dogeImg, fire: fireImg }}>
  <EmojiText>Hello :doge:</EmojiText>
  <EmojiText>Still works :fire:</EmojiText>
</EmojiProvider>
```

A `<EmojiText emojis={{...}}>` prop always overrides the provider. `useEmos()` returns the current map if you need it directly.

---

### Per-emoji size override

An emoji map value can be a plain string or an object with its own `size` — handy for a wordmark or badge that should render bigger than the rest.

```tsx
<EmojiText
  emojis={{
    doge: dogeImg,                          // default size
    sponsor: { src: logoImg, size: '2em' }, // bigger, just this one
  }}
>
  Brought to you by :sponsor: feat. :doge:
</EmojiText>
```

Fully backward compatible — string values keep working unchanged.

---

### `renderEmoji(text, emojis, options?)`

Returns an array of strings and React elements. Use when you need the nodes directly.

```tsx
import { renderEmoji } from '@tarunbtw/emos'

const nodes = renderEmoji('Hello :wave:', { wave: waveImg })
// → ['Hello ', <img src="..." alt=":wave:" />]
```

---

### `createParser(emojis, options?)`

Bind an emoji map once, reuse the parser anywhere.

```tsx
import { createParser } from '@tarunbtw/emos'

const parse = createParser({ doge: dogeImg })

const nodes = parse('so :doge:')
```

---

### `renderInto(selector, emojis, options?)` — vanilla only

Parses the text content of a DOM element and replaces it with inline emoji HTML. Safe to import in SSR contexts — it no-ops when `document` is undefined. Broken images fall back to their alt text.

```js
emos.renderInto('#my-element', { wave: './wave.png' })
emos.renderInto(document.querySelector('p'), { wave: './wave.png' })
```

---

## Image sources

Any valid image URL or import works:

```tsx
// bundler import (Vite, Next.js, CRA)
import doge from './doge.png'

// remote URL
{ doge: 'https://example.com/doge.png' }

// data URI
{ doge: 'data:image/png;base64,...' }

// Next.js static import
import doge from 'public/emojis/doge.png'
{ doge: doge.src }
```

---

## Slug syntax

Slugs match `/:[a-z0-9_-]+:/g`. Unknown slugs are left as-is in the text.

```
:doge:        valid
:my-emoji:    valid
:fire_v2:     valid
:My Emoji:    invalid — not replaced
```

---

## Styling

Every emoji image renders with these inline defaults:

```css
.emos-emoji {
  height: 1.2em;            /* = size */
  width: 1.2em;            /* = size */
  object-fit: contain;
  display: inline-block;
  vertical-align: -0.25em;
  margin: 0 0.05em;
}
```

`.emos-emoji` is a stable class name — target it in your stylesheet (e.g. `img.emos-emoji { ... }`) or pass a `className` prop to style emojis globally. Note that emos sets `height`/`width` inline, so to override the size from CSS you'll need `!important` or the `size` prop.

Images are loaded with `loading="lazy"` and `decoding="async"` for free perf.

---

## TypeScript

```ts
import type { EmojiMap, EmojiSource, EmojiTextProps, ParseOptions } from '@tarunbtw/emos'
```

---

## License

MIT