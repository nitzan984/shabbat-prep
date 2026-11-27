/// <reference types="vitest/config" />
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** מזהה הגרסה: ה־commit (ב־Vercel מהמשתנה, מקומית מ־git) ושעת הבנייה. */
function buildInfo() {
  let commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7)
  if (!commit) {
    try {
      commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim()
    } catch {
      commit = 'dev'
    }
  }
  const builtAt = new Date().toISOString()
  return { commit, builtAt, id: `${commit}-${builtAt}` }
}

/** כותב version.json לצד הקבצים, כדי שאפליקציה פתוחה תדע שיצאה גרסה חדשה. */
function versionFile(info: ReturnType<typeof buildInfo>): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify(info) })
    },
  }
}

export default defineConfig(({ mode }) => {
  const info = buildInfo()
  return {
    plugins: [react(), versionFile(info)],
    define: {
      __APP_BUILD__: JSON.stringify(info),
    },
    test: {
      // הבדיקות החיות צריכות גם משתנים בלי VITE_ (קוד משפחת הבדיקה)
      env: loadEnv(mode, process.cwd(), ''),
    },
  }
})
