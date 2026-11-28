/**
 * שומרים את האפליקציה ערה כשטיימר רץ, כדי שהצליל יתנגן בזמן:
 * - Wake Lock: המסך לא נכבה כל עוד האפליקציה פתוחה.
 * - נגן מדיה שקט בלולאה: באנדרואיד Chrome לא מקפיא דף שמנגן מדיה, גם ברקע או עם מסך נעול.
 *   שמע מדיה לא מושתק במצב שקט (רק צלצולים והתראות מושתקים), ולכן גם הצפצופים נשמעים.
 * את הנגן חייבים להפעיל בתוך לחיצה של המשתמש.
 */

interface WakeLockSentinelLike {
  release: () => Promise<void>
}

let audio: HTMLAudioElement | null = null
let wakeLock: WakeLockSentinelLike | null = null
let active = false

/** קובץ WAV של שנייה כמעט שקטה (רעש זעיר, כדי שהדפדפן יתייחס אליו כמדיה שמתנגנת). */
function quietWavUrl(): string {
  const rate = 8000
  const samples = rate
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const text = (offset: number, s: string) => [...s].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples * 2, true)
  text(8, 'WAVE')
  text(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, samples * 2, true)
  for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, i % 2 ? 1 : -1, true)
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

async function requestWakeLock() {
  if (!active || wakeLock || document.visibilityState !== 'visible') return
  try {
    const nav = navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } }
    wakeLock = (await nav.wakeLock?.request('screen')) ?? null
  } catch {
    // סוללה חלשה או דפדפן שלא תומך
  }
}

if (typeof document !== 'undefined') {
  // Wake Lock משתחרר כשיוצאים מהאפליקציה: מבקשים שוב כשחוזרים
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      wakeLock = null
      void requestWakeLock()
    }
  })
}

/** בתוך לחיצה: מפעיל את נגן המדיה השקט (דרישת הדפדפן). */
export function primeKeepAlive() {
  try {
    audio ??= Object.assign(new Audio(quietWavUrl()), { loop: true })
    void audio.play().catch(() => {})
  } catch {
    audio = null
  }
}

export interface KeepAliveInfo {
  title: string
  onPause: () => void
  onPlay: () => void
}

export function startKeepAlive({ title, onPause, onPlay }: KeepAliveInfo) {
  active = true
  void requestWakeLock()
  if (audio?.paused) void audio.play().catch(() => {})
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist: 'מכינים שבת',
      artwork: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    })
    navigator.mediaSession.setActionHandler('pause', onPause)
    navigator.mediaSession.setActionHandler('play', onPlay)
    navigator.mediaSession.playbackState = 'playing'
  }
}

export function stopKeepAlive() {
  active = false
  audio?.pause()
  void wakeLock?.release().catch(() => {})
  wakeLock = null
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = null
    navigator.mediaSession.playbackState = 'none'
  }
}
