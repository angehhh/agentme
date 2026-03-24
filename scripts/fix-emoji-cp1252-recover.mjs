import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const iconv = require('iconv-lite')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function buildRev() {
  const rev = new Map()
  for (let b = 0; b < 256; b++) {
    const ch = iconv.decode(Buffer.from([b]), 'windows1252')
    const cp = ch.codePointAt(0)
    if (!rev.has(cp)) rev.set(cp, b)
  }
  for (let b = 0x80; b <= 0x9f; b++) {
    if (!rev.has(b)) rev.set(b, b)
  }
  return rev
}

const rev = buildRev()
const encUtf8 = new TextEncoder()

function tryRecover(s) {
  const bytes = []
  for (const ch of s) {
    const c = ch.codePointAt(0)
    if (c < 128) {
      bytes.push(c)
      continue
    }
    const b = rev.get(c)
    if (b !== undefined) {
      bytes.push(b)
      continue
    }
    for (const x of encUtf8.encode(ch)) bytes.push(x)
  }
  try {
    const out = Buffer.from(bytes).toString('utf8')
    if (out === s) return null
    if (![...out].every((ch) => {
      const cp = ch.codePointAt(0)
      return (cp >= 0x20 && cp !== 0x7f) || cp === 0x09 || cp === 0x0a
    })) return null
    return out
  } catch {
    return null
  }
}

function shouldAttemptRecover(s) {
  if (s.includes('\u00f0')) return true
  if (s.includes('\u0178') || s.includes('\u0152') || s.includes('\u0153')) return true
  if (s.includes('\u00e2') && (s.includes('\u20ac') || s.includes('\u201c') || s.includes('\u201d')))
    return true
  if (s.includes('\u00e2') && (s.includes('\u0153') || s.includes('\u02dc') || s.includes('\u2030')))
    return true
  return false
}

function fixFileContent(content) {
  return content.replace(/'([^'\\]|\\.)*'/gs, (m) => {
    const inner = m.slice(1, -1)
    const unescaped = inner.replace(/\\(.)/g, '$1')
    if (!shouldAttemptRecover(unescaped)) return m
    const r = tryRecover(unescaped)
    if (!r) return m
    const escaped = r.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `'${escaped}'`
  })
}

const exts = new Set(['.ts', '.tsx'])
const skipDirs = new Set(['node_modules', '.next', '.git'])

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
const proxyTs = path.join(root, 'proxy.ts')
if (fs.existsSync(proxyTs)) files.push(proxyTs)

let n = 0
for (const f of files) {
  const raw = fs.readFileSync(f, 'utf8')
  const fixed = fixFileContent(raw)
  if (fixed !== raw) {
    fs.writeFileSync(f, fixed, 'utf8')
    n++
    console.log(path.relative(root, f))
  }
}
console.log(`Emoji recover touched ${n} files.`)
