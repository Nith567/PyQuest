import { HypersyncClient, Decoder, LogField, JoinMode } from "@envio-dev/hypersync-client";

// Helper function to get Farcaster profile from wallet address
async function getFarcasterProfile(walletAddress) {
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
      return null;
    }

    const data = await response.json();
    const users = data[walletAddress.toLowerCase()];
    
    if (users && users.length > 0) {
      return {
        fid: users[0].fid,
        username: users[0].username,
        displayName: users[0].display_name,
        pfpUrl: users[0].pfp_url
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching Farcaster profile for ${walletAddress}:`, error);
    return null;
  }
}

// Contract address and event signatures
const CONTRACT_ADDRESS = "0xe1063c2aaB3b0BD817e92b9E37901f41Ac297a6f";

// Event signatures (topic0) - generated with cast sig-event
const BOUNTY_CREATED_TOPIC = "0xaa830c985894057f0d100743defcad006f0a1abc40d080c9a23acc9a81106849";
const BOUNTY_COMPLETED_TOPIC = "0x285d0f935b4d6592b80efc46cc3d9eb3e93e27fe245f0a6c2b5b9a9d04800ee7";
const BOUNTY_CANCELLED_TOPIC = "0xb9670bf4f2273686f771c9ab65309436df5ed75afa63eefec8b67640d8bcf72c";

export default async function handler(req, res) {
  try {
    // Create Hypersync client for Arbitrum with authentication
    const client = HypersyncClient.new({
      url: "https://arbitrum.hypersync.xyz",
      bearerToken: process.env.HYPER_SYNC_TOKEN
    });

    // Query all BountyCompleted events
    const query = {
      fromBlock: 0,
      logs: [{
        address: [CONTRACT_ADDRESS],
        topics: [[BOUNTY_COMPLETED_TOPIC]]
      }],
      fieldSelection: {
        log: [
          LogField.Address,
          LogField.Topic0,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3,
          LogField.Data
        ]
      },
      joinMode: JoinMode.JoinNothing
    };

    console.log('🔍 Querying Hypersync for bounty events...');
    const response = await client.get(query);
    
    console.log(`✅ Got ${response.data.logs.length} BountyCompleted events`);
    
    // Debug: log first event structure
    if (response.data.logs.length > 0) {
      console.log('First log structure:', JSON.stringify(response.data.logs[0], null, 2));
    }

    // Aggregate hunter stats
    const hunterStats = {};
    
    for (const log of response.data.logs) {
      // Decode log data
      // topics[0] = event signature (Topic0)
      // topics[1] = bountyId (indexed - Topic1)
      // topics[2] = hunter address (indexed - Topic2) - padded with zeros
      // data = amount (hex string)
      
      // Remove padding from address (last 40 chars = 20 bytes = address)
      const hunterAddress = '0x' + log.topics[2].slice(-40);
      const amount = BigInt(log.data);
      
      if (!hunterStats[hunterAddress]) {
        hunterStats[hunterAddress] = {
          address: hunterAddress,
          completedCount: 0,
          totalEarned: 0n
        };
      }
      
      hunterStats[hunterAddress].completedCount++;
      hunterStats[hunterAddress].totalEarned += amount;
    }

    // Convert to array and sort by totalEarned
    const leaderboardData = Object.values(hunterStats)
      .map(hunter => ({
        address: hunter.address,
        completedCount: hunter.completedCount,
        totalEarned: (Number(hunter.totalEarned) / 1000000).toFixed(4) // Convert from 6 decimals to PYUSD with 4 decimal places
      }))
      .sort((a, b) => Number(b.totalEarned) - Number(a.totalEarned))
      .slice(0, 10); // Top 10

    // Fetch Farcaster profiles for all hunters in parallel
    console.log('🔍 Fetching Farcaster profiles for leaderboard...');
    const profilePromises = leaderboardData.map(async (hunter) => {
      const profile = await getFarcasterProfile(hunter.address);
      return {
        ...hunter,
        fid: profile?.fid || null,
        username: profile?.username || null,
        displayName: profile?.displayName || null,
        pfpUrl: profile?.pfpUrl || null
      };
    });

    const leaderboard = await Promise.all(profilePromises);
    console.log(`✅ Fetched profiles for ${leaderboard.length} hunters`);

    // Calculate total stats
    const totalVolume = Object.values(hunterStats).reduce(
      (sum, hunter) => sum + hunter.totalEarned,
      0n
    );

    const stats = {
      totalBounties: response.data.logs.length,
      totalVolume: (Number(totalVolume) / 1000000).toFixed(4), // Show 4 decimal places
      uniqueHunters: Object.keys(hunterStats).length,
      leaderboard
    };

    res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Hypersync error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
}
