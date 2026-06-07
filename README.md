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
| `emojis` | `Record<string, string>` | required | Map of slug to image src |
| `size` | `string` | `"1.2em"` | Height of the emoji, scales with font size |
| `className` | `string` | — | Class added to each `<img>` |
| `wrapperClassName` | `string` | — | Class on the outer `<span>` |
| `alt` | `(slug: string) => string` | `:slug:` | Alt text for each image |

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

Parses the text content of a DOM element and replaces it with inline emoji HTML.

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

Every emoji image renders with these defaults:

```css
.emos-emoji {
  height: 1.2em;
  width: auto;
  display: inline;
  vertical-align: -0.25em;
  margin: 0 0.05em;
}
```

Override with `img.emos-emoji` in your stylesheet, or pass a `className` prop.

---

## TypeScript

```ts
import type { EmojiMap, EmojiTextProps, ParseOptions } from '@tarunbtw/emos'
```

---

## License

MIT