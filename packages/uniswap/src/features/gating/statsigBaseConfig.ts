import { getOverrideAdapter, getStatsigEnvName, isStatsigOffline, StatsigOptions } from '@universe/gating'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls } from 'uniswap/src/constants/urls'

export const statsigBaseConfig: StatsigOptions = {
  networkConfig: {
    api: getUniswapServiceUrls(config).statsigProxyUrl,
    // Without a Statsig key, gates keep their in-code defaults and nothing is fetched.
    preventAllNetworkTraffic: isStatsigOffline(),
  },
  environment: {
    tier: getStatsigEnvName(),
  },
  overrideAdapter: getOverrideAdapter(),
}
