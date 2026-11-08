const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
export async function api(path, { method = 'GET', body, signal } = {}) {
  let response
  try {
    response = await fetch(base + path, {
      method, headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: signal || AbortSignal.timeout(130000),
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Could not reach the server. Check that it is running and try again.', { cause: error })
  }
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.error || 'The request failed. Please try again.')
  if (!data) throw new Error('The server returned an unreadable response.')
  return data
}
