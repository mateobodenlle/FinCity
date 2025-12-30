import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { Building, BuildingType, GameState } from '../core/types'
import { getBuildingArt } from '../ascii/buildings'
import { calculateBuildingRent, isStudyTaxActive } from '../core/economy'
import './Skyline.css'

const TYPE_LABELS: Record<BuildingType, string> = {
  osix: 'OSIX',
  shearn: 'SHEARN',
  estudio: 'ESTUDIO'
}

// Layer visual configuration
const LAYER_CONFIG = {
  1: { opacity: 1, translateY: 0, baseZIndex: 300 },
  2: { opacity: 0.7, translateY: -30, baseZIndex: 200 },
  3: { opacity: 0.4, translateY: -55, baseZIndex: 100 }
} as const

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins}min`
  }
  return `${mins}min`
}

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const mins = date.getMinutes().toString().padStart(2, '0')
  return `${day}/${month} ${hours}:${mins}`
}

function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(2)}K`
  }
  return `$${amount.toFixed(2)}`
}

function formatRent(rentPerSecond: number): string {
  if (rentPerSecond === 0) return '$0/s'
  if (rentPerSecond < 0.01) return `$${rentPerSecond.toFixed(4)}/s`
  return `$${rentPerSecond.toFixed(2)}/s`
}

interface BuildingComponentProps {
  building: Building
  gameState: GameState
  studyTaxActive: boolean
}

function BuildingComponent({ building, gameState, studyTaxActive }: BuildingComponentProps) {
  const art = getBuildingArt(building.size, building.type, building.status)
  const layerConfig = LAYER_CONFIG[building.layer]

  // Z-index: layer base + building ID (newer buildings have higher IDs = in front)
  const zIndex = layerConfig.baseZIndex + building.id

  // Calculate rent and money generated
  const rentPerSecond = calculateBuildingRent(building, gameState, studyTaxActive)
  const secondsSinceCreation = building.createdAt
    ? Math.floor((Date.now() - new Date(building.createdAt).getTime()) / 1000)
    : 0
  const moneyGenerated = rentPerSecond * secondsSinceCreation

  return (
    <div
      className={`building ${building.type} ${building.status}`}
      style={{
        opacity: layerConfig.opacity,
        transform: `translateY(${layerConfig.translateY}px)`,
        zIndex
      }}
    >
      <div className="building-tooltip">
        <div className={`tooltip-type ${building.type}`}>
          {TYPE_LABELS[building.type]}
        </div>
        <div className="tooltip-duration">
          {building.durationMin ? formatDuration(building.durationMin) : '??'}
        </div>
        <div className="tooltip-time">
          {building.sessionStartedAt ? formatTimestamp(building.sessionStartedAt) : '--'}
        </div>
        <div className="tooltip-divider"></div>
        <div className="tooltip-rent">
          {formatRent(rentPerSecond)}
        </div>
        <div className="tooltip-generated">
          {formatMoney(moneyGenerated)}
        </div>
      </div>
      {art.map((line, i) => (
        <div key={i} className="building-line">{line}</div>
      ))}
    </div>
  )
}

export default function Skyline() {
  const { buildings, gameState } = useGameStore()

  // Sort all buildings by position (global ordering, left to right)
  const sortedBuildings = useMemo(() =>
    [...buildings].sort((a, b) => a.position - b.position),
    [buildings]
  )

  const studyTaxActive = isStudyTaxActive(gameState.studyLastSession)
  const totalBuildings = buildings.length

  return (
    <div className="panel skyline">
      <div className="panel-header">
        {'>'} SKYLINE [{totalBuildings} edificios]
      </div>

      <div className="skyline-viewport">
        <div className="skyline-buildings">
          {sortedBuildings.map(building => (
            <BuildingComponent
              key={building.id}
              building={building}
              gameState={gameState}
              studyTaxActive={studyTaxActive}
            />
          ))}
        </div>

        <div className="ground-line">
          {'═'.repeat(200)}
        </div>
      </div>

      {totalBuildings === 0 && (
        <div className="skyline-empty">
          <pre>
{`
    Completa tu primera sesión para
    construir tu primer edificio...

         ┌────┐
         │    │
         │ ?? │
         │    │
         └────┘
    ═══════════════════════════
`}
          </pre>
        </div>
      )}
    </div>
  )
}
