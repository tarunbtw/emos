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
