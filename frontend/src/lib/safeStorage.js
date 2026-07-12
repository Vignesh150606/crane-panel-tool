// Wraps localStorage so a private-browsing / storage-disabled environment
// degrades to in-memory-only state instead of throwing and breaking the app.
// Shared by every Zustand `persist` store in this app — do not copy this
// into individual store files; import it instead.
export const safeStorage = {
  getItem: (name) => {
    try { return localStorage.getItem(name) } catch { return null }
  },
  setItem: (name, value) => {
    try { localStorage.setItem(name, value) } catch { /* ignore — falls back to session-only state */ }
  },
  removeItem: (name) => {
    try { localStorage.removeItem(name) } catch { /* ignore */ }
  },
}
