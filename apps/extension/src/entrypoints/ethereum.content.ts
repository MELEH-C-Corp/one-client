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
  // ONE icon (brand/logo/ONE-icon-rounded.svg), announced to dapps via EIP-6963
  const UNISWAP_LOGO = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="225.28" fill="#F42902"/><g transform="translate(112.63999999999999 366.4261038220194) scale(0.4556303479749002) translate(-21 -475)"><path d="M208 577Q206 608 203.5 646.5Q201 685 200.0 723.0Q199 761 199 793Q199 848 202.5 891.0Q206 934 217.0 964.0Q228 994 249.0 1009.5Q270 1025 305 1025Q314 1025 325.0 1023.5Q336 1022 346.5 1018.5Q357 1015 364 1009Q378 997 385.0 970.5Q392 944 394.5 900.5Q397 857 397 796Q397 706 387.0 655.0Q377 604 353.0 582.5Q329 561 287 561Q283 561 278.0 561.0Q273 561 268 562L264 487Q272 483 282.5 479.0Q293 475 301 475Q399 475 459.5 506.0Q520 537 548.0 603.5Q576 670 576 777Q576 845 565.5 898.0Q555 951 538 985Q522 1006 492.5 1028.0Q463 1050 428.5 1069.5Q394 1089 363.5 1100.5Q333 1112 316 1112Q243 1112 187.5 1094.5Q132 1077 95.0 1041.0Q58 1005 39.5 948.5Q21 892 21 814Q21 756 29.5 709.5Q38 663 51 630Q67 611 97.5 587.5Q128 564 164 542ZM264 487H301V977Q301 983 293.5 998.5Q286 1014 275 1034H247V549Q247 541 252.0 524.0Q257 507 264 487ZM672 578 622 555V490Q642 488 668.5 485.0Q695 482 721.0 479.5Q747 477 766.0 476.0Q785 475 791 477Q804 481 813.5 491.0Q823 501 830.0 511.5Q837 522 839 528V1010L905 1033L871 1098Q851 1100 827.0 1103.0Q803 1106 781.0 1108.5Q759 1111 742.5 1112.0Q726 1113 720 1111Q708 1107 698.0 1097.0Q688 1087 681.5 1076.5Q675 1066 672 1060ZM1012 1060V715Q1012 672 1005.0 651.5Q998 631 985.0 624.5Q972 618 954 618Q949 618 941.0 619.5Q933 621 924.0 623.0Q915 625 905 629L877 538Q888 532 906.0 521.5Q924 511 943.5 500.5Q963 490 977.5 482.5Q992 475 995 475Q1034 475 1075.5 480.5Q1117 486 1140 498Q1164 532 1171.5 564.5Q1179 597 1179 650V1010L1229 1033V1098Q1209 1100 1182.5 1103.0Q1156 1106 1130.0 1108.5Q1104 1111 1085.0 1112.0Q1066 1113 1060 1111Q1048 1107 1038.0 1097.0Q1028 1087 1021.5 1076.5Q1015 1066 1012 1060ZM931 538V976Q931 982 923.5 997.5Q916 1013 905 1033H877V538ZM1269 555V490Q1289 488 1315.5 485.0Q1342 482 1368.0 479.5Q1394 477 1413.0 476.0Q1432 475 1438 477Q1451 481 1460.5 491.0Q1470 501 1477.0 511.5Q1484 522 1486 528V1018L1645 1036L1663 905H1745L1749 1100Q1703 1102 1647.5 1104.5Q1592 1107 1538.0 1109.0Q1484 1111 1441.0 1112.5Q1398 1114 1376 1114Q1364 1114 1352.0 1105.0Q1340 1096 1331.5 1083.5Q1323 1071 1319 1061V578ZM1541 490H1578V977Q1578 983 1570.5 998.5Q1563 1014 1552 1034H1524V552Q1524 544 1529.0 527.0Q1534 510 1541 490ZM1561 743 1680 737 1674 839 1568 833ZM1562 490H1774L1761 689H1679L1667 588L1559 573Z" fill="#FDFDFF"/></g></svg>`)}`
  const UNISWAP_NAME = 'MELEH ONE'
  const UNISWAP_RDNS = 'us.meleh.wallet'

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
