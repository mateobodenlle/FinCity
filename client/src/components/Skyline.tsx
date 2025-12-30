import { useMemo } from 'react'
import { useGameStore } from '../stores/gameStore'
import { Building } from '../core/types'
import { getBuildingArt, getBuildingHeight } from '../ascii/buildings'
import './Skyline.css'

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
