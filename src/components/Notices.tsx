import { useAnnouncement, useToasts } from '../hooks/useNotices'
import { timerActions, useTimer } from '../hooks/useTimer'
import { Icon } from './ui/Icon'

/** הודעה בולטת כשהטיימר מסתיים. מוצגת גם אם ווידג'ט הטיימר מוסתר. */
export function TimerAlert() {
  const timer = useTimer()
  if (timer.status !== 'done') return null
  return (
    <div className="alarm" role="alertdialog" aria-modal="true" aria-labelledby="alarm-title" aria-describedby="alarm-desc">
      <div className="alarm__card">
        <span className="alarm__bell">
          <Icon name="bell" size={56} />
        </span>
        <h2 id="alarm-title" className="alarm__title">
          הזמן נגמר!
        </h2>
        <p id="alarm-desc" className="alarm__desc">
          {timer.label ? `הטיימר של ${timer.label} הסתיים.` : 'הטיימר הסתיים.'}
        </p>
        {/* דיאלוג התראה: הפוקוס עובר מיד לכפתור העצירה */}
        <button type="button" className="btn btn--xl btn--start" autoFocus onClick={timerActions.dismiss}>
          <Icon name="check" size={30} />
          עצירה
        </button>
      </div>
    </div>
  )
}

export function Toasts() {
  const toasts = useToasts()
  const announcement = useAnnouncement()
  return (
    <>
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <p key={t.id} className="toast">
            <Icon name="check" size={20} />
            {t.message}
          </p>
        ))}
      </div>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </>
  )
}
