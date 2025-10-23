import { HypersyncClient, LogField, JoinMode } from "@envio-dev/hypersync-client";

// Contract address and event signatures
const CONTRACT_ADDRESS = "0xe1063c2aaB3b0BD817e92b9E37901f41Ac297a6f";
const BOUNTY_COMPLETED_TOPIC = "0x285d0f935b4d6592b80efc46cc3d9eb3e93e27fe245f0a6c2b5b9a9d04800ee7";

// Track the last processed block
let lastProcessedBlock = null;

// Function to send notification to winner
async function notifyWinner(hunterAddress, amount, txHash) {
  try {
    const amountInPYUSD = (Number(amount) / 1000000).toFixed(4);
    const blockscoutUrl = `https://arbiscan.io/tx/${txHash}`;
    
    const notificationPayload = {
      notification: {
        title: "🎉 Bounty Completed!",
        body: `Congratulations! You earned ${amountInPYUSD} PYUSD for completing a bounty!`,
        target_url: blockscoutUrl,
        uuid: crypto.randomUUID()
      }
    };

    console.log(`🔔 Notifying winner ${hunterAddress}: ${amountInPYUSD} PYUSD`);
    
    // TODO: You need to get the FID from the hunter's wallet address
    // For now, just log the notification
    console.log('Notification payload:', notificationPayload);
    
    // If you have Neynar API integration:
    // const response = await fetch('https://api.neynar.com/v2/farcaster/frame/notifications/', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': process.env.VITE_NEYNAR_API_KEY
    //   },
    //   body: JSON.stringify(notificationPayload)
    // });
    
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
}

// Start streaming events
async function startEventStream() {
  try {
    console.log('🚀 Starting HyperSync event stream for bounty completions...');
    
    const client = HypersyncClient.new({
      url: "https://arbitrum.hypersync.xyz",
      bearerToken: process.env.HYPER_SYNC_TOKEN
    });

    // Get the latest block first to avoid processing old events
    if (!lastProcessedBlock) {
      const latestQuery = {
        fromBlock: 0,
        logs: [{
          address: [CONTRACT_ADDRESS],
          topics: [[BOUNTY_COMPLETED_TOPIC]]
        }],
        fieldSelection: {
          log: [LogField.BlockNumber]
        },
        joinMode: JoinMode.JoinNothing
      };
      
      const latestResponse = await client.get(latestQuery);
      if (latestResponse.data.logs.length > 0) {
        // Start from the latest event + 1 to avoid reprocessing
        const maxBlock = Math.max(...latestResponse.data.logs.map(log => log.blockNumber));
        lastProcessedBlock = maxBlock;
        console.log(`📍 Starting from block ${lastProcessedBlock}`);
      } else {
        lastProcessedBlock = 0;
      }
    }

    const query = {
      fromBlock: lastProcessedBlock,
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
          LogField.Data,
          LogField.TransactionHash,
          LogField.BlockNumber
        ]
      },
      joinMode: JoinMode.JoinNothing
    };

    const stream = await client.stream(query, {});
    
    console.log('✅ Stream connected! Listening for new bounty completions...');
    
    while (true) {
      const res = await stream.recv();
      
      if (res.data && res.data.logs && res.data.logs.length > 0) {
        console.log(`🎯 Received ${res.data.logs.length} new bounty completion(s)!`);
        
        for (const log of res.data.logs) {
          // Parse the event data
          const hunterAddress = '0x' + log.topics[2].slice(-40);
          const amount = BigInt(log.data);
          const txHash = log.transactionHash;
          
          console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 NEW BOUNTY COMPLETION!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hunter: ${hunterAddress}
Amount: ${(Number(amount) / 1000000).toFixed(4)} PYUSD
Tx: ${txHash}
Block: ${log.blockNumber}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          `);
          
          // Send notification to winner
          await notifyWinner(hunterAddress, amount, txHash);
        }
      }
      
      // Update the next block to query from
      if (res.nextBlock) {
        lastProcessedBlock = res.nextBlock;
      }
      
      // Small delay to avoid hammering the API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error('❌ Stream error:', error);
    // Retry after 5 seconds
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(startEventStream, 5000);
  }
}

// Start the stream
startEventStream();

export default async function handler(req, res) {
  res.status(200).json({ 
    status: 'Stream is running in background',
    lastProcessedBlock 
  });
}
