import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'

const MAX_RECENT = 6

export const useHandbookStore = create(
  persist(
    (set, get) => ({
      bookmarks: [], // array of topic ids
      recent: [], // array of topic ids, most-recent-first

      isBookmarked: (id) => get().bookmarks.includes(id),
      toggleBookmark: (id) => {
        const { bookmarks } = get()
        set({
          bookmarks: bookmarks.includes(id) ? bookmarks.filter((b) => b !== id) : [...bookmarks, id],
        })
      },

      pushRecentTopic: (id) => {
        const next = [id, ...get().recent.filter((r) => r !== id)].slice(0, MAX_RECENT)
        set({ recent: next })
      },
    }),
    {
      name: 'crane-tool-handbook-prefs',
      storage: createJSONStorage(() => safeStorage),
    }
  )
)
