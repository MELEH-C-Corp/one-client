// Cloudflare Workers entry point (bundled by wrangler, see apps/web/wrangler.jsonc).
// Static files are served by Workers Static Assets before this Worker runs; everything
// else (SPA routes, meta tag injection, OG images, BFF proxies) goes through createApp.
import { Environment } from '@universe/config'
import { createApp, ENTRY_GATEWAY_URLS } from 'functions/app'
import type { ExecutionContext } from 'hono'

interface Env {
  ASSETS: { fetch: typeof fetch }
  /** Backend environment this deployment talks to: development | staging | production. */
  ENVIRONMENT?: string
  /** Space-separated CSP source list allowed to frame /embed documents. */
  EMBED_FRAME_ANCESTORS?: string
}

function resolveDefaultEnvironment(value: string | undefined): Environment {
  switch (value) {
    case Environment.Development:
      return Environment.Development
    case Environment.Staging:
      return Environment.Staging
    default:
      return Environment.Production
  }
}

let app: ReturnType<typeof createApp> | undefined

function getApp(): ReturnType<typeof createApp> {
  app ??= createApp({
    fetchSpaHtml: (c) => (c.env as Env).ASSETS.fetch(new URL('/index.html', c.req.url)),
    getEntryGatewayUrl: (c, env) => ENTRY_GATEWAY_URLS[env ?? resolveDefaultEnvironment((c.env as Env).ENVIRONMENT)],
    // Cloudflare sets cf-connecting-ip itself and overwrites any client-supplied value.
    getTrustedClientIp: (c) => c.req.header('cf-connecting-ip'),
    getEmbedFrameAncestors: (c) => (c.env as Env).EMBED_FRAME_ANCESTORS,
  })
  return app
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    return getApp().fetch(request, env, ctx)
  },
}
