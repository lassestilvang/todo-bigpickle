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

expect.extend(matchers)
