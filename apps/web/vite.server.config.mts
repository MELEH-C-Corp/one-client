// Server bundle for the ECS, Vercel and Cloudflare Workers targets; run after the client `vite build`.
// Kept separate from vite.config.mts: its node-polyfill aliases and .env defines must not reach server code.
import { cpSync, existsSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { enableDebugRoutes } from './scripts/debug-routes'

const TARGETS = {
  ecs: {
    entry: 'functions/ecs-entry.ts',
    outDir: 'build/server',
    deploymentEnv: process.env.DEPLOYMENT_ENV,
  },
  vercel: {
    entry: 'functions/vercel-entry.ts',
    outDir: '.vercel/output/functions/api.func',
    deploymentEnv: process.env.VERCEL_ENV,
  },
  // wrangler re-bundles this output (see wrangler.jsonc), resolving @vercel/og's workerd build and its wasm.
  workers: {
    entry: 'functions/worker-entry.ts',
    outDir: 'build/worker',
    deploymentEnv: process.env.DEPLOYMENT_ENV,
  },
}

const targetName = process.env.DEPLOY_TARGET
if (targetName !== 'ecs' && targetName !== 'vercel' && targetName !== 'workers') {
  throw new Error(`vite.server.config.mts: DEPLOY_TARGET must be ecs, vercel or workers (got ${targetName})`)
}
const target = TARGETS[targetName]
const isWorkers = targetName === 'workers'

// @vercel/og readFileSync's these next to its module, which is the single-file bundle.
const OG_ASSETS = ['noto-sans-v27-latin-regular.ttf', 'yoga.wasm', 'resvg.wasm']

function copyOgAssetsPlugin(): Plugin {
  return {
    name: 'copy-og-assets',
    writeBundle({ dir }) {
      const ogDistDir = path.resolve(__dirname, '../../node_modules/@vercel/og/dist')
      for (const asset of OG_ASSETS) {
        const src = path.resolve(ogDistDir, asset)
        if (!existsSync(src)) {
          throw new Error(`@vercel/og asset not found: ${src}`)
        }
        cpSync(src, path.resolve(dir ?? target.outDir, asset))
      }
    },
  }
}

export default defineConfig({
  root: __dirname,
  // Server code reads its config from process.env at runtime; skip Vite's .env loading.
  envDir: false,
  define: {
    'process.env.ENABLE_DEBUG_ROUTES': JSON.stringify(enableDebugRoutes(target.deploymentEnv)),
  },
  resolve: {
    tsconfigPaths: true,
  },
  // The runtime image ships no node_modules. On Workers, @vercel/og stays external for wrangler to bundle.
  ssr: {
    noExternal: true,
    external: isWorkers ? ['@vercel/og'] : [],
    target: isWorkers ? 'webworker' : 'node',
  },
  plugins: isWorkers ? [] : [copyOgAssetsPlugin()],
  build: {
    ssr: target.entry,
    outDir: target.outDir,
    emptyOutDir: true,
    copyPublicDir: false,
    minify: false,
    sourcemap: false,
    rolldownOptions: {
      output: {
        entryFileNames: 'index.mjs',
        codeSplitting: false,
      },
    },
  },
})
