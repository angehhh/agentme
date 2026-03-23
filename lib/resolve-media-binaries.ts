/**
 * Rutas a yt-dlp y FFmpeg resueltas con process.cwd() para que funcionen
 * cuando Next/Turbopack empaqueta dependencias (evita __dirname → \\ROOT\\… y ENOENT).
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'
import ffmpegStatic from 'ffmpeg-static'

function findOnPath(executable: string): string | null {
  try {
    const isWin = process.platform === 'win32'
    const cmd = isWin ? `where.exe ${executable}` : `which ${executable}`
    const out = execSync(cmd, { encoding: 'utf8', windowsHide: true }).trim()
    const first = out.split(/\r?\n/).map(l => l.trim()).find(Boolean)
    if (first && existsSync(first)) return first
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Ruta al ejecutable yt-dlp (o youtube-dl).
 * Prioridad: YT_DLP_PATH → node_modules/youtube-dl-exec/bin → PATH.
 */
export function resolveYtDlpExecutable(): string {
  const fromEnv = process.env.YT_DLP_PATH?.trim() || process.env.YOUTUBE_DL_PATH?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv

  const inProject = path.join(
    process.cwd(),
    'node_modules',
    'youtube-dl-exec',
    'bin',
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
  )
  if (existsSync(inProject)) return inProject

  const fromPath =
    findOnPath('yt-dlp') ||
    (process.platform === 'win32' ? findOnPath('yt-dlp.exe') : null)
  if (fromPath) return fromPath

  throw new Error(
    'No se encontró yt-dlp. Opciones: (1) En la carpeta del proyecto ejecuta `npm install`. ' +
      '(2) Instala yt-dlp en el sistema y asegúrate de que esté en el PATH. ' +
      '(3) Define YT_DLP_PATH con la ruta completa al ejecutable (ej. C:\\\\bin\\\\yt-dlp.exe).',
  )
}

/**
 * Ruta al binario FFmpeg.
 * Prioridad: FFMPEG_BIN → node_modules/ffmpeg-static → import del paquete.
 */
export function resolveFfmpegPath(): string {
  const fromEnv = process.env.FFMPEG_BIN?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv

  const inProject = path.join(
    process.cwd(),
    'node_modules',
    'ffmpeg-static',
    process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg',
  )
  if (existsSync(inProject)) return inProject

  if (ffmpegStatic && typeof ffmpegStatic === 'string' && existsSync(ffmpegStatic)) {
    return ffmpegStatic
  }

  const fromPath =
    findOnPath('ffmpeg') || (process.platform === 'win32' ? findOnPath('ffmpeg.exe') : null)
  if (fromPath) return fromPath

  throw new Error(
    'No se encontró FFmpeg. Define FFMPEG_BIN, o ejecuta `npm install` en la raíz del proyecto, ' +
      'o instala ffmpeg en el PATH.',
  )
}
