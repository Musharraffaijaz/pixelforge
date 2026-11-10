// Post-build script: copy manifest.json, background.js, and icons into dist/
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')
const pub = resolve(root, 'public')

function copy(src, dest) {
  const destDir = dirname(dest)
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })
  copyFileSync(src, dest)
  console.log(`  ✓ ${src.replace(root, '')} → ${dest.replace(root, '')}`)
}

function copyDir(src, dest) {
  if (!existsSync(src)) return
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
  const entries = readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copy(srcPath, destPath)
    }
  }
}

console.log('\n📦 Copying extension assets to dist/...')
copy(resolve(pub, 'manifest.json'), resolve(dist, 'manifest.json'))
copy(resolve(pub, 'background.js'), resolve(dist, 'background.js'))
copyDir(resolve(pub, 'icons'), resolve(dist, 'icons'))
console.log('✅ Build complete! Load the dist/ folder in Chrome Extensions.\n')
