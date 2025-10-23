import express from 'express';
import cors from 'cors';

const router = express.Router();
router.use(cors());

// MongoDB connection will be passed from server.js
let getClientPromise;

export function setClientPromise(clientPromise) {
  getClientPromise = () => clientPromise;
}

/**
 * POST /api/bounties
 * Save a new bounty after contract creation
 */
router.post('/bounties', async (req, res) => {
  try {
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

    const client = await getClientPromise();
    const db = client.db('arbiblocks');
    const collection = db.collection('bounties');

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

  } catch (error) {
    console.error('Error saving bounty:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/bounties/:address
 * Get all bounties created by an address
 */
router.get('/bounties/:address', async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const client = await getClientPromise();
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
    console.error('Error fetching bounties:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * GET /api/bounties
 * Get all active bounties (for Hunt page)
 */
router.get('/bounties', async (req, res) => {
  try {
    const client = await getClientPromise();
    const db = client.db('arbiblocks');
    const collection = db.collection('bounties');

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

  } catch (error) {
    console.error('Error fetching bounties:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;
