import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { config } from './config.js'
import { createApp } from './app.js'
import { registerGameSocket } from './sockets/gameSocket.js'

const app = createApp()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: config.corsOrigin },
})

registerGameSocket(io)

httpServer.listen(config.port, () => {
  console.log(`🎴 Lotería server running on http://localhost:${config.port}`)
})
