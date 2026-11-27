interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  /** מפתח publishable: ציבורי מטבעו. ההגנה היא קוד המשפחה ו־RLS. */
  readonly VITE_SUPABASE_KEY: string
}

/** הגרסה שנבנתה, מוזרקת ב־vite.config.ts. */
declare const __APP_BUILD__: { commit: string; builtAt: string; id: string }

interface ImportMeta {
  readonly env: ImportMetaEnv
}
