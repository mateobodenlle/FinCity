import { useEffect, useCallback, useState } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { useGameStore } from '../stores/gameStore'
import { BuildingType } from '../core/types'
import './Timer.css'

const TYPE_LABELS: Record<BuildingType, string> = {
  osix: 'OSIX',
  shearn: 'SHEARN',
  estudio: 'ESTUDIO'
}

const PRESET_TIMES = [15, 25, 45, 60, 90]

export default function Timer() {
  const {
    isRunning,
    isPaused,
    selectedType,
    targetMinutes,
    setType,
    setTargetMinutes,
    start,
    pause,
    resume,
    cancel,
    getElapsedSeconds,
    complete
  } = useTimerStore()

  const { addBuilding } = useGameStore()

  // Local state para forzar re-render cada segundo
  const [, setTick] = useState(0)

  // Timer tick - actualiza el display cada segundo
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  // Calcular segundos transcurridos
  const elapsedSeconds = getElapsedSeconds()

  // Check if timer completed
  useEffect(() => {
    if (isRunning && elapsedSeconds >= targetMinutes * 60) {
      handleComplete()
    }
  }, [elapsedSeconds, targetMinutes, isRunning])

  const handleComplete = useCallback(async () => {
    const { type, durationMin } = complete()
    if (durationMin >= 1) {
      await addBuilding(type, durationMin)
    }
  }, [complete, addBuilding])

  const handleEarlyComplete = async () => {
    const currentElapsed = getElapsedSeconds()
    const durationMin = Math.floor(currentElapsed / 60)
    if (durationMin >= 15) {
      const { type } = complete()
      await addBuilding(type, durationMin)
    } else {
      cancel()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const remainingSeconds = Math.max(0, targetMinutes * 60 - elapsedSeconds)
  const progress = Math.min((elapsedSeconds / (targetMinutes * 60)) * 100, 100)

  return (
    <div className="panel timer">
      <div className="panel-header">{'>'} TIMER</div>

      {!isRunning ? (
        <>
          <div className="type-selector">
            {(['osix', 'shearn', 'estudio'] as BuildingType[]).map(type => (
              <button
                key={type}
                className={`type-btn ${type} ${selectedType === type ? 'active' : ''}`}
                onClick={() => setType(type)}
              >
                [{TYPE_LABELS[type]}]
              </button>
            ))}
          </div>

          <div className="time-selector">
            {PRESET_TIMES.map(mins => (
              <button
                key={mins}
                className={`time-btn ${targetMinutes === mins ? 'active' : ''}`}
                onClick={() => setTargetMinutes(mins)}
              >
                {mins}m
              </button>
            ))}
          </div>

          <div className="timer-display">
            <span className="time-large">{formatTime(targetMinutes * 60)}</span>
          </div>

          <div className="timer-actions">
            <button className="start-btn" onClick={start}>
              [ START ]
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="active-type">
            Trabajando en: <span className={`type-label ${selectedType}`}>{TYPE_LABELS[selectedType]}</span>
          </div>

          <div className="timer-display running">
            <div className="time-remaining">{formatTime(remainingSeconds)}</div>
            <div className="time-elapsed">+{formatTime(elapsedSeconds)}</div>
          </div>

          <div className="progress-bar">
            <div
              className={`progress-fill ${selectedType}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="timer-actions">
            {isPaused ? (
              <button onClick={resume}>[ RESUME ]</button>
            ) : (
              <button onClick={pause}>[ PAUSE ]</button>
            )}
            <button
              className="complete-btn"
              onClick={handleEarlyComplete}
              disabled={elapsedSeconds < 60 * 15}
            >
              [ {elapsedSeconds >= 60 * 15 ? 'COMPLETE' : 'CANCEL'} ]
            </button>
          </div>

          {elapsedSeconds < 60 * 15 && (
            <div className="min-warning">
              Mínimo 15 min para generar edificio
            </div>
          )}

          {isPaused && (
            <div className="pause-indicator">
              ⏸ PAUSADO
            </div>
          )}
        </>
      )}
    </div>
  )
}
