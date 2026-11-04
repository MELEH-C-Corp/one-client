import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Extension font contract.
 *
 * One family must resolve on every extension UI page: "Inter", requested both
 * by the shared Tailwind base layer (packages/tailwind/css/base.css applies
 * `font-basel`, which theme.css resolves to "Inter") and by Tamagui text
 * (ui/src/theme/fonts.ts, web branch). It is backed by the Inter variable font
 * in packages/tailwind/fonts, so the 485/535 book/medium weights render as-is.
 *
 * Basel Grotesk is Uniswap's licensed font and must not ship with MELEH ONE.
 * Neither it nor the pre-license 2019 dev cut (src/public/assets/fonts/
 * Basel-{Book,Medium}.woff) may come back, and entrypoint pages must not add
 * unlayered `* { font-family }` rules that override the layered Tailwind base.
 */

const extensionRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const tailwindPkgRoot = join(extensionRoot, '..', '..', 'packages', 'tailwind')

const appTailwindCss = readFileSync(join(extensionRoot, 'src', 'app', 'tailwind.css'), 'utf8')
const themeCss = readFileSync(join(tailwindPkgRoot, 'css', 'theme.css'), 'utf8')
const sharedFontsCss = readFileSync(join(tailwindPkgRoot, 'css', 'fonts.css'), 'utf8')
const uiFontsTs = readFileSync(join(extensionRoot, '..', '..', 'packages', 'ui', 'src', 'theme', 'fonts.ts'), 'utf8')

const ENTRYPOINT_HTML_PATHS = ['sidepanel', 'onboarding', 'fallback-popup', 'unitagClaim'].map((entry) =>
  join(extensionRoot, 'src', 'entrypoints', entry, 'index.html'),
)

function fontFaceBlocks(css: string): string[] {
  return [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((match) => match[0])
}

function familyOf(block: string): string | undefined {
  return block.match(/font-family:\s*["']([^"']+)["']/)?.[1]
}

describe('extension font registration', () => {
  it('loads the @font-face family that the shared Tailwind base layer requests', () => {
    const baseFamily = themeCss.match(/--font-basel:\s*["']([^"']+)["']/)?.[1]
    expect(baseFamily, 'packages/tailwind/css/theme.css must define --font-basel').toBeTruthy()

    // The shared fonts stylesheet registers that family…
    const sharedFamilies = fontFaceBlocks(sharedFontsCss).map(familyOf)
    expect(sharedFamilies).toContain(baseFamily)

    // …and the extension actually imports it.
    expect(appTailwindCss).toMatch(/@import\s+["']@universe\/tailwind\/(css\/)?fonts(\.css)?["']/)
  })

  it('registers the family that Tamagui text requests, at every weight', () => {
    const tamaguiFamily = uiFontsTs.match(/export const baselBook = isWebPlatform\s*\?\s*'([^,']+),/)?.[1]
    expect(tamaguiFamily, 'packages/ui/src/theme/fonts.ts must define the web baselBook stack').toBeTruthy()

    const face = fontFaceBlocks(sharedFontsCss).find((block) => familyOf(block) === tamaguiFamily)
    expect(face, `packages/tailwind/css/fonts.css must register "${tamaguiFamily}"`).toBeTruthy()
    expect(face).toMatch(/font-weight:\s*100 900/)
  })

  it('re-asserts the base font on body outside of @layer', () => {
    // Chrome injects `body { font-family: <pref font>; font-size: 75% }` into
    // chrome-extension:// pages as an unlayered author style, which beats the
    // @layer base html/body rule — the override must stay unlayered.
    expect(appTailwindCss).toMatch(/^body\s*\{[^}]*font-family:\s*var\(--font-basel\)/m)
  })

  it('entrypoint HTML pages register no fonts and no unlayered font-family overrides', () => {
    for (const htmlPath of ENTRYPOINT_HTML_PATHS) {
      const html = readFileSync(htmlPath, 'utf8')
      // An unlayered `* { font-family }` in the page would beat every layered
      // Tailwind rule (cascade layers lose to unlayered styles), silently
      // re-breaking fonts for the whole page.
      expect(html, `${htmlPath} must not declare font-family`).not.toMatch(/font-family/)
      expect(html, `${htmlPath} must not reference the unlicensed dev fonts`).not.toMatch(/Basel-(Book|Medium)\.woff/)
    }
  })

  it('no Basel font files ship with the extension', () => {
    for (const file of ['Basel-Book.woff', 'Basel-Medium.woff']) {
      expect(
        existsSync(join(extensionRoot, 'src', 'public', 'assets', 'fonts', file)),
        `${file} should be deleted`,
      ).toBe(false)
    }
    for (const file of ['Basel-Grotesk-Book.woff2', 'Basel-Grotesk-Medium.woff2']) {
      expect(existsSync(join(tailwindPkgRoot, 'fonts', file)), `${file} should be deleted`).toBe(false)
    }
    expect(appTailwindCss).not.toMatch(/Basel/)
  })
})
