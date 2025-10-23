// Helper function to get FID from wallet address using Neynar
async function getFidFromWallet(walletAddress) {
  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${walletAddress}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': process.env.VITE_NEYNAR_API_KEY || ''
        }
      }
    );

    if (!response.ok) {
      console.log(`⚠️ Neynar API error for ${walletAddress}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const users = data[walletAddress.toLowerCase()];
    
    if (users && users.length > 0) {
      const fid = users[0].fid;
      const username = users[0].username;
      const displayName = users[0].display_name;
      console.log(`✅ Found Farcaster user: ${username} (FID: ${fid}) for wallet ${walletAddress}`);
      return { fid, username, displayName };
    }
    
    console.log(`ℹ️ No Farcaster account found for wallet ${walletAddress}`);
    return null;
  } catch (error) {
    console.error('Error fetching FID from Neynar:', error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { hunterAddress, amount, txHash, targetFid } = req.body;

    if (!hunterAddress || !amount || !txHash) {
      return res.status(400).json({ 
        error: 'Missing required fields: hunterAddress, amount, txHash' 
      });
    }
    
    // Generate a unique UUID for the notification
    const notificationUUID = crypto.randomUUID();
    
    const amountInPYUSD = (parseFloat(amount) / 1000000).toFixed(4);
    const blockscoutUrl = `https://arbiscan.io/tx/${txHash}`;
    
    const notificationPayload = {
      notification: {
        title: "🎉 Bounty Completed!",
        body: `Congratulations! You earned ${amountInPYUSD} PYUSD for completing a bounty! Click to view on-chain proof.`,
        target_url: blockscoutUrl,
        uuid: notificationUUID
      }
    };

    // Try to get FID from wallet address if not provided
    let fid = targetFid;
    let userInfo = null;
    
    if (!fid) {
      console.log(`🔍 Looking up Farcaster profile for ${hunterAddress}...`);
      userInfo = await getFidFromWallet(hunterAddress);
      fid = userInfo?.fid;
    }

    // If FID is available (provided or found), send Farcaster notification
    if (fid) {
      notificationPayload.target_fids = [fid];
      
      const response = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.VITE_NEYNAR_API_KEY || ''
        },
        body: JSON.stringify(notificationPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to send notification',
          details: result
        });
      }

      return res.status(200).json({
        success: true,
        uuid: notificationUUID,
        hunterAddress,
        fid,
        username: userInfo?.username,
        displayName: userInfo?.displayName,
        amount: amountInPYUSD,
        txUrl: blockscoutUrl,
        result
      });
    }

    // If no FID found, just return success with the notification data
    return res.status(200).json({
      success: true,
      uuid: notificationUUID,
      hunterAddress,
      amount: amountInPYUSD,
      txUrl: blockscoutUrl,
      message: 'No Farcaster account found for this wallet address'
    });

  } catch (error) {
    console.error('Error sending winner notification:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
