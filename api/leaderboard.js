import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI

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

export default async function handler(req, res) {
  try {
    const client = await clientPromise
    const db = client.db('arbiblocks')
    const collection = db.collection('leaderboard')

    if (req.method === 'POST') {
      // Save a new score
      const { username, displayName, pfpUrl, score, timeTaken, createdAt } = req.body
      
      console.log('Saving score to MongoDB:', req.body)
      
      const result = await collection.insertOne({
        username,
        displayName,
        pfpUrl,
        score,
        timeTaken,
        createdAt: new Date(createdAt)
      })
      
      console.log('Score saved with ID:', result.insertedId)
      
      res.status(200).json({ 
        success: true, 
        id: result.insertedId.toString() 
      })
      
    } else if (req.method === 'GET') {
      // Get leaderboard (top 3, sorted by score desc, then time asc)
      const limit = parseInt(req.query.limit) || 3
      
      console.log('Fetching leaderboard from MongoDB, limit:', limit)
      
      const leaderboard = await collection
        .find({})
        .sort({ 
          score: -1,     // Sort by score descending (highest first)
          timeTaken: 1   // Then by time ascending (fastest first for same score)
        })
        .limit(limit)
        .toArray()
      
      console.log('Fetched leaderboard:', leaderboard)
      
      res.status(200).json(leaderboard)
      
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }
    
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: 'Database connection failed' })
  }
}
