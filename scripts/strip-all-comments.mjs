import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const exts = new Set(['.ts', '.tsx', '.js', '.jsx'])
const skipDirs = new Set(['node_modules', '.next', '.git'])

function scriptKind(filePath) {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX
  if (filePath.endsWith('.ts')) return ts.ScriptKind.TS
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX
  return ts.ScriptKind.JS
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

function stripFile(absPath) {
  const content = fs.readFileSync(absPath, 'utf8')
  const kind = scriptKind(absPath)
  const sf = ts.createSourceFile(absPath, content, ts.ScriptTarget.Latest, true, kind)
  const printer = ts.createPrinter({
    removeComments: true,
    newLine: ts.NewLineKind.LineFeed,
  })
  let out = printer.printFile(sf)
  if (content.startsWith("'use client'") || content.startsWith('"use client"')) {
    const first = content.split(/\r?\n/)[0]
    if (!out.trimStart().startsWith("'use client'") && !out.trimStart().startsWith('"use client"')) {
      out = first + '\n\n' + out.trimStart()
    }
  }
  if (out !== content) fs.writeFileSync(absPath, out, 'utf8')
  return out !== content
}

const dirs = [path.join(root, 'app'), path.join(root, 'lib')]
const scriptsDir = path.join(root, 'scripts')
if (fs.existsSync(scriptsDir)) dirs.push(scriptsDir)

const files = [...dirs.flatMap((d) => walk(d))]
const nextCfg = path.join(root, 'next.config.ts')
if (fs.existsSync(nextCfg)) files.push(nextCfg)

let n = 0
for (const f of files) {
  try {
    if (stripFile(f)) {
      n++
      console.log(path.relative(root, f))
    }
  } catch (e) {
    console.error('skip', path.relative(root, f), e.message)
  }
}
console.log(`Updated ${n} files.`)
