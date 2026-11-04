import { getEntryGatewayUrl, provideDeviceIdService, provideSessionStorage } from '@universe/api'
import {
  createRpcConfigResolver,
  createUniRpcConfigResolver,
  type RpcConfig,
  type UniverseChainId,
} from '@universe/chains'
import { isE2eTestEnv, isExtensionApp, REQUEST_SOURCE } from '@universe/environment'
import { FeatureFlags, getFeatureFlag, isStatsigClientRegistered } from '@universe/gating'
import { selectRpcUrl } from 'uniswap/src/features/providers/rpcUrlSelector'
import { isUniRpcOnlyChain } from 'uniswap/src/features/providers/unirpcOnlyChains'

export { createRpcConfigResolver } from '@universe/chains'
export type { RpcConfigResolver, RpcConfigResolverInput } from '@universe/chains'

/**
 * Convenience resolver for call sites that can't receive deps via injection.
 * Prefer ProviderManager for provider access — this exists for the edge cases.
 *
 * This file ships to both the web app (Vite) and the browser extension (WXT).
 * The two diverge in session strategy:
 *   - Web app: cookie-based — UniRPC reuses the browser's session cookie via
 *     `credentials: 'include'`, so no per-request header construction is needed.
 *   - Extension: header-based — extensions can't share the web app's cookie jar,
 *     so each request resolves a session/device header pair.
 *
 * Mobile uses the `.native.ts` sibling.
 */
const SHARED_UNI_RPC_CONFIG = {
  // UniRPC-only chains (Arc/Robinhood) always route through UniRPC; everything
  // else is flag-gated. Saga init runs before the Statsig provider mounts; guard
  // so the flag read doesn't trigger StatsigClient.instance()'s broken-fallback
  // branch.
  getFeatureFlag: (chainId: UniverseChainId) =>
    isUniRpcOnlyChain(chainId) || (isStatsigClientRegistered() && getFeatureFlag(FeatureFlags.UniRpcEnabled)),
  getEntryGatewayUrl,
  requestSource: REQUEST_SOURCE,
} as const

const webResolveUniRpcConfig = createUniRpcConfigResolver({
  ...SHARED_UNI_RPC_CONFIG,
  // MELEH: the web app uses the same flag gate as the extension, so until the MELEH
  // gateway serves /rpc/* the resolver falls through to the public chain-info RPCs.
  // Playwright e2e runs never use UniRPC: they have no gateway session (every /rpc/*
  // call 401s) and the legacy chain-info URLs point at local anvil.
  getFeatureFlag: (chainId: UniverseChainId) => !isE2eTestEnv() && SHARED_UNI_RPC_CONFIG.getFeatureFlag(chainId),
  credentials: 'include',
})

// Extension is header-based (can't share the web origin's cookie jar).
const resolveExtensionUniRpcHeaders = async (): Promise<Record<string, string>> => {
  const [session, deviceId] = await Promise.all([provideSessionStorage().get(), provideDeviceIdService().getDeviceId()])
  return {
    ...(session?.sessionId && { 'X-Session-ID': session.sessionId }),
    ...(deviceId && { 'X-Device-ID': deviceId }),
  }
}

const extensionResolveUniRpcConfig = createUniRpcConfigResolver({
  ...SHARED_UNI_RPC_CONFIG,
  getRequestHeaders: resolveExtensionUniRpcHeaders,
})

// Public RPCs now point at the entry gateway; when the legacy path returns one,
// authenticate it the same way the primary path does — cookie on web, header on extension.
const asUniRpcConfig = (config: RpcConfig): RpcConfig => {
  if (!config.rpcUrl.startsWith(`${getEntryGatewayUrl()}/rpc/`)) {
    return config
  }
  const promoted: RpcConfig = {
    ...config,
    isUniRpc: true,
    headers: { 'x-request-source': REQUEST_SOURCE, ...config.headers },
  }
  return isExtensionApp
    ? { ...promoted, getRequestHeaders: resolveExtensionUniRpcHeaders }
    : { ...promoted, credentials: 'include' }
}

export const defaultResolveRpcConfig = createRpcConfigResolver({
  resolveUniRpcConfig: isExtensionApp ? extensionResolveUniRpcConfig : webResolveUniRpcConfig,
  selectLegacyRpcUrl: selectRpcUrl,
  asUniRpcConfig,
})
