/**
 * צליל סיום הטיימר עם Web Audio.
 * הצפצופים מתוזמנים מראש על שעון ה־AudioContext, כך שהם מתנגנים בזמן
 * גם כשהטאב ברקע ו־setTimeout מואט.
 */

let ctx: AudioContext | null = null
let scheduled: OscillatorNode[] = []

/** חייב לקרות בתוך לחיצה של המשתמש (דרישה של iOS ו־Chrome). */
export function unlockAudio() {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    ctx = null
  }
}

function beep(at: number, duration: number, frequency: number) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'triangle'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(0.5, at + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + duration + 0.05)
  scheduled.push(osc)
}

/** מתזמן כ־20 שניות של צפצופים החל מ־atEpochMs. מחזיר false אם השמע עדיין נעול. */
export function scheduleAlarm(atEpochMs: number): boolean {
  cancelAlarm()
  if (!ctx || ctx.state !== 'running') return false
  const start = ctx.currentTime + Math.max(0, (atEpochMs - Date.now()) / 1000)
  for (let round = 0; round < 12; round++) {
    const t = start + round * 1.6
    beep(t, 0.18, 880)
    beep(t + 0.25, 0.18, 880)
    beep(t + 0.5, 0.35, 1175)
  }
  return true
}

export function cancelAlarm() {
  scheduled.forEach((osc) => {
    try {
      osc.stop()
      osc.disconnect()
    } catch {
      // כבר הסתיים
    }
  })
  scheduled = []
}

/** בלחיצה הראשונה על טיימר: מבקשים רשות להתראות (פעם אחת). */
export function requestNotifyPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission()
  } catch {
    // דפדפן בלי התראות
  }
}

const NOTIFY_TAG = 'timer-done'

/** התראה על מסך הנעילה כשהטיימר נגמר והאפליקציה לא מול העיניים. */
export async function notifyDone(label: string | null) {
  try {
    if (document.visibilityState === 'visible' || !('Notification' in window) || Notification.permission !== 'granted') return
    const registration = await navigator.serviceWorker?.getRegistration()
    const options: NotificationOptions & { vibrate?: number[]; renotify?: boolean } = {
      body: label ? `הטיימר של ${label} הסתיים.` : 'הטיימר הסתיים.',
      tag: NOTIFY_TAG,
      renotify: true,
      requireInteraction: true,
      icon: '/icons/icon-192.png',
      vibrate: [400, 200, 400, 200, 800],
    }
    if (registration) await registration.showNotification('הזמן נגמר! ⏰', options)
    else new Notification('הזמן נגמר! ⏰', options)
  } catch {
    // בלי התראה: הצליל והרטט עדיין פועלים
  }
}

export async function clearDoneNotification() {
  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    const list = (await registration?.getNotifications({ tag: NOTIFY_TAG })) ?? []
    list.forEach((n) => n.close())
  } catch {
    // אין מה לסגור
  }
}

export function vibrate() {
  try {
    navigator.vibrate?.([400, 200, 400, 200, 800])
  } catch {
    // אין רטט במכשיר
  }
}
