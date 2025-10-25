/**
 * POST /api/post-bounty-cast
 * Posts a new bounty to Farcaster
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
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
}
