# emos

> Drop-in inline image emojis. Any image, any framework.

[![npm](https://img.shields.io/npm/v/@tarunbtw/emos)](https://www.npmjs.com/package/@tarunbtw/emos)
[![license](https://img.shields.io/npm/l/@tarunbtw/emos)](./LICENSE)

## Quick Start

### React

```tsx
import { EmojiText } from '@tarunbtw/emos'

const emojis = {
  doge: 'https://example.com/doge.png',
  fire: 'https://example.com/fire.gif',
}

function App() {
  return <EmojiText emojis={emojis}>Hello :doge: this is :fire:</EmojiText>
}
```

### Vanilla JS (CDN)

```html
<script src="https://cdn.jsdelivr.net/npm/@tarunbtw/emos@latest/dist/emos.umd.js"></script>
<script>
  const emojis = { doge: '/doge.png', fire: '/fire.gif' }
  emos.renderInto('#my-el', emojis)
</script>
```

## API

### `<EmojiText>` (React)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `string` | required | Text containing `:slug:` tokens |
| `emojis` | `EmojiMap` | required | `{ slug: imageUrl }` mapping |
| `size` | `string` | `'1.2em'` | CSS height of emoji images |
| `className` | `string` | `''` | Extra class on each `<img>` |
| `alt` | `(slug) => string` | `:slug:` | Alt text factory |
| `wrapperClassName` | `string` | — | Class on the wrapper `<span>` |

### `parse(text, emojis, options?)` — core, zero deps

Returns `ParsedNode[]` — strings or `ImgNode` objects.

### `renderEmoji(text, emojis, options?)` — vanilla

Returns an HTML string with `<img>` tags in place of emoji tokens.

### `renderInto(selector, emojis, options?)` — vanilla

Replaces `textContent` of a DOM element with rendered emoji HTML.

### `createParser(emojis, options?)` — utility

Returns a `(text) => ParsedNode[]` function bound to a fixed emoji map.

## CDN URLs

```
https://cdn.jsdelivr.net/npm/@tarunbtw/emos@latest/dist/emos.umd.js
https://cdn.jsdelivr.net/npm/@tarunbtw/emos@0.1.0/dist/emos.umd.js
```

## License

MIT
