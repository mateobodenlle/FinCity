export type BuildingType = 'osix' | 'shearn' | 'estudio'
export type BuildingSize = 'S' | 'M' | 'L' | 'XL'
export type BuildingStatus = 'active' | 'warning' | 'abandoned'

export interface Building {
  id: number
  sessionId: number
  type: BuildingType
  size: BuildingSize
  baseRent: number
  layer: 1 | 2 | 3
  position: number
  createdAt: string
  degradedAt: string | null
  status: BuildingStatus
}

export interface Session {
  id: number
  type: BuildingType
  durationMin: number
  startedAt: string
  completedAt: string
}

export interface GameState {
  totalMoney: number
  shearnMultiplier: number
  lastActivityDate: string | null
  studyLastSession: string | null
  osixLastSession: string | null
  shearnLastSession: string | null
}

export interface DailyLog {
  date: string
  minutesWorked: number
  degradationApplied: number
}

export interface EconomyStats {
  totalRentPerSecond: number
  osixRentPerSecond: number
  shearnRentPerSecond: number
  osixMultiplier: number
  shearnMultiplier: number
  studyTaxActive: boolean
  globalPenalty: number
}
