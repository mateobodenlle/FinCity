import { useGameStore } from '../stores/gameStore'
import { getHoursUntilPenalty } from '../core/economy'
import './StatusBar.css'

function formatHours(hours: number | null): string {
  if (hours === null || hours <= 0) return 'VENCIDO'
  if (hours < 1) return `${Math.floor(hours * 60)}min`
  return `${Math.floor(hours)}h ${Math.floor((hours % 1) * 60)}min`
}

export default function StatusBar() {
  const { gameState, todayMinutes } = useGameStore()

  const osixHours = getHoursUntilPenalty(gameState.osixLastSession)
  const shearnHours = getHoursUntilPenalty(gameState.shearnLastSession)
  const studyHours = getHoursUntilPenalty(gameState.studyLastSession)

  const todayHours = Math.floor(todayMinutes / 60)
  const todayMins = todayMinutes % 60
  const todayProgress = Math.min((todayMinutes / 360) * 100, 100) // 6h = 100%

  const getStatusClass = (hours: number | null) => {
    if (hours === null || hours <= 0) return 'danger'
    if (hours < 12) return 'warning'
    return 'ok'
  }

  return (
    <div className="panel status-bar">
      <div className="panel-header">{'>'} STATUS</div>

      <div className="today-progress">
        <div className="today-label">
          HOY: {todayHours}h {todayMins}min
        </div>
        <div className="progress-container">
          <div
            className="progress-fill"
            style={{ width: `${todayProgress}%` }}
          />
        </div>
        <div className="progress-target">
          {todayProgress >= 100 ? '✓ Meta alcanzada' : `${(100 - todayProgress).toFixed(0)}% para meta`}
        </div>
      </div>

      <div className="type-status-grid">
        <div className={`type-status osix ${getStatusClass(osixHours)}`}>
          <span className="type-name">OSIX</span>
          <span className="time-until">{formatHours(osixHours)}</span>
        </div>

        <div className={`type-status shearn ${getStatusClass(shearnHours)}`}>
          <span className="type-name">SHEARN</span>
          <span className="time-until">{formatHours(shearnHours)}</span>
        </div>

        <div className={`type-status estudio ${getStatusClass(studyHours)}`}>
          <span className="type-name">ESTUDIO</span>
          <span className="time-until">{formatHours(studyHours)}</span>
        </div>
      </div>
    </div>
  )
}
