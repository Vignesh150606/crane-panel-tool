import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'

const VALID_TIERS = ['basic', 'intermediate', 'industrial', 'expert']

// One shared tier selection for every FormulaExplainer instance across the
// whole app, persisted so it survives a page reload. Previously each
// FormulaExplainer held its own `useState('basic')`, so picking Expert on
// one calculator had no effect on any other explainer, on that page or any
// other — reopening a page (or even scrolling to the next explainer block)
// silently reset back to Basic every time.
export const useTierStore = create(
  persist(
    (set) => ({
      tier: 'basic',
      setTier: (tier) => set({ tier: VALID_TIERS.includes(tier) ? tier : 'basic' }),
    }),
    {
      name: 'crane-tool-explanation-tier',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
