import { useGameStore } from '../stores/gameStore'
import { OSIX_MULTIPLIER } from '../core/economy'
import './Stats.css'

function formatMoney(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(2)}B`
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(2)}K`
  }
  return `$${amount.toFixed(2)}`
}

function formatRent(amount: number): string {
  return `$${amount.toFixed(2)}/s`
}

export default function Stats() {
  const {
    totalMoney,
    rentPerSecond,
    osixRent,
    shearnRent,
    buildings,
    gameState,
    studyTaxActive,
    dayNumber
  } = useGameStore()

  const osixCount = buildings.filter(b => b.type === 'osix').length
  const shearnCount = buildings.filter(b => b.type === 'shearn').length
  const estudioCount = buildings.filter(b => b.type === 'estudio').length

  return (
    <div className="panel stats">
      <div className="panel-header">{'>'} FINCITY STATS</div>

      <div className="money-display">
        <div className="total-money">{formatMoney(totalMoney)}</div>
        <div className="rent-per-second">+{formatRent(rentPerSecond)}</div>
      </div>

      <div className="day-counter">
        DÍA {dayNumber}/25
      </div>

      <div className="stats-grid">
        <div className="stat-row osix">
          <span className="stat-label">OSIX</span>
          <span className="stat-count">{osixCount} edificios</span>
          <span className="stat-rent">{formatRent(osixRent)}</span>
          <span className="stat-mult">x{OSIX_MULTIPLIER}</span>
        </div>

        <div className="stat-row shearn">
          <span className="stat-label">SHEARN</span>
          <span className="stat-count">{shearnCount} edificios</span>
          <span className="stat-rent">{formatRent(shearnRent)}</span>
          <span className="stat-mult">x{gameState.shearnMultiplier.toFixed(2)} ↑</span>
        </div>

        <div className="stat-row estudio">
          <span className="stat-label">ESTUDIO</span>
          <span className="stat-count">{estudioCount} edificios</span>
          <span className="stat-rent">$0.00/s</span>
          <span className={`stat-mult ${studyTaxActive ? 'tax-active' : ''}`}>
            {studyTaxActive ? 'IMPUESTO' : 'OK'}
          </span>
        </div>
      </div>

      {studyTaxActive && (
        <div className="tax-warning">
          ⚠ DEUDA ACADÉMICA: -40% rendimiento global
        </div>
      )}
    </div>
  )
}
