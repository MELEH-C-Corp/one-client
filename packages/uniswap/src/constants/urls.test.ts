import {
  getUniswapServiceUrls,
  UNISWAP_STAGING_WEB_HOSTNAME,
  UNISWAP_WEB_HOSTNAME,
  UniswapHelpUrls,
} from 'uniswap/src/constants/urls'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Drive the environment helpers per test so we can exercise the beta routing switch.
const mockEnvState = {
  isWebApp: false,
  isBetaEnv: false,
  isDevEnv: false,
  isE2eTestEnv: false,
}

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isWebApp(): boolean {
      return mockEnvState.isWebApp
    },
    isBetaEnv: () => mockEnvState.isBetaEnv,
    isDevEnv: () => mockEnvState.isDevEnv,
    isE2eTestEnv: () => mockEnvState.isE2eTestEnv,
  }
})

describe('getUniswapServiceUrls — beta API target', () => {
  afterEach(() => {
    mockEnvState.isWebApp = false
    mockEnvState.isBetaEnv = false
    mockEnvState.isDevEnv = false
    mockEnvState.isE2eTestEnv = false
  })

  it('routes beta to staging by default (isBetaUsingProdApi unset)', () => {
    mockEnvState.isBetaEnv = true

    const urls = getUniswapServiceUrls({})

    expect(urls.embeddedWalletHostname).toBe(UNISWAP_STAGING_WEB_HOSTNAME)
    expect(urls.liquidityServiceUrl).toContain('api-staging.meleh.us')
    expect(urls.privyEmbeddedWalletUrl).toContain('api-staging.meleh.us')
  })

  it('routes beta to prod when isBetaUsingProdApi is true', () => {
    mockEnvState.isBetaEnv = true

    const urls = getUniswapServiceUrls({ isBetaUsingProdApi: true })

    expect(urls.embeddedWalletHostname).toBe(UNISWAP_WEB_HOSTNAME)
    expect(urls.liquidityServiceUrl).toBe('https://liquidity.api.meleh.us')
    expect(urls.privyEmbeddedWalletUrl).toBe('https://api.meleh.us')
  })

  it('keeps beta on staging when isBetaUsingProdApi is false', () => {
    mockEnvState.isBetaEnv = true

    const urls = getUniswapServiceUrls({ isBetaUsingProdApi: false })

    expect(urls.embeddedWalletHostname).toBe(UNISWAP_STAGING_WEB_HOSTNAME)
    expect(urls.liquidityServiceUrl).toContain('api-staging.meleh.us')
  })

  it('ignores isBetaUsingProdApi outside a beta build (dev stays on staging/dev hosts)', () => {
    mockEnvState.isDevEnv = true

    // isBetaUsingProdApi only gates beta; dev routing must be unaffected.
    const urls = getUniswapServiceUrls({ isBetaUsingProdApi: true })

    expect(urls.embeddedWalletHostname).toBe('dev.ew.unihq.org')
    expect(urls.liquidityServiceUrl).toContain('api-staging.meleh.us')
  })
})

describe('UniswapHelpUrls', () => {
  it('uses the canonical Earn article slug for general help', () => {
    expect(UniswapHelpUrls.articles.earnHelp).toBe(
      'https://support.meleh.us/hc/en-us/articles/46865818181901-Earn-on-Uniswap?product_link=web',
    )
  })

  it('links Earn transaction failures to the troubleshooting section', () => {
    expect(UniswapHelpUrls.articles.earnTroubleshooting).toBe(
      'https://support.meleh.us/hc/en-us/articles/46865818181901-Earn-on-Uniswap?product_link=web#troubleshooting-errors',
    )
  })

  it('links the Uniswap hook provenance badge to its help article', () => {
    expect(UniswapHelpUrls.articles.uniswapBuiltHooks).toBe(
      'https://support.meleh.us/hc/en-us/articles/48747190274317?product_link=web',
    )
  })
})
