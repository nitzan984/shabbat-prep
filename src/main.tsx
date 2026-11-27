import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { consumeInviteLink } from './hooks/useFamily'
import { initPwa } from './lib/pwa'
import { removeKey } from './lib/storage'
import './styles.css'

// הרשימות עברו לשרת: מנקים את העותקים המקומיים מהגרסה הראשונה
;['tasks', 'checklist', 'recipes'].forEach(removeKey)
consumeInviteLink()
initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
