import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const node = process.execPath

function run(script) {
  const r = spawnSync(node, [path.join(__dirname, script)], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  })
  if (r.status !== 0) process.exit(r.status ?? 1)
}

run('fix-utf8-mojibake.mjs')
run('fix-emoji-cp1252-recover.mjs')
console.log('Encoding pass complete.')
