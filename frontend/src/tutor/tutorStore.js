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

  open: false,
  // { id, role: 'user'|'tutor', content, navigation?, refused?, cached? }
  messages: [],

  remaining: null, // null until the first /usage or /ask response arrives
  dailyLimit: 10,
  cooldownSeconds: 15,

  loading: false,
  error: null,

  setOpen: (open) => set({ open }),
  toggleOpen: () => set((s) => ({ open: !s.open })),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, { id: newMessageId(), ...msg }] })),

  setUsage: ({ remaining_today, daily_limit, cooldown_seconds }) => set((s) => ({
    remaining: remaining_today ?? s.remaining,
    dailyLimit: daily_limit ?? s.dailyLimit,
    cooldownSeconds: cooldown_seconds ?? s.cooldownSeconds,
  })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearConversation: () => set({ messages: [], error: null }),
}))
