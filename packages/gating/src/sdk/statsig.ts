import { StatsigClient, type StatsigOptions, type StatsigUser } from '@statsig/react-bindings'
import { getConfig } from '@universe/config'
import { isTestEnv } from '@universe/environment'
import { OFFLINE_STATSIG_SDK_KEY, TEST_STATSIG_SDK_KEY } from '@universe/gating/src/constants'
import { LocalOverrideAdapterWrapper } from '@universe/gating/src/LocalOverrideAdapterWrapper'

export {
  StatsigClient,
  StatsigContext,
  type StatsigOptions,
  StatsigProvider,
  type StatsigUser,
  Storage,
  type StorageProvider,
  type TypedReturn,
  useClientAsyncInit,
  useDynamicConfig,
  useExperiment,
  useFeatureGate,
  useGateValue,
  useLayer,
  useStatsigClient,
  useStatsigUser,
} from '@statsig/react-bindings'

let localOverrideAdapter: LocalOverrideAdapterWrapper | undefined

/** True when no Statsig key is configured: gates run offline on their in-code defaults. */
export function isStatsigOffline(): boolean {
  return !isTestEnv() && !getConfig().statsigApiKey
}

export function getStatsigApiKey(): string {
  // A dummy key is used in test env b/c the wallet/mobile tests use this file instead of the statsig.native file
  if (isTestEnv()) {
    return TEST_STATSIG_SDK_KEY
  }
  return getConfig().statsigApiKey || OFFLINE_STATSIG_SDK_KEY
}

export function getOverrideAdapter(): LocalOverrideAdapterWrapper {
  if (!localOverrideAdapter) {
    localOverrideAdapter = new LocalOverrideAdapterWrapper(getStatsigApiKey(), getStatsigClient)
  }
  return localOverrideAdapter
}

export function getStatsigClient(): StatsigClient {
  return StatsigClient.instance(getStatsigApiKey())
}

/**
 * Web counterpart to the native `bootstrapStatsigClient`. Web doesn't currently
 * need this for any saga path, but the symmetric API lets it opt in the same way.
 */
export function bootstrapStatsigClient(user: StatsigUser, options: StatsigOptions): StatsigClient {
  return new StatsigClient(getStatsigApiKey(), user, options)
}
