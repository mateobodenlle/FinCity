import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { BuildingType } from '../core/types'

interface TimerPersistedState {
  isRunning: boolean
  isPaused: boolean
  selectedType: BuildingType
  targetMinutes: number
  startTime: number | null      // Timestamp de inicio
  pausedTime: number            // Tiempo acumulado en pausas (ms)
  pauseStartTime: number | null // Timestamp cuando se pausó
}

interface TimerState extends TimerPersistedState {
  // Computed (no persistido)
  elapsedSeconds: number

  // Actions
  setType: (type: BuildingType) => void
  setTargetMinutes: (minutes: number) => void
  start: () => void
  pause: () => void
  resume: () => void
  cancel: () => void
  getElapsedSeconds: () => number
  complete: () => { type: BuildingType; durationMin: number }
}

const STORAGE_KEY = 'fincity-timer'

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      // Persisted state
      isRunning: false,
      isPaused: false,
      selectedType: 'osix',
      targetMinutes: 25,
      startTime: null,
      pausedTime: 0,
      pauseStartTime: null,

      // Computed (will be updated by tick)
      elapsedSeconds: 0,

      setType: (type) => {
        const { isRunning } = get()
        if (!isRunning) {
          set({ selectedType: type })
        }
      },

      setTargetMinutes: (minutes) => {
        const { isRunning } = get()
        if (!isRunning) {
          set({ targetMinutes: minutes })
        }
      },

      start: () => set({
        isRunning: true,
        isPaused: false,
        startTime: Date.now(),
        pausedTime: 0,
        pauseStartTime: null,
        elapsedSeconds: 0
      }),

      pause: () => set({
        isPaused: true,
        pauseStartTime: Date.now()
      }),

      resume: () => {
        const { pauseStartTime, pausedTime } = get()
        const additionalPausedTime = pauseStartTime ? Date.now() - pauseStartTime : 0

        set({
          isPaused: false,
          pausedTime: pausedTime + additionalPausedTime,
          pauseStartTime: null
        })
      },

      cancel: () => set({
        isRunning: false,
        isPaused: false,
        startTime: null,
        pausedTime: 0,
        pauseStartTime: null,
        elapsedSeconds: 0
      }),

      getElapsedSeconds: () => {
        const { isRunning, startTime, pausedTime, pauseStartTime, isPaused } = get()

        if (!isRunning || !startTime) return 0

        const now = Date.now()
        let totalPausedTime = pausedTime

        // Si está pausado ahora, añadir el tiempo de pausa actual
        if (isPaused && pauseStartTime) {
          totalPausedTime += now - pauseStartTime
        }

        const elapsedMs = now - startTime - totalPausedTime
        return Math.max(0, Math.floor(elapsedMs / 1000))
      },

      complete: () => {
        const { selectedType, getElapsedSeconds } = get()
        const elapsedSeconds = getElapsedSeconds()
        const durationMin = Math.floor(elapsedSeconds / 60)

        set({
          isRunning: false,
          isPaused: false,
          startTime: null,
          pausedTime: 0,
          pauseStartTime: null,
          elapsedSeconds: 0
        })

        return { type: selectedType, durationMin }
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        selectedType: state.selectedType,
        targetMinutes: state.targetMinutes,
        startTime: state.startTime,
        pausedTime: state.pausedTime,
        pauseStartTime: state.pauseStartTime
      })
    }
  )
)
