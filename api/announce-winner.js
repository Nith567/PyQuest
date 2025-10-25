export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { castHash, winnerUsername, amount, txHash, bountyId } = req.body;

    if (!castHash || !winnerUsername || !amount || !txHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const NEYNAR_API_KEY = process.env.VITE_NEYNAR_API_KEY;
    const SIGNER_UUID = process.env.VITE_NEYNAR_SIGNER_UUID;

    // Create winner announcement text
    const blockscoutUrl = `https://arbitrum.blockscout.com/tx/${txHash}`;
    const announcementText = `🏆 WINNER SELECTED!\n\n @${winnerUsername} has been rewarded ${amount} PYUSD for completing Bounty #${bountyId}!\n\n✅ TX: ${blockscoutUrl}\n\nCongrats! 🎉`;

    // Post reply to original bounty cast
    const response = await fetch('https://api.neynar.com/v2/farcaster/cast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NEYNAR_API_KEY,
      },
      body: JSON.stringify({
        signer_uuid: SIGNER_UUID,
        text: announcementText,
        parent: castHash, // Reply to the original bounty cast
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Neynar API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to post winner announcement', details: errorData });
    }

    const data = await response.json();
    console.log('✅ Winner announcement posted:', data);

    return res.status(200).json({
      success: true,
      castHash: data.cast.hash,
      castUrl: `https://warpcast.com/${data.cast.author.username}/${data.cast.hash.substring(0, 10)}`,
    });

  } catch (error) {
    console.error('Error announcing winner:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
