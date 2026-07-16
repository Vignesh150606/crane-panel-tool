import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'

// Separate from projectStore on purpose — this tracks training/practice
// progress (Panel Explorer, Challenge Mode, Virtual Commissioning), a
// different domain from the engineering data a real design produces.
// Keeping them apart means resetting a project (projectStore.resetProject)
// doesn't wipe out a learner's practice history, and vice versa.
export const useTrainingStore = create(
  persist(
    (set) => ({
      viewedComponents: [],      // Panel Explorer — component ids opened at least once
      challengeResults: {},      // { [faultId]: { solved, bestScore, attempts, hintsUsed } }
      commissioningRuns: [],     // [{ completedAt, score, maxScore, itemResults: {[itemId]: 'pass'|'fail'|'missed'} }]

      markComponentViewed: (id) => set((s) => (
        s.viewedComponents.includes(id) ? s : { viewedComponents: [...s.viewedComponents, id] }
      )),

      recordChallengeResult: (faultId, { solved, score, hintsUsed }) => set((s) => {
        const prev = s.challengeResults[faultId] || { solved: false, bestScore: 0, attempts: 0, hintsUsed: 0 }
        return {
          challengeResults: {
            ...s.challengeResults,
            [faultId]: {
              solved: prev.solved || solved,
              bestScore: Math.max(prev.bestScore, score),
              attempts: prev.attempts + 1,
              hintsUsed: solved ? hintsUsed : prev.hintsUsed,
            },
          },
        }
      }),

      recordCommissioningRun: (run) => set((s) => ({
        commissioningRuns: [{ ...run, completedAt: new Date().toISOString() }, ...s.commissioningRuns].slice(0, 10),
      })),

      resetTraining: () => set({ viewedComponents: [], challengeResults: {}, commissioningRuns: [] }),
    }),
    {
      name: 'crane-panel-training-v1',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn('Training progress could not be restored, starting fresh.', error)
      },
    }
  )
)

/** Summary stats used by the Dashboard and Project Report cross-links. */
export function trainingSummary(state) {
  const challengeIds = Object.keys(state.challengeResults)
  const solvedCount = challengeIds.filter((id) => state.challengeResults[id].solved).length
  const lastCommissioning = state.commissioningRuns[0] || null
  return {
    componentsViewed: state.viewedComponents.length,
    challengesSolved: solvedCount,
    challengesAttempted: challengeIds.length,
    lastCommissioningScore: lastCommissioning ? lastCommissioning.score : null,
    lastCommissioningMax: lastCommissioning ? lastCommissioning.maxScore : null,
  }
}
