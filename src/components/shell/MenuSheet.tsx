import { useState, type Ref } from 'react'
import { inviteLink, leaveFamily, useFamily } from '../../hooks/useFamily'
import { showToast } from '../../hooks/useNotices'
import { applyUpdate, checkForUpdate, currentBuild, formatBuildTime, useUpdateAvailable } from '../../lib/update'
import { FamilyGate } from '../FamilyGate'
import { Icon } from '../ui/Icon'
import { InstallButton } from './InstallButton'

async function shareInvite(code: string) {
  const url = inviteLink(code)
  const text = 'הצטרפות לרשימות של המשפחה במכינים שבת'
  try {
    if (navigator.share) {
      await navigator.share({ title: 'מכינים שבת', text, url })
      return
    }
    await navigator.clipboard.writeText(url)
    showToast('קישור ההזמנה הועתק')
  } catch {
    // המשתמש סגר את חלון השיתוף
  }
}

/** גיליון הגדרות: חיבור למשפחה, שיתוף קישור הזמנה, התקנת האפליקציה והגרסה. */
export function MenuSheet({ ref }: { ref: Ref<HTMLDialogElement> }) {
  const family = useFamily()

  const leave = () => {
    if (!window.confirm('להתנתק מהרשימות של המשפחה במכשיר הזה?')) return
    leaveFamily()
    showToast('המכשיר התנתק מהרשימות')
  }

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="menu-title" closedby="any">
      <div className="sheet__head">
        <h2 id="menu-title" className="sheet__title">
          הגדרות
        </h2>
        <form method="dialog">
          <button type="submit" className="icon-btn" aria-label="סגירה">
            <Icon name="close" />
          </button>
        </form>
      </div>

      <section className="sheet__section" aria-labelledby="menu-family">
        <h3 id="menu-family" className="sheet__subtitle">
          <Icon name="users" size={22} />
          הרשימות של המשפחה
        </h3>
        {family.code ? (
          <>
            <p>
              המכשיר מחובר לרשימות של <strong>{family.name ?? 'המשפחה'}</strong>. כל שינוי מגיע לכל המכשירים תוך כמה שניות.
            </p>
            <div className="sheet__actions">
              <button type="button" className="btn btn--primary" onClick={() => void shareInvite(family.code!)}>
                <Icon name="share" size={20} />
                שליחת קישור הזמנה
              </button>
              <button type="button" className="btn btn--ghost" onClick={leave}>
                התנתקות
              </button>
            </div>
          </>
        ) : (
          <FamilyGate />
        )}
      </section>

      <section className="sheet__section" aria-labelledby="menu-install">
        <h3 id="menu-install" className="sheet__subtitle">
          <Icon name="phone" size={22} />
          אפליקציה בטלפון
        </h3>
        <InstallButton />
      </section>

      <VersionSection />
    </dialog>
  )
}

/** הגרסה שרצה במכשיר, ובדיקת עדכון ידנית. */
function VersionSection() {
  const updateAvailable = useUpdateAvailable()
  const [checking, setChecking] = useState(false)

  const check = async () => {
    setChecking(true)
    const found = await checkForUpdate()
    setChecking(false)
    if (!found) showToast('זו הגרסה העדכנית')
  }

  return (
    <section className="sheet__section" aria-labelledby="menu-version">
      <h3 id="menu-version" className="sheet__subtitle">
        <Icon name="refresh" size={22} />
        גרסה
      </h3>
      <p>
        גרסה <bdi className="version-id">{currentBuild.commit}</bdi> · עודכנה {formatBuildTime(currentBuild.builtAt)}
      </p>
      {updateAvailable ? (
        <button type="button" className="btn btn--accent btn--wide" onClick={applyUpdate}>
          <Icon name="refresh" size={22} />
          יש גרסה חדשה: רענון
        </button>
      ) : (
        <div className="sheet__actions">
          <button type="button" className="btn btn--soft" disabled={checking} onClick={() => void check()}>
            {checking ? 'בודקים…' : 'בדיקת עדכונים'}
          </button>
        </div>
      )}
    </section>
  )
}
