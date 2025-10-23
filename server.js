import express from 'express'
import cors from 'cors'
import { MongoClient } from 'mongodb'
import dotenv from 'dotenv'
import postBountyCastRouter from './api/post-bounty-cast.js'
import bountiesRouter, { setClientPromise } from './api/bounties.js'
import announceWinnerHandler from './api/announce-winner.js'
import hypersyncStatsHandler from './api/hypersync-stats.js'
import notifyWinnerHandler from './api/notify-winner.js'
import saveNotificationTokenHandler from './api/save-notification-token.js'
import farcasterManifestHandler from './api/farcaster-manifest.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// MongoDB connection
const MONGODB_URI = process.env.VITE_MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Please define the VITE_MONGODB_URI environment variable')
}

let client
let clientPromise

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI)
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  client = new MongoClient(MONGODB_URI)
  clientPromise = client.connect()
}

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'https://0dc4d053f084.ngrok-free.app',
    'https://1e5f347b6b35.ngrok-free.app',
    'https://eighty-areas-itch.loca.lt'
  ],
  credentials: true
}))
app.use(express.json())

// Pass MongoDB connection to bounties router
setClientPromise(clientPromise)

// API Routes
app.use('/api', postBountyCastRouter)
app.use('/api', bountiesRouter)

// Winner announcement route
app.post('/api/announce-winner', announceWinnerHandler)

// Hypersync stats route
app.get('/api/hypersync-stats', hypersyncStatsHandler)

// Notify winner route
app.post('/api/notify-winner', notifyWinnerHandler)

// Save notification token route
app.post('/api/save-notification-token', saveNotificationTokenHandler)



app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
  console.log(`📊 Leaderboard endpoint: http://localhost:${PORT}/api/leaderboard`)
})
