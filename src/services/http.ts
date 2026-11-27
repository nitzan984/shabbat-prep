export class HttpError extends Error {
  readonly status: number

  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`)
    this.name = 'HttpError'
    this.status = status
  }
}

/** fetch של JSON עם טיפוס. הטיפוס מתאר את מבנה התגובה כפי שנבדק מול ה־API האמיתי. */
export async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new HttpError(response.status, url)
  return (await response.json()) as T
}

export function buildUrl(base: string, params: Record<string, string | number>): string {
  const url = new URL(base)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, String(value)))
  return url.toString()
}
