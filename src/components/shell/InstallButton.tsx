import { promptInstall, useInstallState } from '../../lib/pwa'
import { Icon } from '../ui/Icon'

/** כפתור התקנה (אנדרואיד), הוראות (אייפון), או "כבר מותקן". */
export function InstallButton() {
  const state = useInstallState()

  if (state === 'installed') {
    return <p>האפליקציה מותקנת במכשיר הזה.</p>
  }
  if (state === 'available') {
    return (
      <>
        <p>מתקינים פעם אחת, והאפליקציה נפתחת מהמסך הראשי במסך מלא, גם בלי קליטה.</p>
        <button type="button" className="btn btn--accent btn--wide" onClick={() => void promptInstall()}>
          <Icon name="download" size={22} />
          התקנת האפליקציה
        </button>
      </>
    )
  }
  if (state === 'ios') {
    return <p>באייפון: לוחצים על כפתור השיתוף בספארי, ואז "הוספה למסך הבית".</p>
  }
  return <p>בטלפון אנדרואיד: פותחים את האתר ב־Chrome, ובתפריט (שלוש הנקודות) בוחרים "התקנת אפליקציה".</p>
}
