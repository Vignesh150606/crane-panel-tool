import { create } from 'zustand'
import { safeStorage } from '../lib/safeStorage'

// The anonymous client id is the primary signal the backend rate-limits
// against (see backend/app/tutor/identity.py) — generated once per
// browser and persisted directly via safeStorage rather than zustand's
// persist middleware, since it's a single primitive value, not a slice of
// state worth wrapping in a persistence envelope.
const CLIENT_ID_KEY = 'crane-tool-tutor-client-id'

function getOrCreateClientId() {
  const existing = safeStorage.getItem(CLIENT_ID_KEY)
  if (existing) return existing
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`
  safeStorage.setItem(CLIENT_ID_KEY, id)
  return id
}

function newMessageId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export const useTutorStore = create((set) => ({
  clientId: getOrCreateClientId(),

  // { id, role: 'user'|'tutor', content, navigation?, refused?, cached? }
  messages: [],

  remaining: null, // null until the first /usage or /ask response arrives
  dailyLimit: 10,
  cooldownSeconds: 15,

  loading: false,
  error: null,

  // The full useTutorContext() object from the last page the user was on
  // that WASN'T /tutor itself, plus when it was captured. AssistPanel keeps
  // this in sync on every render except while actually on /tutor (see its
  // sync effect) — so by the time /tutor mounts, location-based context
  // would be useless (page_path would just be "/tutor"), but this already
  // has the real snapshot from wherever the user came from.
  lastContext: null,
  lastContextAt: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, { id: newMessageId(), ...msg }] })),

  setUsage: ({ remaining_today, daily_limit, cooldown_seconds }) => set((s) => ({
    remaining: remaining_today ?? s.remaining,
    dailyLimit: daily_limit ?? s.dailyLimit,
    cooldownSeconds: cooldown_seconds ?? s.cooldownSeconds,
  })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearConversation: () => set({ messages: [], error: null }),
  setLastContext: (context) => set({ lastContext: context, lastContextAt: Date.now() }),
}))
