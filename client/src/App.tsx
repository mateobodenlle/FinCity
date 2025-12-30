import { useEffect } from 'react'
import { useGameStore } from './stores/gameStore'
import Timer from './components/Timer'
import Stats from './components/Stats'
import Skyline from './components/Skyline'
import StatusBar from './components/StatusBar'
import './App.css'

function App() {
  const { loadGameState, startRentLoop } = useGameStore()

  useEffect(() => {
    loadGameState()
    const cleanup = startRentLoop()
    return cleanup
  }, [loadGameState, startRentLoop])

  return (
    <div className="app">
      <header className="app-header">
        <pre className="logo">
{`╔═══════════════════════════════════════════════════════════════════╗
║  ███████╗██╗███╗   ██╗ ██████╗██╗████████╗██╗   ██╗              ║
║  ██╔════╝██║████╗  ██║██╔════╝██║╚══██╔══╝╚██╗ ██╔╝              ║
║  █████╗  ██║██╔██╗ ██║██║     ██║   ██║    ╚████╔╝               ║
║  ██╔══╝  ██║██║╚██╗██║██║     ██║   ██║     ╚██╔╝                ║
║  ██║     ██║██║ ╚████║╚██████╗██║   ██║      ██║                 ║
║  ╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝   ╚═╝      ╚═╝                 ║
╚═══════════════════════════════════════════════════════════════════╝`}
        </pre>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <Stats />
          <Timer />
          <StatusBar />
        </div>
        <div className="right-panel">
          <Skyline />
        </div>
      </main>
    </div>
  )
}

export default App
