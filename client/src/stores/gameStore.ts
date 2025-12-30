import { create } from 'zustand'
import axios from 'axios'
import { Building, GameState, BuildingType } from '../core/types'
import { isStudyTaxActive, isCitySleeping, getRentBreakdown } from '../core/economy'

interface GameStoreState {
  // Data
  buildings: Building[]
  gameState: GameState
  todayMinutes: number
  dayNumber: number

  // Computed
  totalMoney: number
  rentPerSecond: number
  osixRent: number
  shearnRent: number
  studyTaxActive: boolean
  citySleeping: boolean

  // Actions
  loadGameState: () => Promise<void>
  addBuilding: (type: BuildingType, durationMin: number, targetMin?: number) => Promise<void>
  updateMoney: (amount: number) => void
  startRentLoop: () => () => void
}

const API_BASE = '/api'

export const useGameStore = create<GameStoreState>((set, get) => ({
  // Initial data
  buildings: [],
  gameState: {
    totalMoney: 0,
    shearnMultiplier: 0.8,
    lastActivityDate: null,
    studyLastSession: null,
    osixLastSession: null,
    shearnLastSession: null
  },
  todayMinutes: 0,
  dayNumber: 1,

  // Computed (will be updated)
  totalMoney: 0,
  rentPerSecond: 0,
  osixRent: 0,
  shearnRent: 0,
  studyTaxActive: false,
  citySleeping: false,

  loadGameState: async () => {
    try {
      const [buildingsRes, stateRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/buildings`),
        axios.get(`${API_BASE}/stats/state`),
        axios.get(`${API_BASE}/stats/today`)
      ])

      const buildings = buildingsRes.data
      const gameState = stateRes.data
      const todayStats = statsRes.data

      const studyTax = isStudyTaxActive(gameState.studyLastSession)
      const sleeping = isCitySleeping(gameState)
      const rentBreakdown = getRentBreakdown(buildings, gameState, studyTax, sleeping)
      const totalRent = rentBreakdown.osix + rentBreakdown.shearn

      set({
        buildings,
        gameState,
        totalMoney: gameState.totalMoney,
        todayMinutes: todayStats.minutesWorked,
        dayNumber: todayStats.dayNumber,
        rentPerSecond: totalRent,
        osixRent: rentBreakdown.osix,
        shearnRent: rentBreakdown.shearn,
        studyTaxActive: studyTax,
        citySleeping: sleeping
      })
    } catch (error) {
      console.error('Failed to load game state:', error)
    }
  },

  addBuilding: async (type: BuildingType, durationMin: number, targetMin?: number) => {
    try {
      const response = await axios.post(`${API_BASE}/sessions`, {
        type,
        durationMin,
        targetMin
      })

      const { building, gameState: newState } = response.data
      const { buildings, gameState } = get()

      const updatedBuildings = [...buildings, building]
      const updatedGameState = { ...gameState, ...newState }

      const studyTax = isStudyTaxActive(updatedGameState.studyLastSession)
      // City wakes up when a new session is completed
      const sleeping = isCitySleeping(updatedGameState)
      const rentBreakdown = getRentBreakdown(updatedBuildings, updatedGameState, studyTax, sleeping)

      set({
        buildings: updatedBuildings,
        gameState: updatedGameState,
        rentPerSecond: rentBreakdown.osix + rentBreakdown.shearn,
        osixRent: rentBreakdown.osix,
        shearnRent: rentBreakdown.shearn,
        studyTaxActive: studyTax,
        citySleeping: sleeping
      })
    } catch (error) {
      console.error('Failed to add building:', error)
    }
  },

  updateMoney: (amount: number) => {
    set(state => ({
      totalMoney: state.totalMoney + amount
    }))
  },

  startRentLoop: () => {
    const interval = setInterval(() => {
      const { rentPerSecond, updateMoney } = get()
      if (rentPerSecond > 0) {
        // Update every 100ms, so divide by 10
        updateMoney(rentPerSecond / 10)
      }
    }, 100)

    // Check sleep status and recalculate rents every 30 seconds
    const sleepCheckInterval = setInterval(() => {
      const { buildings, gameState, citySleeping } = get()
      const newSleepingState = isCitySleeping(gameState)

      // Only update if sleep state changed
      if (newSleepingState !== citySleeping) {
        const studyTax = isStudyTaxActive(gameState.studyLastSession)
        const rentBreakdown = getRentBreakdown(buildings, gameState, studyTax, newSleepingState)

        set({
          citySleeping: newSleepingState,
          rentPerSecond: rentBreakdown.osix + rentBreakdown.shearn,
          osixRent: rentBreakdown.osix,
          shearnRent: rentBreakdown.shearn
        })
      }
    }, 30000)

    // Save money to server every 10 seconds
    const saveInterval = setInterval(async () => {
      const { totalMoney } = get()
      try {
        await axios.post(`${API_BASE}/stats/money`, { totalMoney })
      } catch (error) {
        console.error('Failed to save money:', error)
      }
    }, 10000)

    return () => {
      clearInterval(interval)
      clearInterval(sleepCheckInterval)
      clearInterval(saveInterval)
    }
  }
}))
