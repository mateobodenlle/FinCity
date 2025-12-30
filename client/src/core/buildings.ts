import { BuildingType, BuildingSize, Building } from './types'
import { BASE_RENT, getSizeFromDuration } from './economy'

// Assign layer based on building size (bigger buildings in front)
function getLayerForSize(size: BuildingSize): 1 | 2 | 3 {
  switch (size) {
    case 'XL':
    case 'L':
      return 1 // Front layer
    case 'M':
      return 2 // Middle layer
    case 'S':
      return 3 // Back layer
  }
}

// Create a new building from a completed session
export function createBuilding(
  sessionId: number,
  type: BuildingType,
  durationMin: number,
  existingBuildings: Building[]
): Omit<Building, 'id'> {
  const size = getSizeFromDuration(durationMin)
  const layer = getLayerForSize(size)

  // Find next available position in the layer
  const buildingsInLayer = existingBuildings.filter(b => b.layer === layer)
  const maxPosition = buildingsInLayer.length > 0
    ? Math.max(...buildingsInLayer.map(b => b.position))
    : -1

  return {
    sessionId,
    type,
    size,
    baseRent: BASE_RENT[size],
    layer,
    position: maxPosition + 1,
    createdAt: new Date().toISOString(),
    degradedAt: null,
    status: 'active'
  }
}

// Get building count by type
export function getBuildingCounts(buildings: Building[]): Record<BuildingType, number> {
  return {
    osix: buildings.filter(b => b.type === 'osix').length,
    shearn: buildings.filter(b => b.type === 'shearn').length,
    estudio: buildings.filter(b => b.type === 'estudio').length
  }
}
