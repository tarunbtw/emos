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

  it('applies size to the node via size field', () => {
    const result = parse(':fire:', emojis, { size: '2em' })
    expect((result[0] as any).size).toBe('2em')
  })

  it('allows per-emoji size override', () => {
    const map = { doge: '/doge.png', big: { src: '/big.png', size: '2em' } }
    const result = parse(':doge: :big:', map, { size: '1.2em' })
    expect((result[0] as any).size).toBe('1.2em')
    expect((result[2] as any).size).toBe('2em')
  })

  it('resolves src from object entries', () => {
    const map = { big: { src: '/big.png', size: '2em' } }
    const result = parse(':big:', map)
    expect((result[0] as any).src).toBe('/big.png')
  })

  it('object entry without size falls back to default size', () => {
    const map = { logo: { src: '/logo.png' } }
    const result = parse(':logo:', map, { size: '1.5em' })
    expect((result[0] as any).size).toBe('1.5em')
  })
})
