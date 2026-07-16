import { create } from 'zustand'

/**
 * Some pages have meaningful "current state" that lives in local component
 * state, not projectStore/trainingStore — e.g. which push-buttons are
 * currently held on the Control Circuit page, or which fault is loaded in
 * Challenge Mode. Rather than have contextBuilder.js reach into every
 * page's internals, each page publishes a short plain-English summary of
 * its own state here (see usePublishTutorContext below), and
 * contextBuilder.js just reads whatever's currently published.
 *
 * `kind` says which TutorContext field the summary belongs in —
 * 'simulation' | 'challenge' | 'commissioning' — since a few different
 * pages use this same mechanism for different context fields.
 */
export const usePageContextStore = create((set) => ({
  kind: null,
  summary: null,
  focusedTopicId: null,
  focusedTopicTitle: null,

  setPageContext: (kind, summary, focused) => set({
    kind,
    summary,
    focusedTopicId: focused?.id ?? null,
    focusedTopicTitle: focused?.title ?? null,
  }),
  clearPageContext: () => set({ kind: null, summary: null, focusedTopicId: null, focusedTopicTitle: null }),
}))
