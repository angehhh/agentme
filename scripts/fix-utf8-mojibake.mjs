import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const iconv = require('iconv-lite')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const exts = new Set(['.ts', '.tsx', '.js', '.jsx'])
const skipDirs = new Set(['node_modules', '.next', '.git'])

function buildCp1252MojibakeReplacements() {
  const enc = new TextEncoder()
  const map = new Map()
  for (let cp = 0; cp <= 0xffff; cp++) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue
    const ch = String.fromCodePoint(cp)
    const bytes = enc.encode(ch)
    if (bytes.length <= 1) continue
    const wrong = iconv.decode(Buffer.from(bytes), 'windows1252')
    if (wrong !== ch) map.set(wrong, ch)
  }
  return [...map.entries()].sort((a, b) => b[0].length - a[0].length)
}

let pairs = null
function fixString(s) {
  if (!pairs) pairs = buildCp1252MojibakeReplacements()
  let out = s
  for (const [wrong, right] of pairs) {
    if (wrong.length === 0) continue
    if (!out.includes(wrong)) continue
    out = out.split(wrong).join(right)
  }
  return out
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(name.name)) continue
    const p = path.join(dir, name.name)
    if (name.isDirectory()) walk(p, out)
    else if (exts.has(path.extname(name.name))) out.push(p)
  }
  return out
}

const dirs = [path.join(root, 'app'), path.join(root, 'lib')]
const nextCfg = path.join(root, 'next.config.ts')
const files = [...dirs.flatMap((d) => walk(d))]
if (fs.existsSync(nextCfg)) files.push(nextCfg)

let n = 0
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8')
  const fixed = fixString(raw)
  if (fixed !== raw) {
    fs.writeFileSync(f, fixed, 'utf8')
    n++
    console.log(path.relative(root, f))
  }
}
console.log(`Fixed ${n} files.`)
