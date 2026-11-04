/**
 * Canonical Entry Gateway hosts and base URLs — the single source of truth
 * for the three backend environments.
 *
 * This module intentionally has ZERO imports so it stays safe to use from
 * any context: client bundles, node servers, Cloudflare Workers, vite
 * configs, and build scripts. Do not add imports or logic here.
 *
 * Consumers inside the monorepo should import these via `@universe/api`
 * (or this module directly where the barrel is too heavy). Sites that
 * cannot import TypeScript (env files, JSON/YAML configs, workflows) carry
 * a TODO comment pointing back at this file instead.
 *
 * MELEH ONE: every backend host the client talks to lives under meleh.us.
 * The MELEH gateway decides which upstream (own services, Alchemy, Trading API
 * with our key) serves each route, so the client never names a third-party backend.
 */

/** Root domain of all MELEH ONE backend traffic. */
export const MELEH_ROOT_DOMAIN = 'meleh.us'
/** Root of the per-flow edge gateway hosts, e.g. `graphql.interface.gateway.meleh.us`. */
export const MELEH_GATEWAY_ROOT_DOMAIN = `gateway.${MELEH_ROOT_DOMAIN}`

/** Entry Gateway hostname for the dev backend environment. */
export const DEV_ENTRY_GATEWAY_HOST = `api-dev.${MELEH_ROOT_DOMAIN}`
/** Entry Gateway hostname for the staging backend environment. */
export const STAGING_ENTRY_GATEWAY_HOST = `api-staging.${MELEH_ROOT_DOMAIN}`
/** Entry Gateway hostname for the production backend environment. */
export const PROD_ENTRY_GATEWAY_HOST = `api.${MELEH_ROOT_DOMAIN}`

/** Entry Gateway base URL for the dev backend environment. */
export const DEV_ENTRY_GATEWAY_API_BASE_URL: string = `https://${DEV_ENTRY_GATEWAY_HOST}`
/** Entry Gateway base URL for the staging backend environment. */
export const STAGING_ENTRY_GATEWAY_API_BASE_URL: string = `https://${STAGING_ENTRY_GATEWAY_HOST}`
/** Entry Gateway base URL for the production backend environment. */
export const PROD_ENTRY_GATEWAY_API_BASE_URL: string = `https://${PROD_ENTRY_GATEWAY_HOST}`
