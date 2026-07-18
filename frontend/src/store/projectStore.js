import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'


const initialProject = {
  name: '',
  engineer: '',
  college: '',
  date: '',
  notes: '',
}

export const useProjectStore = create(
  persist(
    (set, get) => ({
      project: initialProject,
      craneType: null,        // crane type id chosen in Crane Selector
      motorInputs: null,      // last inputs submitted to Load Calculator
      motors: null,           // last /api/motor response { hoist, lt, ct }
      nameplate: null,        // { inputs, result } from Nameplate Calculator
      cableBusbar: null,      // { inputs, result } from Cable/Busbar page
      starDelta: null,        // { inputs, result } from Star-Delta page
      bom: null,              // { inputs, result } from BOM Generator

      setProject: (patch) => set({ project: { ...get().project, ...patch } }),
      setCraneType: (id) => set({ craneType: id }),
      setMotors: (inputs, result) => set({ motorInputs: inputs, motors: result }),
      setNameplate: (inputs, result) => set({ nameplate: { inputs, result } }),
      setCableBusbar: (inputs, result) => set({ cableBusbar: { inputs, result } }),
      setStarDelta: (inputs, result) => set({ starDelta: { inputs, result } }),
      setBOM: (inputs, result) => set({ bom: { inputs, result } }),

      // Which workflow steps have data — drives the sidebar's step checkmarks
      // and the ProjectStatusBar completion LEDs.
      completedSteps: () => {
        const s = get()
        return {
          crane: !!s.craneType,
          load: !!s.motors,
          cable: !!s.cableBusbar,
          circuit: !!s.starDelta,
          bom: !!s.bom,
        }
      },

      resetProject: () => set({
        project: initialProject, craneType: null, motorInputs: null, motors: null,
        nameplate: null, cableBusbar: null, starDelta: null, bom: null,
      }),
    }),
    {
      name: 'crane-panel-project-v2',
      storage: createJSONStorage(() => safeStorage),
      // If persisted state is ever corrupt/unreadable, don't crash — just start fresh.
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn('Project state could not be restored, starting fresh.', error)
      },
    }
  )
)

/** A pick of the strongest available FLC figure across whatever's in the store, for prefill convenience. */
export function pickAvailableFLC(state) {
  if (state.nameplate?.result?.flc) return state.nameplate.result.flc
  if (state.motors?.motors?.hoist?.flc) return state.motors.motors.hoist.flc
  return null
}
