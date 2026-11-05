/** `custom.app` on the Statsig user — the surface a gate condition targets. Interface (apps/web) and Pools (apps/pools-xyz) share one client key. */
export enum StatsigCustomAppValue {
  Mobile = 'mobile',
  Extension = 'extension',
  Interface = 'interface',
  Pools = 'pools',
}

/**
 * Placeholder Statsig SDK key used instead of the real client key whenever the app runs in a test
 * environment (unit tests and e2e builds — see `getStatsigApiKeyOrThrow`). Exported so e2e fixtures
 * can derive the same storage slots (e.g. local-override persistence) the app under test uses.
 */
export const TEST_STATSIG_SDK_KEY = 'dummy-test-key'

/**
 * Placeholder Statsig SDK key for builds without a Statsig key (MELEH ONE until it has its own
 * Statsig project). The client then runs fully offline: every gate and config resolves to its
 * in-code default and no gating traffic leaves the app (see `isStatsigOffline`).
 */
export const OFFLINE_STATSIG_SDK_KEY = 'client-offline'
