import { Building, BuildingSize, GameState } from './types'

// Base rent per second by building size
export const BASE_RENT: Record<BuildingSize, number> = {
  S: 0.10,
  M: 0.30,
  L: 0.70,
  XL: 1.50
}

// Sleep mode: city sleeps after 1h 4min of inactivity, reduces rent to 25%
export const SLEEP_THRESHOLD_HOURS = 64 / 60 // 1h 4min
export const SLEEP_PENALTY = 0.25

// Size thresholds in minutes
export function getSizeFromDuration(minutes: number): BuildingSize {
  if (minutes >= 75) return 'XL'
  if (minutes >= 45) return 'L'
  if (minutes >= 25) return 'M'
  return 'S'
}

// OSIX multiplier is fixed at 2.0
export const OSIX_MULTIPLIER = 2.0

// SHEARN starts at 0.8, grows +0.15/day, max 4.0
export function getShearnMultiplier(daysSinceStart: number): number {
  const multiplier = 0.8 + (daysSinceStart * 0.15)
  return Math.min(multiplier, 4.0)
}

// Calculate rent for a single building
export function calculateBuildingRent(
  building: Building,
  gameState: GameState,
  studyTaxActive: boolean,
  citySleeping: boolean = false
): number {
  if (building.status === 'abandoned') return 0

  let rent = building.baseRent

  // Apply type multiplier
  if (building.type === 'osix') {
    rent *= OSIX_MULTIPLIER
  } else if (building.type === 'shearn') {
    rent *= gameState.shearnMultiplier
  } else {
    // Estudio generates no rent
    return 0
  }

  // Apply status penalty
  if (building.status === 'warning') {
    rent *= 0.5
  }

  // Apply study tax (global -40%)
  if (studyTaxActive) {
    rent *= 0.6
  }

  // Apply sleep penalty (reduces to 25%)
  if (citySleeping) {
    rent *= SLEEP_PENALTY
  }

  return rent
}

// Calculate total rent per second from all buildings
export function calculateTotalRent(
  buildings: Building[],
  gameState: GameState,
  studyTaxActive: boolean,
  citySleeping: boolean = false
): number {
  return buildings.reduce((total, building) => {
    return total + calculateBuildingRent(building, gameState, studyTaxActive, citySleeping)
  }, 0)
}

// Check if study tax is active (no study session in 48h)
export function isStudyTaxActive(studyLastSession: string | null): boolean {
  if (!studyLastSession) return true

  const lastSession = new Date(studyLastSession)
  const now = new Date()
  const hoursDiff = (now.getTime() - lastSession.getTime()) / (1000 * 60 * 60)

  return hoursDiff > 48
}

// Check if city is sleeping (no session of any type in 2.5h)
export function isCitySleeping(gameState: GameState): boolean {
  const { studyLastSession, osixLastSession, shearnLastSession } = gameState

  // Find the most recent session
  const sessions = [studyLastSession, osixLastSession, shearnLastSession]
    .filter((s): s is string => s !== null)
    .map(s => new Date(s).getTime())

  if (sessions.length === 0) return true

  const mostRecent = Math.max(...sessions)
  const now = Date.now()
  const hoursSinceLastSession = (now - mostRecent) / (1000 * 60 * 60)

  return hoursSinceLastSession > SLEEP_THRESHOLD_HOURS
}

// Check if a building type needs attention (approaching 48h limit)
export function getHoursUntilPenalty(lastSession: string | null): number | null {
  if (!lastSession) return 0

  const last = new Date(lastSession)
  const now = new Date()
  const hoursDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60)

  if (hoursDiff >= 48) return 0
  return 48 - hoursDiff
}

// Calculate daily degradation based on minutes worked
export function calculateDegradation(minutesWorked: number): number {
  const MIN_REQUIRED = 360 // 6 hours

  if (minutesWorked >= MIN_REQUIRED) return 0

  const deficit = (MIN_REQUIRED - minutesWorked) / MIN_REQUIRED
  return deficit * 0.15 // Max 15% degradation
}

// Get rent breakdown by type
export function getRentBreakdown(
  buildings: Building[],
  gameState: GameState,
  studyTaxActive: boolean,
  citySleeping: boolean = false
): { osix: number; shearn: number } {
  const osixBuildings = buildings.filter(b => b.type === 'osix')
  const shearnBuildings = buildings.filter(b => b.type === 'shearn')

  return {
    osix: osixBuildings.reduce((sum, b) => sum + calculateBuildingRent(b, gameState, studyTaxActive, citySleeping), 0),
    shearn: shearnBuildings.reduce((sum, b) => sum + calculateBuildingRent(b, gameState, studyTaxActive, citySleeping), 0)
  }
}
