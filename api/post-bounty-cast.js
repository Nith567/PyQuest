import express from 'express';
import cors from 'cors';

const router = express.Router();

// Enable CORS
router.use(cors());

/**
 * POST /api/post-bounty-cast
 * Posts a new bounty to Farcaster
 */
router.post('/post-bounty-cast', async (req, res) => {
  try {
    const { bountyId, taskDescription, amount, txHash, creatorAddress, creatorUsername } = req.body;

    if (!bountyId || !taskDescription || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: bountyId, taskDescription, amount' 
      });
    }

    // Get API key and signer UUID from environment
    const NEYNAR_API_KEY = process.env.VITE_NEYNAR_API_KEY;
    const SIGNER_UUID = process.env.VITE_NEYNAR_SIGNER_UUID;
    
    if (!NEYNAR_API_KEY) {
      return res.status(500).json({ error: 'Neynar API key not configured' });
    }
    
    if (!SIGNER_UUID) {
      return res.status(500).json({ error: 'Neynar signer UUID not configured' });
    }

    // Format the cast text
    const castText = `🎯 NEW BOUNTY #${bountyId}
${creatorUsername ? `Posted by: @${creatorUsername}\n` : ''}
${taskDescription}

💰 Reward: ${amount} PYUSD

Reply to this cast with your submission to claim the bounty!

${txHash ? `🔗 TX: https://arbiscan.io/tx/${txHash}` : ''}`;

    // Post to Farcaster using Neynar API
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'x-api-key': NEYNAR_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        signer_uuid: SIGNER_UUID,
        text: castText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Neynar API error:', error);
      return res.status(response.status).json({ 
        error: 'Failed to post cast',
        details: error 
      });
    }

    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      cast: data.cast,
      castHash: data.cast?.hash,
      castUrl: `https://warpcast.com/~/conversations/${data.cast?.hash}`,
    });

  } catch (error) {
    console.error('Error posting bounty cast:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;
