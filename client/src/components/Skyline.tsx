import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { Building, BuildingType } from '../core/types'
import { getBuildingArt, getBuildingHeight } from '../ascii/buildings'
import './Skyline.css'

const TYPE_LABELS: Record<BuildingType, string> = {
  osix: 'OSIX',
  shearn: 'SHEARN',
  estudio: 'ESTUDIO'
}

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

interface LayerProps {
  buildings: Building[]
  layerNum: 1 | 2 | 3
}

function Layer({ buildings, layerNum }: LayerProps) {
  const sortedBuildings = useMemo(() =>
    [...buildings].sort((a, b) => a.position - b.position),
    [buildings]
  )

  if (sortedBuildings.length === 0) {
    return (
      <div className={`layer layer-${layerNum} empty`}>
        <span className="empty-msg">[ Vacío ]</span>
      </div>
    )
  }

  // Find max height for alignment
  const maxHeight = Math.max(...sortedBuildings.map(b => getBuildingHeight(b.size)))

  return (
    <div className={`layer layer-${layerNum}`}>
      {sortedBuildings.map(building => {
        const art = getBuildingArt(building.size, building.type, building.status)
        const height = art.length
        const paddingTop = maxHeight - height

        return (
          <div
            key={building.id}
            className={`building ${building.type} ${building.status}`}
            style={{ paddingTop: `${paddingTop * 1.2}em` }}
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
            </div>
            {art.map((line, i) => (
              <div key={i} className="building-line">{line}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function Skyline() {
  const { buildings } = useGameStore()

  const layer1 = useMemo(() => buildings.filter(b => b.layer === 1), [buildings])
  const layer2 = useMemo(() => buildings.filter(b => b.layer === 2), [buildings])
  const layer3 = useMemo(() => buildings.filter(b => b.layer === 3), [buildings])

  const totalBuildings = buildings.length

  return (
    <div className="panel skyline">
      <div className="panel-header">
        {'>'} SKYLINE [{totalBuildings} edificios]
      </div>

      <div className="skyline-viewport">
        <div className="skyline-layers">
          <Layer buildings={layer3} layerNum={3} />
          <Layer buildings={layer2} layerNum={2} />
          <Layer buildings={layer1} layerNum={1} />
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
