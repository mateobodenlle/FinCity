// Generate a "tin" completion sound using Web Audio API
export function playCompletionSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create oscillator for the "tin" sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // High-pitched "tin" sound
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.1)

    oscillator.type = 'sine'

    // Quick fade out
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)

    // Cleanup
    setTimeout(() => {
      audioContext.close()
    }, 500)
  } catch (e) {
    console.warn('Could not play sound:', e)
  }
}
