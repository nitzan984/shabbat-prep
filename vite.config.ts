/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    // הבדיקות החיות צריכות גם משתנים בלי VITE_ (קוד משפחת הבדיקה)
    env: loadEnv(mode, process.cwd(), ''),
  },
}))
