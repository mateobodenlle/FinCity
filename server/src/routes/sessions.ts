import { Router } from 'express'
import {
  queries,
  getSizeFromDuration,
  getBaseRent,
  getLayerForSize,
  getDayNumber,
  calculateShearnMultiplier,
  type GameState
} from '../db/database.js'

const router = Router()

// Calculate overtime bonus (2% per extra minute, max 50%)
function calculateOvertimeBonus(durationMin: number, targetMin: number): number {
  if (durationMin <= targetMin) return 0
  const extraMinutes = durationMin - targetMin
  const bonusPercent = Math.min(extraMinutes * 0.02, 0.5) // 2% per min, max 50%
  return bonusPercent
}

// Create a new session (and building)
router.post('/', (req, res) => {
  try {
    const { type, durationMin, targetMin } = req.body

    if (!type || !durationMin) {
      return res.status(400).json({ error: 'type and durationMin required' })
    }

    if (!['osix', 'shearn', 'estudio'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' })
    }

    if (durationMin < 15) {
      return res.status(400).json({ error: 'Minimum 15 minutes required' })
    }

    const now = new Date().toISOString()
    const startedAt = new Date(Date.now() - durationMin * 60 * 1000).toISOString()

    // Create session
    const sessionResult = queries.createSession.run({
      type,
      duration_min: durationMin,
      started_at: startedAt,
      completed_at: now
    })
    const sessionId = sessionResult.lastInsertRowid as number

    // Calculate building properties
    const size = getSizeFromDuration(durationMin)
    let baseRent = getBaseRent(size)

    // Apply overtime bonus if targetMin was provided
    if (targetMin && durationMin > targetMin) {
      const bonus = calculateOvertimeBonus(durationMin, targetMin)
      baseRent = baseRent * (1 + bonus)
    }

    const layer = getLayerForSize(size)

    // Get next position globally (not per-layer, so buildings don't overlap)
    const maxPosResult = queries.getMaxPositionGlobal.get() as { max_pos: number | null }
    const position = (maxPosResult?.max_pos ?? -1) + 1

    // Create building
    const buildingResult = queries.createBuilding.run({
      session_id: sessionId,
      type,
      size,
      base_rent: baseRent,
      layer,
      position,
      created_at: now
    })
    const buildingId = buildingResult.lastInsertRowid as number

    // Update game state
    const gameState = queries.getGameState.get() as GameState
    const dayNumber = getDayNumber(gameState.start_date)
    const newShearnMultiplier = calculateShearnMultiplier(dayNumber)

    // Update last session for this type
    // Note: 'estudio' type maps to 'study_last_session' field
    const fieldName = type === 'estudio' ? 'study' : type
    const updateParams: Record<string, string | null> = {
      study_last_session: null,
      osix_last_session: null,
      shearn_last_session: null,
      now
    }
    updateParams[`${fieldName}_last_session`] = now
    queries.updateLastSession.run(updateParams)

    // Update shearn multiplier
    queries.updateGameState.run({
      total_money: gameState.total_money,
      shearn_multiplier: newShearnMultiplier,
      last_activity_date: now
    })

    // Update daily log
    const today = now.split('T')[0]
    queries.getOrCreateDailyLog.run({ date: today })
    queries.updateDailyMinutes.run({ date: today, minutes: durationMin })

    // Get updated state
    const updatedState = queries.getGameState.get() as GameState

    res.json({
      session: {
        id: sessionId,
        type,
        durationMin,
        startedAt,
        completedAt: now
      },
      building: {
        id: buildingId,
        sessionId,
        type,
        size,
        baseRent,
        layer,
        position,
        createdAt: now,
        degradedAt: null,
        status: 'active',
        durationMin,
        sessionStartedAt: startedAt
      },
      gameState: {
        totalMoney: updatedState.total_money,
        shearnMultiplier: updatedState.shearn_multiplier,
        lastActivityDate: updatedState.last_activity_date,
        studyLastSession: updatedState.study_last_session,
        osixLastSession: updatedState.osix_last_session,
        shearnLastSession: updatedState.shearn_last_session
      }
    })
  } catch (error) {
    console.error('Error creating session:', error)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// Get all sessions
router.get('/', (_req, res) => {
  try {
    const sessions = queries.getSessions.all()
    res.json(sessions)
  } catch (error) {
    console.error('Error getting sessions:', error)
    res.status(500).json({ error: 'Failed to get sessions' })
  }
})

export default router
