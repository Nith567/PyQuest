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
 * GET /api/bounties/[address]
 * Get all bounties created by a specific address
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const client = await clientPromise;
    const db = client.db('arbiblocks');
    const collection = db.collection('bounties');

    const bounties = await collection
      .find({ creator: address.toLowerCase() })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      bounties,
    });

  } catch (error) {
    console.error('Error fetching bounties by address:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
