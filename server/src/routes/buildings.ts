import { Router } from 'express'
import { queries } from '../db/database.js'

const router = Router()

// Get all buildings with session data
router.get('/', (_req, res) => {
  try {
    const buildings = queries.getAllBuildingsWithSession.all()

    // Transform to camelCase for frontend
    const transformed = (buildings as Record<string, unknown>[]).map((b) => ({
      id: b.id,
      sessionId: b.session_id,
      type: b.type,
      size: b.size,
      baseRent: b.base_rent,
      layer: b.layer,
      position: b.position,
      createdAt: b.created_at,
      degradedAt: b.degraded_at,
      status: b.status,
      durationMin: b.duration_min,
      sessionStartedAt: b.session_started_at
    }))

    res.json(transformed)
  } catch (error) {
    console.error('Error getting buildings:', error)
    res.status(500).json({ error: 'Failed to get buildings' })
  }
})

// Get buildings by layer
router.get('/layer/:layer', (req, res) => {
  try {
    const layer = parseInt(req.params.layer)
    if (![1, 2, 3].includes(layer)) {
      return res.status(400).json({ error: 'Invalid layer' })
    }

    const buildings = queries.getBuildingsByLayer.all({ layer })
    res.json(buildings)
  } catch (error) {
    console.error('Error getting buildings by layer:', error)
    res.status(500).json({ error: 'Failed to get buildings' })
  }
})

// Update building status
router.patch('/:id/status', (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body

    if (!['active', 'warning', 'abandoned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const degradedAt = status !== 'active' ? new Date().toISOString() : null

    queries.updateBuildingStatus.run({ id, status, degraded_at: degradedAt })
    res.json({ success: true })
  } catch (error) {
    console.error('Error updating building status:', error)
    res.status(500).json({ error: 'Failed to update building' })
  }
})

export default router
