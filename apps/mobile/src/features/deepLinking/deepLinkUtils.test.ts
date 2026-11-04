import { DeepLinkAction, parseDeepLinkUrl } from 'src/features/deepLinking/deepLinkUtils'

// Mock the logger
vi.mock('utilities/src/logger/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

describe('getDeepLinkAction', () => {
  it.each`
    url                                                                                                   | expected
    ${'https://app.uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=0x123'}                 | ${DeepLinkAction.UniswapWebLink}
    ${'melehone://wc?uri=wc:123@2?relay-protocol=irn&symKey=51e'}                                         | ${DeepLinkAction.WalletConnectAsParam}
    ${'melehone://wc:123@2?relay-protocol=irn&symKey=51e'}                                                | ${DeepLinkAction.UniswapWalletConnect}
    ${'melehone://widget/#/tokens/ethereum/0x...'}                                                        | ${DeepLinkAction.UniswapWidget}
    ${'melehone://scantastic?param=value'}                                                                | ${DeepLinkAction.Scantastic}
    ${'https://uniswap.org/app?screen=transaction&fiatOnRamp=true&userAddress=0x123'}                     | ${DeepLinkAction.ShowTransactionAfterFiatOnRamp}
    ${'https://uniswap.org/app?screen=transaction&fiatOffRamp=true&userAddress=0x123'}                    | ${DeepLinkAction.ShowTransactionAfterFiatOffRampScreen}
    ${'https://uniswap.org/app?screen=transaction&userAddress=0x123'}                                     | ${DeepLinkAction.TransactionScreen}
    ${'https://uniswap.org/app?screen=swap&userAddress=0x123'}                                            | ${DeepLinkAction.SwapScreen}
    ${'melehone://unsupported'}                                                                           | ${DeepLinkAction.SkipNonWalletConnect}
    ${'https://uniswap.org/app/wc?uri=wc:123'}                                                            | ${DeepLinkAction.UniversalWalletConnectLink}
    ${'wc:123@2?relay-protocol=irn&symKey=51e'}                                                           | ${DeepLinkAction.WalletConnect}
    ${'https://uniswap.org/app?screen=unknown'}                                                           | ${DeepLinkAction.Unknown}
    ${'melehone://app/fiatonramp?userAddress=0x123&source=push'}                                          | ${DeepLinkAction.FiatOnRampScreen}
    ${'melehone://app/fiatonramp?source=push&moonpayOnly=true&moonpayCurrencyCode=usdc&amount=100'}       | ${DeepLinkAction.FiatOnRampScreen}
    ${'melehone://app/tokendetails?currencyId=10-0x6fd9d7ad17242c41f7131d257212c54a0e816691&source=push'} | ${DeepLinkAction.TokenDetails}
    ${'melehone://app/earn?source=push'}                                                                  | ${DeepLinkAction.EarnScreen}
    ${'https://cryptothegame.com/'}                                                                       | ${DeepLinkAction.UniswapExternalBrowserLink}
    ${'https://support.uniswap.org/hc/en-us/articles/test-article-123'}                                   | ${DeepLinkAction.UniswapExternalBrowserLink}
    ${'https://blog.uniswap.org/article'}                                                                 | ${DeepLinkAction.UniswapExternalBrowserLink}
    ${'https://uniswapx.uniswap.org/'}                                                                    | ${DeepLinkAction.UniswapExternalBrowserLink}
  `('url=$url should return expected=$expected', ({ url, expected }) => {
    expect(parseDeepLinkUrl(url).action).toEqual(expected)
  })
})
