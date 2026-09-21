import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

const require = createRequire(import.meta.url)

const MTEXT_WORKER = 'mtext-renderer-worker.js'
const LIBREDWG_WORKER = 'libredwg-parser-worker.js'
const LIBREDWG_WASM = 'libredwg-web.wasm'

function packageDir(name: string): string {
  const entry = require.resolve(name)
  let dir = dirname(entry)
  while (true) {
    const pkgPath = join(dir, 'package.json')
    if (existsSync(pkgPath)) {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string }
      if (pkg.name === name) {
        return dir
      }
    }
    const parent = dirname(dir)
    if (parent === dir) {
      throw new Error(`Package root not found: ${name}`)
    }
    dir = parent
  }
}

function firstExisting(paths: string[]): string {
  const found = paths.find(path => existsSync(path))
  if (!found) {
    throw new Error(`Missing worker asset. Tried:\n${paths.join('\n')}`)
  }
  return found
}

const mtextWorker = firstExisting([
  join(packageDir('@mlightcad/cad-simple-viewer'), 'dist', MTEXT_WORKER),
  join(packageDir('@mlightcad/mtext-renderer'), 'dist', MTEXT_WORKER)
])
const libredwgDir = join(packageDir('@mlightcad/libredwg-converter'), 'dist')

export default defineConfig({
  base: './',
  build: {
    modulePreload: false,
    minify: true
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: mtextWorker, dest: 'workers', rename: { stripBase: true } },
        {
          src: join(libredwgDir, LIBREDWG_WORKER),
          dest: 'workers',
          rename: { stripBase: true }
        },
        {
          src: join(libredwgDir, LIBREDWG_WASM),
          dest: 'workers',
          rename: { stripBase: true }
        }
      ]
    })
  ]
})
