interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  /** מפתח publishable: ציבורי מטבעו. ההגנה היא קוד המשפחה ו־RLS. */
  readonly VITE_SUPABASE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
