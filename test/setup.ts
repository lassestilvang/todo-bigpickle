import { expect } from 'bun:test'
import { JSDOM } from 'jsdom'
import * as matchers from '@testing-library/jest-dom/matchers'

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
})

const win = dom.window as unknown as typeof globalThis

globalThis.document = win.document
globalThis.window = win.window
globalThis.navigator = win.navigator
globalThis.Node = win.Node
globalThis.Element = win.Element
globalThis.HTMLElement = win.HTMLElement
globalThis.getComputedStyle = win.window.getComputedStyle.bind(win.window)
globalThis.CSSStyleDeclaration = win.window.CSSStyleDeclaration

globalThis.KeyboardEvent = win.KeyboardEvent
globalThis.MouseEvent = win.MouseEvent
globalThis.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(cb, 0) as unknown as number
globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id)

if (!globalThis.PointerEvent) {
  class PointerEvent extends MouseEvent {
    pointerType = 'mouse'
    isPrimary = true
    constructor(type: string, init?: PointerEventInit) {
      super(type, init)
    }
  }
  globalThis.PointerEvent = PointerEvent
  win.PointerEvent = PointerEvent
}

const matchMediaImpl = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
}) as unknown as MediaQueryList

if (!globalThis.matchMedia) {
  globalThis.matchMedia = matchMediaImpl
}
if (!win.matchMedia) {
  win.matchMedia = matchMediaImpl
}

globalThis.MediaQueryList = win.MediaQueryList

globalThis.localStorage = win.localStorage

globalThis.MutationObserver = class {
  observe() {}
  disconnect() {}
  takeRecords() { return [] }
} as unknown as typeof MutationObserver

expect.extend(matchers)
