import { addWindowMessageListener } from 'src/background/messagePassing/messageUtils'
import { isSandboxedFrame } from 'src/contentScript/isSandboxedFrame'
import {
  ETH_PROVIDER_CONFIG,
  isValidContentScriptToProxyEmission,
  isValidWindowEthereumConfigResponse,
  WindowEthereumConfigResponse,
} from 'src/contentScript/types'
import { WindowEthereumProxy } from 'src/contentScript/WindowEthereumProxy'
import { logger } from 'utilities/src/logger/logger'
import { uuid } from 'utilities/src/primitives/uuid'
import { defineContentScript } from 'wxt/utils/define-content-script'

declare global {
  interface Window {
    isStretchInstalled?: boolean
    // We declare this as readonly to force the use of `assignWindowEthereum` to override it.
    readonly ethereum?: unknown
  }
}

function makeEthereum(): void {
  // Guard against running in Node environment during WXT prepare
  if (typeof window === 'undefined') {
    return
  }

  // Do not inject the provider into sandboxed frames without allow-same-origin.
  if (isSandboxedFrame()) {
    return
  }
  // TODO(xtine): Get this working by importing the svg file directly. The svg text comes from packages/mycelium/src/assets/icons/uniswap-logo.svg
  const UNISWAP_LOGO = `data:image/svg+xml,${encodeURIComponent(`<svg width="96" height="96" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="22" height="22" rx="6" fill="#0E9F6E"/>
<path d="M5.5 15.5V6.5L11 12L16.5 6.5V15.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`)}`
  const UNISWAP_NAME = 'MELEH ONE'
  const UNISWAP_RDNS = 'one.meleh.wallet'

  enum EIP6963EventNames {
    Announce = 'eip6963:announceProvider',
    Request = 'eip6963:requestProvider',
  }

  interface EIP6963ProviderInfo {
    uuid: string
    name: string
    icon: string
    rdns: string
  }

  function assignWindowEthereum(provider: unknown): void {
    try {
      // We need to try/catch this because some sneaky wallet extensions set `window.ethereum` to a getter,
      // which throws an error when trying to override it.
      // In these cases, our wallet will only work with dapps that suppport EIP-6963.
      // @ts-expect-error: we're intentionally trying to override this.
      window.ethereum = provider
    } catch (error) {
      if (__DEV__) {
        // Only log in dev env for debugging purposes to avoid spamming DD with these errors.
        logger.error(error, { tags: { file: 'ethereum.ts', function: 'assignWindowEthereum' } })
      }
    }
  }

  const oldProvider = window.ethereum

  const uniswapProvider = new WindowEthereumProxy()
  assignWindowEthereum(uniswapProvider)

  addWindowMessageListener({
    validator: isValidContentScriptToProxyEmission,
    handler: (message) => {
      logger.debug('ethereum.ts', `Emitting ${message.emitKey} via WindowEthereumProxy`, message.emitValue)
      uniswapProvider.emit(message.emitKey, message.emitValue)
    },
  })

  const providerUuid = uuid()

  function announceProvider(): void {
    const info: EIP6963ProviderInfo = {
      uuid: providerUuid,
      name: UNISWAP_NAME,
      icon: UNISWAP_LOGO,
      rdns: UNISWAP_RDNS,
    }

    window.dispatchEvent(
      new CustomEvent(EIP6963EventNames.Announce, {
        detail: Object.freeze({ info, provider: uniswapProvider }),
      }),
    )
  }

  const handle6963Request = (event: Event): void => {
    if (!isValidRequestProviderEvent(event)) {
      throw new Error(
        `Invalid EIP-6963 RequestProviderEvent object received from ${EIP6963EventNames.Request} event. See https://eips.ethereum.org/EIPS/eip-6963 for requirements.`,
      )
    }

    announceProvider()
  }

  const create6963Listener = (): void => {
    // remove the old listener if present
    window.removeEventListener(EIP6963EventNames.Request, handle6963Request)

    window.addEventListener(EIP6963EventNames.Request, handle6963Request)

    announceProvider()
  }

  create6963Listener()

  // override logic impl details in src/app/utils/provider.ts
  // get config from sister content script
  addWindowMessageListener<WindowEthereumConfigResponse>({
    validator: isValidWindowEthereumConfigResponse,
    handler: async (request) => {
      const isDefaultProvider = request.config.isDefaultProvider

      // if default provider is false, restore old provider for 1193 and unspoof 6963 provider
      if (isDefaultProvider === false) {
        uniswapProvider.isMetaMask = false
        if (oldProvider) {
          assignWindowEthereum(oldProvider)
          create6963Listener()
        }
      }
    },
    options: { removeAfterHandled: true },
  })

  window.postMessage({ type: ETH_PROVIDER_CONFIG.REQUEST })

  type EIP6963RequestProviderEvent = Event & {
    type: EIP6963EventNames.Request
  }

  function isValidRequestProviderEvent(event: unknown): event is EIP6963RequestProviderEvent {
    return event instanceof Event && event.type === EIP6963EventNames.Request
  }
}

export default defineContentScript({
  matches: ['http://127.0.0.1/*', 'http://localhost/*', 'https://*/*'],
  runAt: 'document_start',
  // TODO(INFRA-1010): not supported by firefox
  world: 'MAIN',
  allFrames: true,
  main() {
    makeEthereum()
  },
})
