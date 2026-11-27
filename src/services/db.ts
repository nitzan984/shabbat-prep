import { SUPABASE } from '../config'
import { HttpError } from './http'

/**
 * לקוח קטן ל־PostgREST של Supabase, בלי ספריה.
 * כל בקשה נושאת את קוד המשפחה בכותרת x-family-code, ו־RLS במסד מחליט מה מותר.
 */

interface DbOptions {
  code: string
  signal?: AbortSignal
}

/** שורה עם מזהה, כפי שהיא חוזרת מ־PostgREST */
export interface Row {
  id: string
}

export const isDbConfigured = () => SUPABASE.url !== '' && SUPABASE.key !== ''

function headers(code: string, write = false): HeadersInit {
  return {
    apikey: SUPABASE.key,
    'x-family-code': code,
    Accept: 'application/json',
    ...(write ? { 'Content-Type': 'application/json', Prefer: 'return=minimal' } : {}),
  }
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const url = `${SUPABASE.url}/rest/v1/${path}`
  const response = await fetch(url, init)
  if (!response.ok) throw new HttpError(response.status, url)
  return response
}

export async function dbSelect<T>(table: string, query: string, { code, signal }: DbOptions): Promise<T[]> {
  const response = await send(`${table}?${query}`, { headers: headers(code), signal })
  return (await response.json()) as T[]
}

export async function dbInsert(table: string, rows: object | object[], { code, signal }: DbOptions): Promise<void> {
  await send(table, { method: 'POST', headers: headers(code, true), body: JSON.stringify(rows), signal })
}

/** עדכון לפי פילטר של PostgREST, למשל `id=eq.<uuid>` או `done=eq.true`. */
export async function dbUpdate(table: string, filter: string, patch: object, { code, signal }: DbOptions): Promise<void> {
  await send(`${table}?${filter}`, { method: 'PATCH', headers: headers(code, true), body: JSON.stringify(patch), signal })
}

export async function dbDelete(table: string, filter: string, { code, signal }: DbOptions): Promise<void> {
  await send(`${table}?${filter}`, { method: 'DELETE', headers: headers(code, true), signal })
}

export async function dbRpc<T>(fn: string, args: object, { code, signal }: DbOptions): Promise<T> {
  const response = await send(`rpc/${fn}`, {
    method: 'POST',
    headers: { ...headers(code), 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    signal,
  })
  return (await response.json()) as T
}
