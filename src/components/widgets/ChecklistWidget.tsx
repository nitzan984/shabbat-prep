import { checklistActions, countDone, useChecklist } from '../../hooks/useCheckList'
import { showToast } from '../../hooks/useNotices'
import { Icon } from '../ui/Icon'
import { ItemList } from './ItemList'

export function ChecklistWidget() {
  const items = useChecklist()
  const done = countDone(items)

  const reset = () => {
    checklistActions.uncheckAll()
    showToast('הרשימה אופסה לשבת הבאה')
  }

  return (
    <>
      <p className="widget-intro">הרשימה נשמרת משבוע לשבוע. מסמנים מה מוכן, ובמוצאי שבת מאפסים.</p>
      <ItemList
        idPrefix="check"
        items={items}
        actions={checklistActions}
        inputLabel="פריט חדש לרשימה הקבועה"
        placeholder="להוסיף לרשימה הקבועה"
        emptyText="הרשימה ריקה. אפשר להוסיף פריטים למעלה."
      />
      <div className="widget-footer">
        <span className="widget-footer__count" aria-live="polite">
          {items.length > 0 && done === items.length ? 'הכל מוכן לשבת!' : `${done} מתוך ${items.length} מוכנים`}
        </span>
        <button type="button" className="btn btn--soft" disabled={done === 0} onClick={reset}>
          <Icon name="reset" size={20} />
          איפוס לשבת הבאה
        </button>
      </div>
    </>
  )
}
