import express from 'express'
import cors from 'cors'
import sessionsRouter from './routes/sessions.js'
import buildingsRouter from './routes/buildings.js'
import statsRouter from './routes/stats.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/sessions', sessionsRouter)
app.use('/api/buildings', buildingsRouter)
app.use('/api/stats', statsRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  ███████╗██╗███╗   ██╗ ██████╗██╗████████╗██╗   ██╗              ║
║  ██╔════╝██║████╗  ██║██╔════╝██║╚══██╔══╝╚██╗ ██╔╝              ║
║  █████╗  ██║██╔██╗ ██║██║     ██║   ██║    ╚████╔╝               ║
║  ██╔══╝  ██║██║╚██╗██║██║     ██║   ██║     ╚██╔╝                ║
║  ██║     ██║██║ ╚████║╚██████╗██║   ██║      ██║                 ║
║  ╚═╝     ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝   ╚═╝      ╚═╝                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                         ║
╚═══════════════════════════════════════════════════════════════════╝
  `)
})
