import type { FormEvent } from 'react'
import { useNow } from '../../hooks/useNow'
import { canAdjust, remainingMs, timerActions, useTimer } from '../../hooks/useTimer'
import { formatClock, formatMinutes } from '../../lib/time'
import { Icon } from '../ui/Icon'

const PRESETS = [5, 10, 15, 20, 30, 45, 60, 90]
const ADJUSTMENTS = [-5, -1, 1, 5]
const RADIUS = 104
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const STATUS_TEXT = { idle: 'מוכן', running: 'פועל', paused: 'מושהה', done: 'הזמן נגמר!' } as const

export function TimerWidget() {
  const timer = useTimer()
  // רק בזמן ריצה צריך שעון חי
  const now = useNow(timer.status === 'running' ? 250 : null)
  const left = remainingMs(timer, now)
  const progress = timer.durationMs > 0 ? left / timer.durationMs : 0
  const running = timer.status === 'running'

  const submitCustom = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const input = event.currentTarget.elements.namedItem('minutes') as HTMLInputElement
    const minutes = Number(input.value)
    if (!Number.isFinite(minutes) || minutes <= 0) return
    timerActions.startMinutes(Math.round(minutes))
    input.value = ''
  }

  return (
    <div className="timer">
      <div className="timer__ring">
        <svg viewBox="0 0 240 240" aria-hidden="true">
          <circle className="timer__track" cx="120" cy="120" r={RADIUS} />
          <circle
            className="timer__progress"
            cx="120"
            cy="120"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>
        <div className="timer__center">
          {timer.label && <span className="timer__label">{timer.label}</span>}
          <span className="timer__time" role="timer" aria-label={`זמן שנותר: ${formatClock(left)}`}>
            {formatClock(left)}
          </span>
          <span className="timer__status" aria-live="polite">
            {STATUS_TEXT[timer.status]}
          </span>
        </div>
      </div>

      <div className="timer__main">
        <button
          type="button"
          id="timer-start"
          className={`btn btn--xl ${running ? 'btn--pause' : 'btn--start'}`}
          onClick={running ? timerActions.pause : timerActions.start}
          disabled={!running && timer.status !== 'paused' && timer.durationMs === 0}
        >
          <Icon name={running ? 'pause' : 'play'} size={30} />
          {running ? 'השהיה' : timer.status === 'paused' ? 'המשך' : 'התחלה'}
        </button>
        <button type="button" className="btn btn--xl btn--reset" onClick={timerActions.reset}>
          <Icon name="reset" size={30} />
          איפוס
        </button>
      </div>

      <div className="timer__adjust" role="group" aria-label="שינוי הזמן">
        {ADJUSTMENTS.map((delta) => (
          <button
            key={delta}
            type="button"
            className="btn btn--soft"
            aria-label={delta > 0 ? `הוספת ${Math.abs(delta)} דקות` : `הורדת ${Math.abs(delta)} דקות`}
            disabled={!canAdjust(timer, now, delta)}
            onClick={() => timerActions.adjust(delta)}
          >
            <span dir="ltr">{delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}</span>
          </button>
        ))}
      </div>

      <div className="timer__presets" role="group" aria-label="זמנים מהירים: מכוונים ומתחילים">
        {PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className="chip-btn"
            onClick={() => timerActions.startMinutes(minutes)}
          >
            {formatMinutes(minutes)}
          </button>
        ))}
      </div>

      <form className="inline-form" onSubmit={submitCustom}>
        <label htmlFor="timer-custom" className="inline-form__label">
          זמן חופשי (דקות)
        </label>
        <div className="inline-form__row">
          <input
            id="timer-custom"
            name="minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            placeholder="למשל 25"
            className="input"
          />
          <button type="submit" className="btn btn--primary">
            <Icon name="play" size={20} />
            הפעלה
          </button>
        </div>
      </form>
    </div>
  )
}
