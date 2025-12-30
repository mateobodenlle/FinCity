// Singleton AudioContext - browsers require user interaction to unlock
let audioContext: AudioContext | null = null

// Call this on user interaction (e.g., clicking START) to unlock audio and request notification permission
export function unlockAudio() {
  // Unlock AudioContext
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

      // Create and play a silent buffer to unlock
      const buffer = audioContext.createBuffer(1, 1, 22050)
      const source = audioContext.createBufferSource()
      source.buffer = buffer
      source.connect(audioContext.destination)
      source.start(0)

      // Resume if suspended (required by some browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }
    } catch (e) {
      console.warn('Could not unlock audio:', e)
    }
  }

  // Request notification permission for background alerts
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

// Generate a "tin" completion sound using Web Audio API
export function playCompletionSound() {
  // Always show notification (works reliably even in background)
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('FinCity', {
      body: 'Tiempo completado!',
      icon: '/favicon.ico',
      tag: 'timer-complete',
      requireInteraction: false,
      silent: false
    })
  }

  // Also try to play sound (may not work if tab is hidden)
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)

    oscillator.type = 'sine'

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch (e) {
    console.warn('Could not play sound:', e)
  }
}
