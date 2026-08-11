import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { config } from './config.js'
import { apiRouter } from './routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json())

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', apiRouter)

  // Fallback 404 for unknown API routes.
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'No encontrado' })
  })

  // Central error handler — services throw plain Errors with Spanish messages.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Error del servidor'
    console.error('[api error]', message)
    res.status(400).json({ error: message })
  })

  return app
}
