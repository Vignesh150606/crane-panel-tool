// Backend base URL — set VITE_API_URL in Vercel's project settings to your
// live Render URL (e.g. https://crane-panel-tool.onrender.com). Falls back
// to a local dev server when the env var isn't set.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors || []
  }
}

async function request(path, { method = 'GET', body, timeoutMs = 25000, headers = {} } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new ApiError(
        'The calculation server is taking longer than expected to respond. Free hosting tiers spin down when idle — this can take 30-50s to wake up on the first request. Please try again.',
        0
      )
    }
    throw new ApiError('Could not reach the calculation server. Check your connection, or that the backend URL is configured correctly.', 0)
  }
  clearTimeout(timer)

  let data = null
  try {
    data = await res.json()
  } catch {
    // no/invalid JSON body
  }

  if (!res.ok) {
    const message = data?.detail === 'Validation failed' ? 'Please check the highlighted fields.' : (data?.detail || `Request failed (${res.status})`)
    throw new ApiError(message, res.status, data?.errors)
  }
  return data
}

export const api = {
  get: (path, opts) => request(path, opts),
  post: (path, body, opts) => request(path, { method: 'POST', body, ...opts }),
}
