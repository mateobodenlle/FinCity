import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Initialize database
const db = new Database(join(__dirname, '../../fincity.db'))
db.pragma('journal_mode = WAL')

// Run schema
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
db.exec(schema)

// Types
export interface Session {
  id: number
  type: 'osix' | 'shearn' | 'estudio'
  duration_min: number
  started_at: string
  completed_at: string
}

export interface Building {
  id: number
  session_id: number
  type: 'osix' | 'shearn' | 'estudio'
  size: 'S' | 'M' | 'L' | 'XL'
  base_rent: number
  layer: 1 | 2 | 3
  position: number
  created_at: string
  degraded_at: string | null
  status: 'active' | 'warning' | 'abandoned'
}

export interface GameState {
  id: number
  total_money: number
  shearn_multiplier: number
  start_date: string
  last_activity_date: string | null
  study_last_session: string | null
  osix_last_session: string | null
  shearn_last_session: string | null
}

// Queries
export const queries = {
  // Sessions
  createSession: db.prepare(`
    INSERT INTO sessions (type, duration_min, started_at, completed_at)
    VALUES (@type, @duration_min, @started_at, @completed_at)
  `),

  getSessions: db.prepare(`SELECT * FROM sessions ORDER BY completed_at DESC`),

  // Buildings
  createBuilding: db.prepare(`
    INSERT INTO buildings (session_id, type, size, base_rent, layer, position, created_at, status)
    VALUES (@session_id, @type, @size, @base_rent, @layer, @position, @created_at, 'active')
  `),

  getAllBuildings: db.prepare(`SELECT * FROM buildings ORDER BY created_at`),

  getAllBuildingsWithSession: db.prepare(`
    SELECT
      b.*,
      s.duration_min,
      s.started_at as session_started_at
    FROM buildings b
    LEFT JOIN sessions s ON b.session_id = s.id
    ORDER BY b.created_at
  `),

  getBuildingsByLayer: db.prepare(`
    SELECT * FROM buildings WHERE layer = @layer ORDER BY position
  `),

  getMaxPositionInLayer: db.prepare(`
    SELECT MAX(position) as max_pos FROM buildings WHERE layer = @layer
  `),

  getMaxPositionGlobal: db.prepare(`
    SELECT MAX(position) as max_pos FROM buildings
  `),

  updateBuildingStatus: db.prepare(`
    UPDATE buildings SET status = @status, degraded_at = @degraded_at WHERE id = @id
  `),

  // Game state
  getGameState: db.prepare(`SELECT * FROM game_state WHERE id = 1`),

  updateGameState: db.prepare(`
    UPDATE game_state SET
      total_money = @total_money,
      shearn_multiplier = @shearn_multiplier,
      last_activity_date = @last_activity_date
    WHERE id = 1
  `),

  updateLastSession: db.prepare(`
    UPDATE game_state SET
      study_last_session = COALESCE(@study_last_session, study_last_session),
      osix_last_session = COALESCE(@osix_last_session, osix_last_session),
      shearn_last_session = COALESCE(@shearn_last_session, shearn_last_session),
      last_activity_date = @now
    WHERE id = 1
  `),

  updateMoney: db.prepare(`
    UPDATE game_state SET total_money = @total_money WHERE id = 1
  `),

  // Daily log
  getOrCreateDailyLog: db.prepare(`
    INSERT INTO daily_log (date, minutes_worked, degradation_applied)
    VALUES (@date, 0, 0)
    ON CONFLICT(date) DO UPDATE SET date = date
    RETURNING *
  `),

  updateDailyMinutes: db.prepare(`
    UPDATE daily_log SET minutes_worked = minutes_worked + @minutes WHERE date = @date
  `),

  getDailyLog: db.prepare(`SELECT * FROM daily_log WHERE date = @date`),
}

// Helper functions
export function getSizeFromDuration(minutes: number): 'S' | 'M' | 'L' | 'XL' {
  if (minutes >= 75) return 'XL'
  if (minutes >= 45) return 'L'
  if (minutes >= 25) return 'M'
  return 'S'
}

export function getBaseRent(size: 'S' | 'M' | 'L' | 'XL'): number {
  const rents = { S: 0.10, M: 0.30, L: 0.70, XL: 1.50 }
  return rents[size]
}

export function getLayerForSize(size: 'S' | 'M' | 'L' | 'XL'): 1 | 2 | 3 {
  if (size === 'XL' || size === 'L') return 1
  if (size === 'M') return 2
  return 3
}

export function getDayNumber(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  const diffTime = now.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays + 1
}

export function calculateShearnMultiplier(dayNumber: number): number {
  const multiplier = 0.8 + ((dayNumber - 1) * 0.15)
  return Math.min(multiplier, 4.0)
}

export default db
