/**
 * Vercel Cron, פעם ביום: פנייה קטנה ל־Supabase כדי שהפרויקט החינמי לא יושהה
 * (Supabase משהה פרויקט חינמי אחרי 7 ימים בלי פעילות).
 */
export async function GET(): Promise<Response> {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_KEY
  if (!url || !key) return Response.json({ ok: false, reason: 'missing env' }, { status: 500 })
  const response = await fetch(`${url}/rest/v1/rpc/family_name`, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: '{}',
  })
  return Response.json({ ok: response.ok, status: response.status }, { status: response.ok ? 200 : 502 })
}
