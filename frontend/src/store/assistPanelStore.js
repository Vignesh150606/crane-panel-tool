import { create } from 'zustand'

// mode: null (closed) | 'context' (Theory tab) | 'tutor' (AI Tutor tab).
// There is exactly one drawer in the app now — AssistPanel — and this is
// its only open/closed state, so "context panel and tutor open at once"
// isn't a state that can exist anymore, rather than a rule enforced by
// convention across two separate components.
export const useAssistPanelStore = create((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),
  close: () => set({ mode: null }),
}))
