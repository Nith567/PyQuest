export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { castHash, winnerUsername, amount, txHash, bountyId, winnerAddress } = req.body;

    if (!castHash || !amount || !txHash || !bountyId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const NEYNAR_API_KEY = process.env.VITE_NEYNAR_API_KEY;
    const SIGNER_UUID = process.env.VITE_NEYNAR_SIGNER_UUID;

    // First, try to get FID from winner's wallet address
    let winnerFid = null;
    if (winnerAddress) {
      try {
        const fidResponse = await fetch(
          `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${winnerAddress}`,
          {
            headers: {
              'accept': 'application/json',
              'api_key': NEYNAR_API_KEY
            }
          }
        );

        if (fidResponse.ok) {
          const fidData = await fidResponse.json();
          const users = fidData[winnerAddress.toLowerCase()];
          if (users && users.length > 0) {
            winnerFid = users[0].fid;
            console.log(`✅ Found winner FID: ${winnerFid} for address ${winnerAddress}`);
          }
        }
      } catch (error) {
        console.error('Error fetching winner FID:', error);
      }
    }

    // Generate a unique UUID for the notification
    const notificationUUID = crypto.randomUUID();
    
    const blockscoutUrl = `https://arbitrum.blockscout.com/tx/${txHash}`;
    
    // Send direct notification to winner if we have their FID
    if (winnerFid) {
      const notificationPayload = {
        target_fids: [winnerFid],
        notification: {
          title: "🏆 Bounty Won!",
          body: `Congratulations! You've been rewarded ${amount} PYUSD for completing Bounty #${bountyId}! 🎉`,
          target_url: blockscoutUrl,
          uuid: notificationUUID
        }
      };

      try {
        const notificationResponse = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': NEYNAR_API_KEY
          },
          body: JSON.stringify(notificationPayload)
        });

        if (notificationResponse.ok) {
          console.log('✅ Winner notification sent successfully');
        }
      } catch (error) {
        console.error('Error sending winner notification:', error);
      }
    }

    // Create winner announcement text (public cast)
    const announcementText = `🏆 WINNER SELECTED!\n\nBounty #${bountyId} has been completed!\n\n💰 Reward: ${amount} PYUSD\n✅ TX: ${blockscoutUrl}\n\nCongrats to the winner! 🎉`;

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
      winnerFid,
      notificationSent: !!winnerFid,
      notificationUUID: winnerFid ? notificationUUID : null
    });

  } catch (error) {
    console.error('Error announcing winner:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
