import { useEffect, useCallback, useState, useRef } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { useGameStore } from '../stores/gameStore'
import { BuildingType } from '../core/types'
import { playCompletionSound } from '../utils/sound'
import './Timer.css'

const TYPE_LABELS: Record<BuildingType, string> = {
  osix: 'OSIX',
  shearn: 'SHEARN',
  estudio: 'ESTUDIO'
}

const PRESET_TIMES = [15, 25, 45, 60, 90]

// Max overtime before auto-stop (2 hours in seconds)
const MAX_OVERTIME_SECONDS = 2 * 60 * 60

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

  // Track if we already played the completion sound
  const hasPlayedSound = useRef(false)

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

  // Reset sound flag when timer stops
  useEffect(() => {
    if (!isRunning) {
      hasPlayedSound.current = false
    }
  }, [isRunning])

  // Calcular segundos transcurridos
  const elapsedSeconds = getElapsedSeconds()
  const targetSeconds = targetMinutes * 60
  const isOvertime = elapsedSeconds >= targetSeconds
  const overtimeSeconds = Math.max(0, elapsedSeconds - targetSeconds)

  // Play sound when reaching target (only once)
  useEffect(() => {
    if (isRunning && isOvertime && !hasPlayedSound.current) {
      playCompletionSound()
      hasPlayedSound.current = true
    }
  }, [isRunning, isOvertime])

  // Auto-stop if overtime exceeds 2 hours
  useEffect(() => {
    if (isRunning && overtimeSeconds >= MAX_OVERTIME_SECONDS) {
      handleCompleteAtOriginal()
    }
  }, [isRunning, overtimeSeconds])

  // Complete at original target time (ignore overtime)
  const handleCompleteAtOriginal = useCallback(async () => {
    const { type } = complete()
    if (targetMinutes >= 15) {
      await addBuilding(type, targetMinutes, targetMinutes)
    }
  }, [complete, addBuilding, targetMinutes])

  const handleEarlyComplete = async () => {
    const currentElapsed = getElapsedSeconds()
    const durationMin = Math.floor(currentElapsed / 60)
    if (durationMin >= 15) {
      const { type } = complete()
      await addBuilding(type, durationMin, targetMinutes)
    } else {
      cancel()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatOvertime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `+${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds)
  const progress = Math.min((elapsedSeconds / targetSeconds) * 100, 100)

  // Calculate current size category for display
  const getCurrentSize = (mins: number) => {
    if (mins >= 75) return 'XL'
    if (mins >= 45) return 'L'
    if (mins >= 25) return 'M'
    if (mins >= 15) return 'S'
    return '-'
  }

  const currentMins = Math.floor(elapsedSeconds / 60)
  const currentSize = getCurrentSize(currentMins)

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

          <div className={`timer-display running ${isOvertime ? 'overtime' : ''}`}>
            {isOvertime ? (
              <>
                <div className="time-completed">COMPLETADO</div>
                <div className="time-overtime">{formatOvertime(overtimeSeconds)}</div>
                <div className="time-total">Total: {formatTime(elapsedSeconds)}</div>
              </>
            ) : (
              <>
                <div className="time-remaining">{formatTime(remainingSeconds)}</div>
                <div className="time-elapsed">+{formatTime(elapsedSeconds)}</div>
              </>
            )}
          </div>

          {isOvertime && (
            <div className="overtime-info">
              <span className="size-badge">{currentSize}</span>
              <span className="bonus-text">+{currentMins - targetMinutes} min extra</span>
            </div>
          )}

          <div className="progress-bar">
            <div
              className={`progress-fill ${selectedType} ${isOvertime ? 'complete' : ''}`}
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

          {isOvertime && (
            <button
              className="original-time-btn"
              onClick={handleCompleteAtOriginal}
            >
              [ Guardar solo {targetMinutes}min ]
            </button>
          )}

          {!isOvertime && elapsedSeconds < 60 * 15 && (
            <div className="min-warning">
              Mínimo 15 min para generar edificio
            </div>
          )}

          {isPaused && (
            <div className="pause-indicator">
              PAUSADO
            </div>
          )}
        </>
      )}
    </div>
  )
}
