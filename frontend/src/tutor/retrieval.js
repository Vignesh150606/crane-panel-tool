import { HANDBOOK_SECTIONS, PROTECTION_GLOSSARY } from '../data/handbookContent'
import { getRelatedTopics } from '../data/workspaceIndex'

const ALL_TOPICS = HANDBOOK_SECTIONS.flatMap((section) =>
  section.topics.map((t) => ({ ...t, sectionTitle: section.title }))
)

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'this', 'that', 'why', 'what',
  'how', 'do', 'does', 'did', 'i', 'my', 'me', 'to', 'of', 'in', 'on', 'for',
  'and', 'or', 'it', 'be', 'can', 'could', 'would', 'should', 'here',
])

function terms(text) {
  return (text.toLowerCase().match(/[a-z0-9%-]+/g) || []).filter((w) => w.length > 1 && !STOPWORDS.has(w))
}

function score(topic, questionTerms) {
  const haystack = terms([
    topic.title, topic.equation || '', topic.meaning || '',
    ...(topic.commonMistakes || []),
  ].join(' '))
  const haystackSet = new Set(haystack)
  let hits = 0
  for (const t of questionTerms) if (haystackSet.has(t)) hits += 1
  return hits
}

function toExcerpt(topic) {
  return {
    id: topic.id,
    title: topic.title,
    section_title: topic.sectionTitle,
    equation: topic.equation || null,
    meaning: topic.meaning || null,
    common_mistakes: topic.commonMistakes || [],
  }
}

/**
 * Finds up to `limit` handbook topics relevant to the current question,
 * always including the topic(s) already tied to the current page (so the
 * tutor stays grounded even for vague questions like "explain this"),
 * then filling remaining slots with the best keyword matches elsewhere in
 * the handbook.
 */
export function findRelevantExcerpts(question, pagePath, limit = 4) {
  const pageTopics = getRelatedTopics(pagePath)
  const questionTerms = terms(question)

  const scored = ALL_TOPICS
    .filter((t) => !pageTopics.some((pt) => pt.id === t.id))
    .map((t) => ({ topic: t, score: score(t, questionTerms) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)

  const picked = [
    ...pageTopics.slice(0, 2),
    ...scored.slice(0, limit).map((s) => s.topic),
  ].slice(0, limit)

  return picked.map(toExcerpt)
}

/** A glossary hit, if the question is plausibly asking to define a term. */
export function findGlossaryMatch(question) {
  const q = question.toLowerCase()
  return PROTECTION_GLOSSARY.find((g) => {
    const term = g.term.toLowerCase()
    return q.includes(term) && (q.includes('what') || q.includes('define') || q.includes('mean') || q.includes('stand for'))
  }) || null
}
