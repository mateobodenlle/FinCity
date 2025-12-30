import { Router } from 'express'
import { queries, getDayNumber, type GameState } from '../db/database.js'

const router = Router()

// Get game state
router.get('/state', (_req, res) => {
  try {
    const state = queries.getGameState.get() as GameState

    res.json({
      totalMoney: state.total_money,
      shearnMultiplier: state.shearn_multiplier,
      startDate: state.start_date,
      lastActivityDate: state.last_activity_date,
      studyLastSession: state.study_last_session,
      osixLastSession: state.osix_last_session,
      shearnLastSession: state.shearn_last_session
    })
  } catch (error) {
    console.error('Error getting game state:', error)
    res.status(500).json({ error: 'Failed to get game state' })
  }
})

// Get today's stats
router.get('/today', (_req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const state = queries.getGameState.get() as GameState

    // Ensure today's log exists
    queries.getOrCreateDailyLog.run({ date: today })
    const dailyLog = queries.getDailyLog.get({ date: today }) as {
      date: string
      minutes_worked: number
      degradation_applied: number
    }

    const dayNumber = getDayNumber(state.start_date)

    res.json({
      date: today,
      dayNumber,
      minutesWorked: dailyLog?.minutes_worked ?? 0,
      degradationApplied: dailyLog?.degradation_applied ?? 0
    })
  } catch (error) {
    console.error('Error getting today stats:', error)
    res.status(500).json({ error: 'Failed to get today stats' })
  }
})

// Update total money
router.post('/money', (req, res) => {
  try {
    const { totalMoney } = req.body

    if (typeof totalMoney !== 'number') {
      return res.status(400).json({ error: 'totalMoney must be a number' })
    }

    queries.updateMoney.run({ total_money: totalMoney })
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating money:', error)
    res.status(500).json({ error: 'Failed to update money' })
  }
})

// Get economy summary
router.get('/economy', (_req, res) => {
  try {
    const state = queries.getGameState.get() as GameState
    const buildings = queries.getAllBuildings.all() as Array<{
      type: string
      base_rent: number
      status: string
    }>

    // Check study tax
    const studyTaxActive = !state.study_last_session ||
      (Date.now() - new Date(state.study_last_session).getTime()) > 48 * 60 * 60 * 1000

    // Calculate rents
    let osixRent = 0
    let shearnRent = 0

    for (const b of buildings) {
      if (b.status === 'abandoned') continue

      let rent = b.base_rent
      if (b.status === 'warning') rent *= 0.5

      if (b.type === 'osix') {
        rent *= 2.0 // OSIX multiplier
        osixRent += rent
      } else if (b.type === 'shearn') {
        rent *= state.shearn_multiplier
        shearnRent += rent
      }
    }

    // Apply study tax
    if (studyTaxActive) {
      osixRent *= 0.6
      shearnRent *= 0.6
    }

    res.json({
      totalRentPerSecond: osixRent + shearnRent,
      osixRentPerSecond: osixRent,
      shearnRentPerSecond: shearnRent,
      osixMultiplier: 2.0,
      shearnMultiplier: state.shearn_multiplier,
      studyTaxActive,
      globalPenalty: studyTaxActive ? 0.4 : 0
    })
  } catch (error) {
    console.error('Error getting economy:', error)
    res.status(500).json({ error: 'Failed to get economy' })
  }
})

export default router
