import { api } from '../api/client'
import { useTutorStore } from './tutorStore'
import { findRelevantExcerpts } from './retrieval'

const CLIENT_ID_HEADER = 'X-Tutor-Client-Id'

function authHeaders() {
  return { [CLIENT_ID_HEADER]: useTutorStore.getState().clientId }
}

/**
 * @param {string} question
 * @param {object} context - from useTutorContext(), without handbook_excerpts
 * @param {{role: 'user'|'tutor', content: string}[]} history
 */
export async function askTutor(question, context, history) {
  const handbookExcerpts = findRelevantExcerpts(question, context.page_path)
  const fullContext = { ...context, handbook_excerpts: handbookExcerpts }

  const trimmedHistory = history
    .slice(-8)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

  return api.post('/api/tutor/ask', { question, context: fullContext, history: trimmedHistory }, { headers: authHeaders() })
}

export async function fetchTutorUsage() {
  return api.get('/api/tutor/usage', { headers: authHeaders() })
}
