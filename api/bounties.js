import { MongoClient } from 'mongodb';

// MongoDB connection
const MONGODB_URI = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the VITE_MONGODB_URI environment variable');
}

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

/**
 * Serverless function to handle bounties API
 * Supports POST (create bounty), GET (get bounties), GET with address param
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const client = await clientPromise;
    const db = client.db('arbiblocks');
    const collection = db.collection('bounties');

    // POST /api/bounties - Save a new bounty after contract creation
    if (req.method === 'POST') {
      const { 
        bountyId, 
        creator, 
        amount, 
        taskDescription, 
        txHash, 
        castUrl,
        castHash 
      } = req.body;

      if (!bountyId || !creator || !amount || !taskDescription) {
        return res.status(400).json({ 
          error: 'Missing required fields' 
        });
      }

      const bounty = {
        bountyId: Number(bountyId),
        creator: creator.toLowerCase(),
        amount,
        taskDescription,
        hunter: null,
        isCompleted: false,
        isCancelled: false,
        txHash,
        castUrl,
        castHash, // Store cast hash for fetching submissions
        createdAt: new Date(),
      };

      const result = await collection.insertOne(bounty);

      return res.status(200).json({
        success: true,
        id: result.insertedId.toString(),
      });
    }

    // GET /api/bounties - Get all active bounties (for Hunt page)
    if (req.method === 'GET') {
      const bounties = await collection
        .find({ 
          isCompleted: false, 
          isCancelled: false 
        })
        .sort({ createdAt: -1 })
        .toArray();

      return res.status(200).json({
        success: true,
        bounties,
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in bounties API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
