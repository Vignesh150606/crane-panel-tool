import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'

const MAX_RECENT = 3

// Sidebar collapse preference + a short "recently visited" trail, persisted
// the same way tierStore persists the explanation tier. Icons/components
// can't survive JSON serialization, so `recent` stores {path, label} only —
// the icon is re-looked-up from navigation.js at render time.
export const useUIStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),

      recent: [],
      pushRecent: (path, label) => {
        if (path === '/') return // visiting Home isn't worth tracking
        const next = [{ path, label }, ...get().recent.filter((r) => r.path !== path)].slice(0, MAX_RECENT)
        set({ recent: next })
      },
    }),
    {
      name: 'crane-tool-ui-prefs',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
